import { supabase } from './supabaseClient';
import * as Storage from './storage';

class SyncService {
  private isSyncing = false;
  private isCleaning = false;

  public async syncNow() {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;
    window.dispatchEvent(new Event('sync-start'));

    try {
      // 1. Core Sync (Upsert Logic)
      await Promise.all([
        this.syncConsoles(),
        this.syncMembers()
      ]);
      await this.syncTransactions();
      
      // 2. Smart Cloud Optimization (The "Lifetime" Feature)
      // This runs after sync to clean up the cloud without affecting local storage
      this.runSmartCloudOptimizer();

      console.log('Cloud Sync completed successfully');
    } catch (error) {
      console.error('Cloud Sync failed:', error);
    } finally {
      this.isSyncing = false;
      window.dispatchEvent(new Event('sync-end'));
    }
  }

  // --- SMART OPTIMIZER LOGIC ---
  private async runSmartCloudOptimizer() {
      if (this.isCleaning) return;
      this.isCleaning = true;

      try {
          const settings = Storage.getSettings();
          const retentionDays = settings.cloudRetentionDays || 90; // Default 90 days

          // If retention is 0, it means "Keep Forever" (Not recommended for Free Tier)
          if (retentionDays <= 0) {
              this.isCleaning = false;
              return;
          }

          // Calculate Cutoff Date
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
          const cutoffISO = cutoffDate.toISOString();

          console.log(`[Smart Optimizer] Pruning cloud transactions older than: ${cutoffISO}`);

          // Delete OLD COMPLETED transactions from Supabase
          // Note: This does NOT delete them from LocalStorage, ensuring historical data remains on device
          // but frees up Cloud Database quota.
          const { error, count } = await supabase
            .from('transactions')
            .delete({ count: 'exact' })
            .lt('start_time', cutoffISO)
            .eq('status', 'COMPLETED'); // Only delete completed ones

          if (error) {
              console.warn('[Smart Optimizer] Failed to prune:', error.message);
          } else {
              if (count && count > 0) {
                  console.log(`[Smart Optimizer] Successfully freed space! Deleted ${count} old transactions from cloud.`);
              }
          }

      } catch (err) {
          console.error('[Smart Optimizer] Error:', err);
      } finally {
          this.isCleaning = false;
      }
  }

  private async syncConsoles() {
    const consoles = Storage.getConsoles();
    if (consoles.length === 0) return;

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

  private async syncMembers() {
    const members = Storage.getMembers();
    const unsyncedMembers = members.filter(m => !m.synced);
    if (unsyncedMembers.length === 0) return;

    // Use a reduced payload for checking duplicates if needed, but upsert handles it.
    // OPTIMIZATION: Ensure photos (Base64) are not too huge. 
    // In Members.tsx we already compress them. Here we just send them.
    
    const payload = unsyncedMembers.map(m => ({
      id: m.id,
      name: m.name,
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
      // We assume the DB has a 'photo_url' text column. 
      // Compressing at UI level is key here.
      // If photo is too large, Supabase might reject payload (Request Entity Too Large).
      // Future improvement: Strip photo if length > 1MB.
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

  private async syncTransactions() {
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