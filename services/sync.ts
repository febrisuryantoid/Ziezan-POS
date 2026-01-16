import { supabase } from './supabaseClient';
import { Transaction, Member, Console } from '../types';
import * as Storage from './storage';

class SyncService {
  private isSyncing = false;

  public async syncNow() {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;
    window.dispatchEvent(new Event('sync-start'));

    try {
      await this.syncMembers();
      await this.syncTransactions();
      // Consoles usually don't change much, but can be synced too
      // await this.syncConsoles();
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
      window.dispatchEvent(new Event('sync-end'));
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
      bonus_balance: m.freeHoursBalance,
      bonus_total_used: m.totalBonusHoursUsed,
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
      member_id: t.memberId,
      console_id: t.consoleId,
      play_hours_total: t.durationHours,
      total_price: t.cost,
      payment_method: t.paymentMethod,
      started_at: t.startTime,
      ended_at: t.endTime || null,
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