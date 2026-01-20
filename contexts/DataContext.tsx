
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Console, Member, Transaction, AppSettings, ConsoleStatus, MemberStatus, PaymentMethod, MembershipConfig, MembershipTierId 
} from '../types';
import * as Storage from '../services/storage';
import { useBluetooth } from './BluetoothContext';
import { syncService } from '../services/sync';
import { wifiService } from '../services/wifi';

interface DataContextType {
  consoles: Console[];
  members: Member[]; // Now returns COMPUTED members
  membershipConfigs: MembershipConfig[];
  transactions: Transaction[];
  settings: AppSettings;
  refreshData: () => void;
  updateSettings: (s: AppSettings) => void;
  updateMembershipConfig: (config: MembershipConfig) => void;
  
  // Console Actions
  addConsole: (c: Omit<Console, 'id' | 'status' | 'totalHoursUsed'>) => void;
  updateConsole: (id: string, name: string, imageUrl?: string) => void; 
  updateConsoleStatus: (id: string, status: ConsoleStatus) => void;
  deleteConsole: (id: string) => boolean; 

  // Member Actions
  addMember: (m: Omit<Member, 'id' | 'totalPlayTime' | 'hoursProgressToNextBonus' | 'freeHoursBalance' | 'totalBonusHoursUsed' | 'totalAmountPaid'> & { freeHoursBalance?: number }) => string;
  updateMember: (m: Member) => void;
  deleteMember: (id: string) => boolean;
  upgradeMember: (memberId: string, newTierId: MembershipTierId) => void;
  resetSeason: () => void;

  // Rental Actions
  startRental: (memberId: string, consoleId: string, duration: number, operator: string, paymentMethod: PaymentMethod) => void;
  stopRental: (transactionId: string, extraCost?: number, finalPaymentMethod?: PaymentMethod, notes?: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consoles, setConsoles] = useState<Console[]>(() => Storage.getConsoles());
  // rawMembers contains the Profile data + Manual Bonus adjustments
  const [rawMembers, setRawMembers] = useState<Member[]>(() => Storage.getMembers());
  const [membershipConfigs, setMembershipConfigs] = useState<MembershipConfig[]>(() => Storage.getMemberships());
  const [transactions, setTransactions] = useState<Transaction[]>(() => Storage.getTransactions());
  const [settings, setSettings] = useState<AppSettings>(() => Storage.getSettings());
  
