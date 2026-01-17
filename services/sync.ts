import { supabase } from './supabaseClient';
import * as Storage from './storage';
import { Member, Console, Transaction } from '../types';

class SyncService {
  private isSyncing = false;
  private isCleaning = false;

  // --- MAIN SYNC FUNCTION ---
  public async syncNow() {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;
    window.dispatchEvent(new Event('sync-start'));

    try {
      // 1. PUSH: Send local changes to Cloud
      await Promise.all([
        this.syncConsolesToCloud(),
        this.syncMembersToCloud()
      ]);
      await this.syncTransactionsToCloud();
      
      // 2. OPTIMIZE: Clean old data
      this.runSmartCloudOptimizer();

      console.log('Cloud Sync (Push) completed');
    } catch (error) {
      console.error('Cloud Sync failed:', error);
    } finally {
      this.isSyncing = false;
      window.dispatchEvent(new Event('sync-end'));
    }
  }

  // --- PULL FUNCTION (RESTORE DATA) ---
  // Call this on app mount to get data from Cloud if Local is missing/stale
  public async pullFromCloud() {
      if (!navigator.onLine) return false;
      console.log('[Sync] Starting Pull from Cloud...');
      window.dispatchEvent(new Event('sync-start'));

      try {
          // 1. Pull Members
          const { data: cloudMembers, error: memErr } = await supabase.from('members').select('*');
          if (!memErr && cloudMembers) {
              const currentLocal = Storage.getMembers();
              const mappedMembers: Member[] = cloudMembers.map((m: any) => ({
                  id: m.id,
                  name: m.name,
                  nickname: m.nickname || m.name.split(' ')[0],
                  phone: m.phone,
                  address: m.address,
                  membershipId: m.membership_type || 'BASIC',
                  membershipExpiryDate: m.membership_expiry_date,
                  joinDate: m.joined_at,
                  totalPlayTime: m.total_hours_played || 0,
                  totalAmountPaid: m.total_amount_paid || 0,
                  hoursProgressToNextBonus: m.hours_progress_bonus || 0,
                  freeHoursBalance: m.bonus_balance || 0,
                  totalBonusHoursUsed: m.bonus_total_used || 0,
                  dateOfBirth: m.date_of_birth,
                  lastBirthdayBonusYear: m.last_birthday_bonus_year,
                  status: m.status || 'ACTIVE',
                  notes: m.notes,
                  photoUrl: m.photo_url,
                  synced: true
              }));
              // Merge: Prefer Local if it has unsynced changes, otherwise Cloud
              const merged = this.mergeDatasets(currentLocal, mappedMembers);
              Storage.saveMembers(merged);
          }

          // 2. Pull Consoles
          const { data: cloudConsoles, error: conErr } = await supabase.from('consoles').select('*');
          if (!conErr && cloudConsoles) {
              const currentLocal = Storage.getConsoles();
              const mappedConsoles: Console[] = cloudConsoles.map((c: any) => ({
                  id: c.id,
                  name: c.name,
                  status: c.status,
                  totalHoursUsed: c.total_hours_used || 0,
                  currentSessionId: c.current_session_id,
                  synced: true
              }));
              const merged = this.mergeDatasets(currentLocal, mappedConsoles);
              Storage.saveConsoles(merged);
          }

          // 3. Pull Transactions (Limit to recent 500 to save bandwidth)
          const { data: cloudTx, error: txErr } = await supabase
            .from('transactions')
            .select('*')
            .order('start_time', { ascending: false })
            .limit(500);

          if (!txErr && cloudTx) {
              const currentLocal = Storage.getTransactions();
              const mappedTx: Transaction[] = cloudTx.map((t: any) => ({
                  id: t.id,
                  consoleId: t.console_id,
                  memberId: t.member_id,
                  consoleName: t.console_name,
                  memberName: t.member_name,
                  startTime: t.start_time,
                  endTime: t.end_time,
                  durationHours: t.duration_hours,
                  cost: t.cost,
                  discountApplied: t.discount_applied,
                  paymentMethod: t.payment_method,
                  status: t.status,
                  operatorName: t.operator_name,
                  synced: true
              }));
              // For transactions, we usually just want to fill gaps
              const merged = this.mergeDatasets(currentLocal, mappedTx);
              Storage.saveTransactions(merged);
          }

          console.log('[Sync] Pull complete. Data restored from Cloud.');
          return true;

      } catch (e) {
          console.error('[Sync] Pull failed:', e);
          return false;
      } finally {
          window.dispatchEvent(new Event('sync-end'));
      }
  }

