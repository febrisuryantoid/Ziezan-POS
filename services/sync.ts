
import { supabase } from './supabaseClient';
import * as Storage from './storage';
import { Member, Console, Transaction, AppSettings } from '../types';

class SyncService {
  private isSyncing = false;
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
          // Debounce sync to prevent spamming
          this.pullFromCloud().then(() => {
             window.dispatchEvent(new Event('external-data-change'));
          });
        }
      )
      .subscribe();
  }

  // --- DELETE ACTIONS (Direct to Cloud) ---
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
      console.log('[Sync] Starting Push...');
      // 1. PUSH: Send local changes to Cloud
      // Using sequence instead of Promise.all for settings to handle potential table absence cleanly
      await this.syncConsolesToCloud();
      await this.syncMembersToCloud();
      await this.syncSettingsToCloud(); 
      await this.syncTransactionsToCloud();
      
      // 2. PULL: Ensure we have latest data after push
      await this.pullFromCloud();

      console.log('[Sync] Completed successfully');
    } catch (error) {
      console.error('[Sync] Sync failed:', error);
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
                  membershipId: m.membership_type || 'WARRIOR',
                  membershipExpiryDate: m.membership_expiry_date,
                  joinDate: m.joined_at,
                  totalPlayTime: m.total_hours_played || 0,
                  totalAmountPaid: m.total_amount_played || 0,
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

          // 3. Pull Settings (Gracefully skip if table missing)
          const { data: cloudSettings, error: setErr } = await supabase.from('settings').select('*').limit(1).single();
          if (!setErr && cloudSettings) {
             const settings: AppSettings = {
                 businessName: cloudSettings.business_name,
                 businessAddress: cloudSettings.business_address,
                 businessPhone: cloudSettings.business_phone,
                 businessLogo: cloudSettings.business_logo,
                 hourlyRate: cloudSettings.hourly_rate,
                 cloudRetentionDays: cloudSettings.cloud_retention_days,
                 // Fix: Map birthday_bonus_hours from cloud correctly to AppSettings
                 birthdayBonusHours: cloudSettings.birthday_bonus_hours
             };
             Storage.saveSettings(settings);
          } else if (setErr && (setErr as any).code !== 'PGRST205') {
             console.warn('[Sync] Pull Settings Warning:', setErr.message);
          }

          // 4. Pull Transactions
          const { data: cloudTx, error: txErr } = await supabase
            .from('transactions')
            .select('*')
            .order('start_time', { ascending: false })
            .limit(5000);

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
              const merged = this.mergeGeneric(currentLocal, mappedTx);
              Storage.saveTransactions(merged);
          }

          console.log('[Sync] Pull complete.');
          return true;

      } catch (e) {
          console.error('[Sync] Pull failed (General Error):', e);
          return false;
      } finally {
          window.dispatchEvent(new Event('sync-end'));
      }
  }

  // --- SMART MERGE LOGIC FOR MEMBERS ---
  private mergeMembers(local: Member[], cloud: Member[]): Member[] {
      const mergedMap = new Map<string, Member>();
      cloud.forEach(item => mergedMap.set(item.id, item));

      local.forEach(localItem => {
          const cloudItem = mergedMap.get(localItem.id);

          if (!cloudItem) {
              mergedMap.set(localItem.id, { ...localItem, synced: false });
          } else {
              if (localItem.synced === false) {
                  const localTime = new Date(localItem.updatedAt || 0).getTime();
                  const cloudTime = new Date(cloudItem.updatedAt || 0).getTime();

                  if (cloudItem.totalPlayTime > localItem.totalPlayTime) {
                      mergedMap.set(cloudItem.id, cloudItem);
                  } else if (localTime > cloudTime) {
                      mergedMap.set(localItem.id, localItem);
                  } else {
                      mergedMap.set(cloudItem.id, cloudItem);
                  }
              } else {
                  mergedMap.set(cloudItem.id, cloudItem);
              }
          }
      });

      return Array.from(mergedMap.values());
  }

  private mergeGeneric<T extends { id: string, synced?: boolean, updatedAt?: string }>(local: T[], cloud: T[]): T[] {
      const mergedMap = new Map<string, T>();
      cloud.forEach(item => mergedMap.set(item.id, item));

      local.forEach(localItem => {
          const cloudItem = mergedMap.get(localItem.id);
          if (!cloudItem) {
              mergedMap.set(localItem.id, { ...localItem, synced: false });
          } else {
             if (localItem.synced === false) {
                const localTime = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
                const cloudTime = cloudItem.updatedAt ? new Date(cloudItem.updatedAt).getTime() : 0;
                if (cloudTime > localTime + 5000) { 
                    mergedMap.set(cloudItem.id, cloudItem);
                } else {
                    mergedMap.set(localItem.id, localItem);
                }
             }
          }
      });
      return Array.from(mergedMap.values());
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
      // Fixed: use correct property names from Member interface
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

  private async syncSettingsToCloud() {
     const settings = Storage.getSettings();
     const payload = {
        id: 1, 
        business_name: settings.businessName,
        business_address: settings.businessAddress,
        business_phone: settings.businessPhone,
        business_logo: settings.businessLogo,
        hourly_rate: settings.hourlyRate,
        cloud_retention_days: settings.cloudRetentionDays,
        birthday_bonus_hours: settings.birthdayBonusHours,
        updated_at: new Date().toISOString()
     };
     
     const { error } = await supabase.from('settings').upsert(payload);
     if (error && (error as any).code === 'PGRST205') {
        console.warn('[Sync] Supabase table "settings" missing. Skipping settings sync.');
     } else if (error) {
        console.error("[Sync] Failed to sync settings:", error);
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
      // Fix: Access paymentMethod from local Transaction object correctly
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
