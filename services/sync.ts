import { supabase } from './supabaseClient';
import * as Storage from './storage';

class SyncService {
  private isSyncing = false;

  public async syncNow() {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;
    window.dispatchEvent(new Event('sync-start'));

    try {
      // Parallel sync for independent tables
      await Promise.all([
        this.syncConsoles(),
        this.syncMembers()
      ]);
      // Transactions usually depend on members/consoles being present (foreign keys), 
      // but upsert handles basic consistency. We sync transactions last to be safe.
      await this.syncTransactions();
      
      console.log('Cloud Sync completed successfully');
    } catch (error) {
      console.error('Cloud Sync failed:', error);
    } finally {
      this.isSyncing = false;
      window.dispatchEvent(new Event('sync-end'));
    }
  }

  private async syncConsoles() {
    const consoles = Storage.getConsoles();
    // We sync all consoles to ensure status (AVAILABLE/IN_USE) is up to date across devices
    // Optimization: In a real app, only sync those with `synced: false` or `updated_at` check.
    
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

    if (error) {
        console.error('Error syncing consoles:', error);
    }
  }

  private async syncMembers() {
    const members = Storage.getMembers();
    const unsyncedMembers = members.filter(m => !m.synced);

    if (unsyncedMembers.length === 0) return;

    // Map to DB structure (camelCase to snake_case)
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
      status: m.status,
      notes: m.notes,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('members').upsert(payload);

    if (!error) {
      // Mark as synced locally
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