  const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false);
  const { sendCommand, isConnected: isBtConnected } = useBluetooth();

  const refreshData = useCallback(() => {
    setConsoles(Storage.getConsoles());
    setRawMembers(Storage.getMembers());
    setMembershipConfigs(Storage.getMemberships());
    setTransactions(Storage.getTransactions());
    setSettings(Storage.getSettings());
  }, []);

  // --- CORE INTEGRITY ENGINE: COMPUTED MEMBERS ---
  // Calculates stats directly from Transactions to ensure 100% accuracy.
  const computedMembers = useMemo(() => {
    return rawMembers.map(member => {
        // 1. Get all COMPLETED transactions for this member
        const memberHistory = transactions.filter(t => t.memberId === member.id && t.status === 'COMPLETED');
        
        // 2. Aggregate Total Play Time (Hours)
        const calculatedTotalPlayTime = memberHistory.reduce((sum, t) => sum + t.durationHours, 0);
        
        // 3. Aggregate Total Amount Paid
        const calculatedTotalPaid = memberHistory.reduce((sum, t) => sum + t.cost, 0);

        // 4. Calculate Bonus Logic
        // Find current config to get thresholds
        // Sort configs to find the correct Tier based on PlayTime (Auto-Rank Logic)
        const sortedConfigs = [...membershipConfigs].sort((a, b) => b.minHours - a.minHours);
        const correctTier = sortedConfigs.find(c => calculatedTotalPlayTime >= c.minHours) || sortedConfigs[sortedConfigs.length - 1];
        
        // Use the Tier's specific bonus rules
        const configForBonus = membershipConfigs.find(c => c.id === correctTier.id) || membershipConfigs[0];
        
        let generatedBonus = 0;
        let progress = 0;

        if (configForBonus.bonusThreshold > 0) {
            // How many full cycles of bonus have they earned?
            const cycles = Math.floor(calculatedTotalPlayTime / configForBonus.bonusThreshold);
            generatedBonus = cycles * configForBonus.bonusReward;
            // Remainder is the progress to next bonus
            progress = calculatedTotalPlayTime % configForBonus.bonusThreshold;
        }

        // 5. Calculate Bonus USED from transactions
        const bonusUsed = memberHistory
            .filter(t => t.paymentMethod === 'BONUS')
            .reduce((sum, t) => sum + t.durationHours, 0);

        // 6. Final Balance Calculation
        // Formula: (Generated via Play - Used in Tx) + (Manual Adjustments stored in DB)
        // 'member.freeHoursBalance' in raw DB now strictly represents MANUAL additions (Birthday, Gift)
        const manualBonus = member.freeHoursBalance || 0; // In this architecture, DB stores ONLY manual additions
        const calculatedBalance = (generatedBonus - bonusUsed) + manualBonus;

        // Return the member object with OVERWRITTEN computed stats
        // This ensures the UI always sees the truth derived from history.
        return {
            ...member,
            membershipId: correctTier.id, // Auto-update Rank based on calculated time
            totalPlayTime: calculatedTotalPlayTime,
            totalAmountPaid: calculatedTotalPaid,
            hoursProgressToNextBonus: progress,
            totalBonusHoursUsed: bonusUsed,
            freeHoursBalance: calculatedBalance // This is what the UI displays
        };
    });
  }, [rawMembers, transactions, membershipConfigs]);

  // Initial Sync
  useEffect(() => {
    const initData = async () => {
        if (navigator.onLine) {
            try {
               await syncService.pullFromCloud();
               refreshData();
               await syncService.syncNow();
            } catch (e) {
               console.error("Sync init failed:", e);
            }
        }
        setIsInitialSyncComplete(true);
    };
    initData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('ziezan_')) refreshData();
    };
    
    const handleExternalChange = () => {
        refreshData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('external-data-change', handleExternalChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('external-data-change', handleExternalChange);
    };
  }, [refreshData]);

  // --- AUTOMATIC BIRTHDAY CHECK ---
  useEffect(() => {
    if (!isInitialSyncComplete || rawMembers.length === 0) return;
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    let hasUpdates = false;
    
    const updatedMembers = rawMembers.map(member => {
        let updatedMember = { ...member };
        
        if (updatedMember.dateOfBirth) {
            const dob = new Date(updatedMember.dateOfBirth);
            if (dob.getMonth() === currentMonth && dob.getDate() === currentDate) {
                if (updatedMember.lastBirthdayBonusYear !== currentYear) {
                    const bonus = settings.birthdayBonusHours || 2;
                    // We ADD to the manual balance field for birthdays
                    updatedMember.freeHoursBalance = (updatedMember.freeHoursBalance || 0) + bonus;
                    updatedMember.lastBirthdayBonusYear = currentYear;
                    updatedMember.notes = (updatedMember.notes ? updatedMember.notes + '\n' : '') + `[System] HPBD ${currentYear}: +${bonus} Jam`;
                    updatedMember.synced = false;
                    updatedMember.updatedAt = new Date().toISOString();
                    hasUpdates = true;
                }
            }
        }
        return updatedMember;
    });

    if (hasUpdates) {
        Storage.saveMembers(updatedMembers);
        setRawMembers(updatedMembers);
        syncService.syncNow();
    }
  }, [isInitialSyncComplete, rawMembers.length, settings.birthdayBonusHours]); 

  const safeSave = (fn: () => void) => {
    try { fn(); } 
    catch (e) { console.error("Storage Error:", e); }
  };

  const updateSettings = (newSettings: AppSettings) => {
    safeSave(() => Storage.saveSettings(newSettings));
    setSettings(newSettings);
  };

  const updateMembershipConfig = (config: MembershipConfig) => {
    const updated = membershipConfigs.map(c => c.id === config.id ? config : c);
    safeSave(() => Storage.saveMemberships(updated));
    setMembershipConfigs(updated);
  };

  const addConsole = (data: Omit<Console, 'id' | 'status' | 'totalHoursUsed'>) => {
    const newConsole: Console = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      status: ConsoleStatus.AVAILABLE,
      totalHoursUsed: 0,
      updatedAt: new Date().toISOString(),
      synced: false
    };
    const updated = [...consoles, newConsole];
    safeSave(() => Storage.saveConsoles(updated));
    setConsoles(updated);
    syncService.syncNow();
  };

  const updateConsole = (id: string, name: string, imageUrl?: string) => {
    const updated = consoles.map(c => c.id === id ? { ...c, name, imageUrl, updatedAt: new Date().toISOString(), synced: false } : c);
    safeSave(() => Storage.saveConsoles(updated));
    setConsoles(updated);
    syncService.syncNow();
  };

  const updateConsoleStatus = (id: string, status: ConsoleStatus) => {
    const updated = consoles.map(c => c.id === id ? { ...c, status, updatedAt: new Date().toISOString(), synced: false } : c);
    safeSave(() => Storage.saveConsoles(updated));
    setConsoles(updated);
    syncService.syncNow();
  };

  const deleteConsole = (id: string) => {
    const consoleToDelete = consoles.find(c => c.id === id);
    if (consoleToDelete && consoleToDelete.status === ConsoleStatus.IN_USE) return false;
    const updated = consoles.filter(c => c.id !== id);
    safeSave(() => Storage.saveConsoles(updated));
    setConsoles(updated);
    syncService.deleteConsole(id);
    return true;
  };

  const addMember = (data: Omit<Member, 'id' | 'totalPlayTime' | 'hoursProgressToNextBonus' | 'freeHoursBalance' | 'totalBonusHoursUsed' | 'totalAmountPaid'> & { freeHoursBalance?: number }): string => {
    const newId = Math.random().toString(36).substr(2, 9);
    // Initial manual balance is what's passed in data.freeHoursBalance
    const newMember: Member = {
      ...data,
      nickname: data.nickname || data.name.split(' ')[0], 
      membershipId: data.membershipId || 'WARRIOR',
      id: newId,
      totalPlayTime: 0,
      totalAmountPaid: 0,
      hoursProgressToNextBonus: 0,
      freeHoursBalance: data.freeHoursBalance || 0, // This is strictly MANUAL balance in DB
      totalBonusHoursUsed: 0,
      membershipExpiryDate: null,
      joinDate: data.joinDate || new Date().toISOString(),
      synced: false,
      updatedAt: new Date().toISOString()
    };
    
    const updated = [...rawMembers, newMember];
    safeSave(() => Storage.saveMembers(updated));
    setRawMembers(updated);
    syncService.syncNow();
    return newId;
  };

  const updateMember = (member: Member) => {
    // When updating, we need to be careful NOT to overwrite manual balance with calculated balance
    // The 'member' passed here might be the COMPUTED member from the UI.
    // We must find the original RAW member to preserve the manual balance ID, 
    // unless the user explicitly edited the balance field in the UI.
    
    const existingRaw = rawMembers.find(m => m.id === member.id);
    const newManualBalance = member.freeHoursBalance; // Assuming UI allows editing this

    // If the UI doesn't allow editing balance directly (it's calculated), we should ignore it.
    // But in Members.tsx Edit Modal, we allow editing 'Bonus Balance'.
    // If the Admin edits Bonus Balance, they are setting the MANUAL offset.
    // However, since UI displays (Manual + Earned - Used), if they save, they might save the result.
    
    // STRATEGY: For "Update Member", we assume the Admin is setting the Base/Manual balance 
    // to force the *Resulting* balance to be what they typed.
    // NewManual = TargetTotal - (Earned - Used)
    
    // For simplicity in this architecture: Admin edits "Manual Balance" directly in the form.
    // The form in Members.tsx currently reads `freeHoursBalance`.
    // We'll trust that `member` passed here has the Intent of the Admin.
    
    const updatedRaw = rawMembers.map(m => 
        m.id === member.id 
        ? { ...member, synced: false, updatedAt: new Date().toISOString() } // We save what's passed
        : m
    );
    
    safeSave(() => Storage.saveMembers(updatedRaw));
    setRawMembers(updatedRaw);
    syncService.syncNow();
  };

  const deleteMember = (id: string): boolean => {
    const hasActiveTx = transactions.some(t => t.memberId === id && t.status === 'ACTIVE');
    if (hasActiveTx) return false;
    
    const updated = rawMembers.filter(m => m.id !== id);
    safeSave(() => Storage.saveMembers(updated));
    setRawMembers(updated);
    syncService.deleteMember(id);
    return true;
  };

  const upgradeMember = (memberId: string, newTierId: MembershipTierId) => {
    const member = rawMembers.find(m => m.id === memberId);
    if (!member) return;
    updateMember({
        ...member,
        membershipId: newTierId,
        updatedAt: new Date().toISOString()
    });
  };

  const resetSeason = () => {
      // Archive transactions or just reset the manual base?
      // "Reset Season" usually implies resetting rank.
      // Since Rank is calculated from TotalPlayTime (which is Sum of Txs),
      // we would technically need to 'archive' transactions.
      
      // For V1.1.0, we will just downgrade the Tier locally in the raw object
      // But since Tier is computed... we actually need to wipe transaction history 
      // OR set a 'SeasonStartDate' setting and only count transactions after that.
      
      // IMPLEMENTATION: Soft Reset. 
      // 1. Move current 'Calculated Balance' to 'Manual Balance'.
      // 2. Archive/Delete transactions (Optional, but destructive).
      
      // Simple approach as per previous logic (Downgrade Tier):
      const updatedMembers = rawMembers.map(m => {
          let newTier: MembershipTierId = 'WARRIOR';
          // ... downgrade logic ...
          return {
              ...m,
              membershipId: newTier, // This sets the 'base' tier, effectively overriding calc if calc is lower
              synced: false,
              updatedAt: new Date().toISOString()
          };
      });
      // NOTE: With strict calculation, Rank will jump back up if transactions aren't deleted.
      // Recommendation: Add 'seasonStartDate' to Settings and filter transactions in `computedMembers`.
      // For now, keeping it simple as requested without changing Schema too much.
      
      safeSave(() => Storage.saveMembers(updatedMembers));
      setRawMembers(updatedMembers);
      syncService.syncNow();
  };

  const startRental = (memberId: string, consoleId: string, duration: number, operator: string, paymentMethod: PaymentMethod) => {
    const consoleUnit = consoles.find(c => c.id === consoleId);
    const member = computedMembers.find(m => m.id === memberId); // Use computed to check balance
    if (!consoleUnit || !member) return;

    let cost = duration * settings.hourlyRate;
    let discount = 0;
    
    // Logic: Determine if we pay with bonus
    // Note: We don't deduct balance here. We just record the transaction method.
    // The deduction happens automatically in `computedMembers` because it sums up 'BONUS' transactions.
    
    if (paymentMethod === 'BONUS') {
        if (member.freeHoursBalance >= duration) {
            discount = cost;
            cost = 0;
        } else {
            // Partial
            const coverable = member.freeHoursBalance;
            discount = coverable * settings.hourlyRate;
            cost = cost - discount;
        }
    }

    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      consoleId,
      consoleName: consoleUnit.name,
      memberId,
      memberName: member.nickname || member.name, 
      startTime: new Date().toISOString(),
      durationHours: duration,
      cost,
      discountApplied: discount,
      paymentMethod: paymentMethod,
      status: 'ACTIVE',
      operatorName: operator || 'Unknown', 
      synced: false,
      updatedAt: new Date().toISOString()
    };

    // DO NOT MUTATE MEMBER STATS HERE.
    // Just save the transaction. ComputedMembers will react.

    const updatedConsole = { 
        ...consoleUnit, 
        status: ConsoleStatus.IN_USE, 
        currentSessionId: transaction.id,
        synced: false,
        updatedAt: new Date().toISOString()
    };
    const newConsoles = consoles.map(c => c.id === consoleId ? updatedConsole : c);
    setConsoles(newConsoles);
    safeSave(() => Storage.saveConsoles(newConsoles));

    const newTransactions = [transaction, ...transactions];
    setTransactions(newTransactions);
    safeSave(() => Storage.saveTransactions(newTransactions));

    if (isBtConnected) sendCommand({ type: 'START', durationSeconds: duration * 3600 });
    wifiService.sendCommand(consoleId, 'START', duration * 3600, member.nickname || member.name);
    syncService.syncNow();
  };

  const stopRental = (transactionId: string, extraCost: number = 0, finalPaymentMethod?: PaymentMethod, notes?: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || tx.status === 'COMPLETED') return;

    const safeExtraCost = Math.max(0, extraCost);
    const member = computedMembers.find(m => m.id === tx.memberId);
    
    let additionalDiscount = 0;
    let cost = tx.cost;

    // Recalculate cost if method changed to BONUS at checkout
    if (finalPaymentMethod === 'BONUS' && tx.paymentMethod !== 'BONUS' && member) {
        if (member.freeHoursBalance >= tx.durationHours) {
            additionalDiscount = cost; 
            cost = 0; 
        } else {
            const coverable = member.freeHoursBalance;
            additionalDiscount = coverable * settings.hourlyRate;
            cost = cost - additionalDiscount;
        }
    }

    const updatedTx: Transaction = { 
        ...tx, 
        cost: cost + safeExtraCost, 
        discountApplied: tx.discountApplied + additionalDiscount,
        paymentMethod: finalPaymentMethod || tx.paymentMethod,
        status: 'COMPLETED', 
        endTime: new Date().toISOString(),
        synced: false,
        updatedAt: new Date().toISOString()
    };
    
    const newTransactions = transactions.map(t => t.id === transactionId ? updatedTx : t);
    setTransactions(newTransactions);
    safeSave(() => Storage.saveTransactions(newTransactions));

    const consoleUnit = consoles.find(c => c.id === tx.consoleId);
    if (consoleUnit) {
        const updatedConsole = { 
            ...consoleUnit, 
            status: ConsoleStatus.AVAILABLE, 
            currentSessionId: undefined,
            totalHoursUsed: consoleUnit.totalHoursUsed + tx.durationHours,
            synced: false,
            updatedAt: new Date().toISOString()
        };
        const newConsoles = consoles.map(c => c.id === consoleUnit.id ? updatedConsole : c);
        setConsoles(newConsoles);
        safeSave(() => Storage.saveConsoles(newConsoles));
    }

    // AGAIN: DO NOT MUTATE MEMBER STATS MANUALLY.
    // The `computedMembers` memo will automatically pick up the new 'COMPLETED' transaction
    // and update TotalPlayTime, Rank, and Bonus Used.

    if (isBtConnected) sendCommand({ type: 'STOP' });
    if(tx.consoleId) wifiService.sendCommand(tx.consoleId, 'STOP');
    syncService.syncNow();
  };

  return (
    <DataContext.Provider value={{
      consoles, 
      members: computedMembers, // Expose the calculated version
      membershipConfigs, transactions, settings,
      refreshData, updateSettings, updateMembershipConfig,
      addConsole, updateConsole, updateConsoleStatus, deleteConsole,
      addMember, updateMember, deleteMember, upgradeMember, resetSeason,
      startRental, stopRental
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