  // Helper to merge Cloud data into Local data
  // Logic: If Local item has 'synced: false', keep Local (it has newer edits). 
  // Else, overwrite with Cloud (source of truth).
  private mergeDatasets<T extends { id: string, synced?: boolean }>(local: T[], cloud: T[]): T[] {
      const mergedMap = new Map<string, T>();

      // 1. Put Cloud data first
      cloud.forEach(item => mergedMap.set(item.id, item));

      // 2. Overlay Local data ONLY if it hasn't been synced yet (pending changes)
      local.forEach(item => {
          if (item.synced === false) {
              mergedMap.set(item.id, item);
          } else if (!mergedMap.has(item.id)) {
              // If it exists locally but not in cloud (and marked synced), 
              // it might have been deleted on cloud? 
              // For safety in this app, we keep it locally.
              mergedMap.set(item.id, item);
          }
      });

      return Array.from(mergedMap.values());
  }

  // --- SMART OPTIMIZER LOGIC ---
  private async runSmartCloudOptimizer() {
      if (this.isCleaning) return;
      this.isCleaning = true;

      try {
          const settings = Storage.getSettings();
          const retentionDays = settings.cloudRetentionDays || 90;

          if (retentionDays <= 0) {
              this.isCleaning = false;
              return;
          }

          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
          const cutoffISO = cutoffDate.toISOString();

          await supabase
            .from('transactions')
            .delete({ count: 'exact' })
            .lt('start_time', cutoffISO)
            .eq('status', 'COMPLETED');

      } catch (err) {
          console.error('[Smart Optimizer] Error:', err);
      } finally {
          this.isCleaning = false;
      }
  }

  private async syncConsolesToCloud() {
    const consoles = Storage.getConsoles();
    if (consoles.length === 0) return;

    // Only send what has changed? Currently sending all for simplicity/integrity
    const payload = consoles.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        total_hours_used: c.totalHoursUsed,
        current_session_id: c.currentSessionId || null,
        updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('consoles').upsert(payload);
    if (error) console.error('Error syncing consoles:', error);
  }

  private async syncMembersToCloud() {
    const members = Storage.getMembers();
    // Only upsert unsynced members to save bandwidth
    const unsyncedMembers = members.filter(m => !m.synced);
    if (unsyncedMembers.length === 0) return;

    const payload = unsyncedMembers.map(m => ({
      id: m.id,
      name: m.name,
      nickname: m.nickname,
      phone: m.phone,
      address: m.address,
      membership_type: m.membershipId,
      membership_expiry_date: m.membershipExpiryDate,
      joined_at: m.joinDate,
      total_hours_played: m.totalPlayTime,
      total_amount_paid: m.totalAmountPaid,
      hours_progress_bonus: m.hoursProgressToNextBonus,
      bonus_balance: m.freeHoursBalance,
      bonus_total_used: m.totalBonusHoursUsed,
      date_of_birth: m.dateOfBirth || null,
      last_birthday_bonus_year: m.lastBirthdayBonusYear || null,
      status: m.status,
      notes: m.notes,
      photo_url: m.photoUrl && m.photoUrl.length < 1000000 ? m.photoUrl : null, 
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('members').upsert(payload);

    if (!error) {
      const updatedMembers = members.map(m => 
        unsyncedMembers.find(um => um.id === m.id) ? { ...m, synced: true } : m
      );
      Storage.saveMembers(updatedMembers);
    } else {
      console.error('Error syncing members:', error);
    }
  }

  private async syncTransactionsToCloud() {
    const transactions = Storage.getTransactions();
    const unsyncedTx = transactions.filter(t => !t.synced);
    if (unsyncedTx.length === 0) return;

    const payload = unsyncedTx.map(t => ({
      id: t.id,
      console_id: t.consoleId,
      member_id: t.memberId,
      console_name: t.consoleName,
      member_name: t.memberName,
      start_time: t.startTime,
      end_time: t.endTime || null,
      duration_hours: t.durationHours,
      cost: t.cost,
      discount_applied: t.discountApplied,
      payment_method: t.paymentMethod,
      status: t.status,
      operator_name: t.operatorName,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('transactions').upsert(payload);

    if (!error) {
      const updatedTx = transactions.map(t => 
        unsyncedTx.find(ut => ut.id === t.id) ? { ...t, synced: true } : t
      );
      Storage.saveTransactions(updatedTx);
    } else {
      console.error('Error syncing transactions:', error);
    }
  }
}

export const syncService = new SyncService();

// Auto-sync listener
window.addEventListener('online', () => {
  console.log('Network Online. Triggering sync...');
  syncService.syncNow();
});