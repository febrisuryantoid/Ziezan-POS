
import { supabase } from './supabaseClient';
import * as Storage from './storage';
import { Member, Console, Transaction } from '../types';

class SyncService {
  private isSyncing = false;
  private isCleaning = false;
  private channel: any = null;

  constructor() {
    this.initializeRealtime();
  }

  // --- REALTIME SUBSCRIPTION ---
  private initializeRealtime() {
    if (this.channel) return;

    this.channel = supabase.channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('[Realtime] Change received:', payload);
          // When any change happens in DB, trigger a pull to stay updated
          // Debounce this slightly in a real app, but direct call is fine for now
          this.pullFromCloud().then(() => {
             window.dispatchEvent(new Event('external-data-change'));
          });
        }
      )
      .subscribe();
  }

  // --- DELETE ACTIONS (Direct to Cloud) ---
  public async deleteMember(id: string) {
    if (!navigator.onLine) {
      console.warn("Offline: Cannot delete member from cloud immediately.");
      return;
    }
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) console.error("Failed to delete member from cloud:", error);
    else console.log("Member deleted from cloud:", id);
  }

  public async deleteConsole(id: string) {
    if (!navigator.onLine) return;
    const { error } = await supabase.from('consoles').delete().eq('id', id);
    if (error) console.error("Failed to delete console from cloud:", error);
    else console.log("Console deleted from cloud:", id);
  }

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

      // 3. PULL: Ensure we have latest data after push
      await this.pullFromCloud();

      console.log('Cloud Sync completed');
    } catch (error) {
      console.error('Cloud Sync failed:', error);
    } finally {
      this.isSyncing = false;
      window.dispatchEvent(new Event('sync-end'));
    }
  }

  // --- PULL FUNCTION (RESTORE DATA & RESOLVE CONFLICTS) ---
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
                  synced: true,
                  updatedAt: m.updated_at
              }));
              
              const merged = this.mergeMembers(currentLocal, mappedMembers);
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
                  synced: true,
                  updatedAt: c.updated_at
              }));
              const merged = this.mergeGeneric(currentLocal, mappedConsoles);
              Storage.saveConsoles(merged);
          }

          // 3. Pull Transactions (Limit to recent 500)
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
                  synced: true,
                  updatedAt: t.updated_at
              }));
              // For transactions, we prioritize Cloud as source of truth for completed ones
              const merged = this.mergeGeneric(currentLocal, mappedTx);
              Storage.saveTransactions(merged);
          }

          console.log('[Sync] Pull complete.');
          return true;

      } catch (e) {
          console.error('[Sync] Pull failed:', e);
          return false;
      } finally {
          window.dispatchEvent(new Event('sync-end'));
      }
  }

  // --- SMART MERGE LOGIC FOR MEMBERS ---
  // Fixes "Aldi 5 jam reset jadi 1 jam" issue
  private mergeMembers(local: Member[], cloud: Member[]): Member[] {
      const mergedMap = new Map<string, Member>();

      // Start with Cloud data as baseline
      cloud.forEach(item => mergedMap.set(item.id, item));

      local.forEach(localItem => {
          const cloudItem = mergedMap.get(localItem.id);

          if (!cloudItem) {
              // Exists locally but not in cloud.
              // If localItem.synced is false, it's a new item waiting to be pushed. Keep it.
              if (localItem.synced === false) {
                  mergedMap.set(localItem.id, localItem);
              }
              // If synced is true but missing in cloud, it might have been deleted remotely. 
              // For safety in offline-first, we keep it but mark for re-check? 
              // No, let's assume if it was synced before but gone now, it's deleted.
          } else {
              // Conflict Resolution
              if (localItem.synced === false) {
                  // Local has changes.
                  // CRITICAL CHECK: Playtime shouldn't decrease.
                  // If Cloud has significantly more playtime, local state is likely stale 
                  // (e.g. opened an old device that hadn't synced yet).
                  if (cloudItem.totalPlayTime > localItem.totalPlayTime) {
                      // Cloud wins because progress > stale local edit
                      mergedMap.set(cloudItem.id, cloudItem);
                  } else {
                      // Local wins (it's a genuine new update)
                      mergedMap.set(localItem.id, localItem);
                  }
              } else {
                  // Local thinks it's synced.
                  // If Cloud is newer (by updatedAt) or has more playtime, trust Cloud.
                  // Generally just trust Cloud here.
                  mergedMap.set(cloudItem.id, cloudItem);
              }
          }
      });

      return Array.from(mergedMap.values());
  }

  // Generic Merge for Consoles/Transactions
  private mergeGeneric<T extends { id: string, synced?: boolean, updatedAt?: string }>(local: T[], cloud: T[]): T[] {
      const mergedMap = new Map<string, T>();
      cloud.forEach(item => mergedMap.set(item.id, item));

      local.forEach(localItem => {
          const cloudItem = mergedMap.get(localItem.id);
          if (!cloudItem) {
              if (localItem.synced === false) mergedMap.set(localItem.id, localItem);
          } else {
              // If local has unsynced changes, verify timestamps if available
              if (localItem.synced === false) {
                  const localTime = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
                  const cloudTime = cloudItem.updatedAt ? new Date(cloudItem.updatedAt).getTime() : 0;
                  
                  // If Cloud is newer despite local "unsynced" flag (rare race condition), take cloud
                  if (cloudTime > localTime + 1000) { 
                      mergedMap.set(cloudItem.id, cloudItem);
                  } else {
                      mergedMap.set(localItem.id, localItem);
                  }
              }
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
    const unsynced = consoles.filter(c => !c.synced);
    if (unsynced.length === 0) return;

    const payload = unsynced.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        total_hours_used: c.totalHoursUsed,
        current_session_id: c.currentSessionId || null,
        updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('consoles').upsert(payload);
    if (!error) {
       const updated = consoles.map(c => unsynced.find(u => u.id === c.id) ? { ...c, synced: true, updatedAt: new Date().toISOString() } : c);
       Storage.saveConsoles(updated);
    }
  }

  private async syncMembersToCloud() {
    const members = Storage.getMembers();
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
        unsyncedMembers.find(um => um.id === m.id) ? { ...m, synced: true, updatedAt: new Date().toISOString() } : m
      );
      Storage.saveMembers(updatedMembers);
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
        unsyncedTx.find(ut => ut.id === t.id) ? { ...t, synced: true, updatedAt: new Date().toISOString() } : t
      );
      Storage.saveTransactions(updatedTx);
    }
  }
}

export const syncService = new SyncService();

window.addEventListener('online', () => {
  console.log('Network Online. Triggering sync...');
  syncService.syncNow();
});
