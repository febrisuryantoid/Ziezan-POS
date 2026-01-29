
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
  members: Member[];
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
  adjustBonusHours: (memberId: string, amount: number) => void;
  upgradeMember: (memberId: string, newTierId: MembershipTierId) => void;
  resetSeason: () => void;

  // Rental Actions
  startRental: (memberId: string, consoleId: string, duration: number, operator: string, paymentMethod: PaymentMethod) => void;
  stopRental: (transactionId: string, extraCost?: number, finalPaymentMethod?: PaymentMethod, notes?: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // SAFE INITIALIZATION: Ensure we never start with undefined
  const [rawConsoles, setRawConsoles] = useState<Console[]>(() => Storage.getConsoles() || []);
  const [rawMembers, setRawMembers] = useState<Member[]>(() => Storage.getMembers() || []);
  const [membershipConfigs, setMembershipConfigs] = useState<MembershipConfig[]>(() => Storage.getMemberships() || []);
  const [transactions, setTransactions] = useState<Transaction[]>(() => Storage.getTransactions() || []);
  const [settings, setSettings] = useState<AppSettings>(() => Storage.getSettings());
  
  const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false);
  const { sendCommand, isConnected: isBtConnected } = useBluetooth();

  const refreshData = useCallback(() => {
    // FORCE ARRAYS on refresh
    setRawConsoles(Storage.getConsoles() || []);
    setRawMembers(Storage.getMembers() || []);
    setMembershipConfigs(Storage.getMemberships() || []);
    setTransactions(Storage.getTransactions() || []);
    setSettings(Storage.getSettings());
  }, []);

  // --- SOURCE OF TRUTH: COMPUTED CONSOLES ---
  const computedConsoles = useMemo(() => {
    if (!Array.isArray(rawConsoles) || !Array.isArray(transactions)) return [];

    return rawConsoles.map(console => {
        const activeTx = transactions.find(t => t.consoleId === console.id && t.status === 'ACTIVE');
        
        if (activeTx) {
            return {
                ...console,
                status: ConsoleStatus.IN_USE,
                currentSessionId: activeTx.id
            };
        }
        
        if (console.status === ConsoleStatus.IN_USE) {
            return {
                ...console,
                status: ConsoleStatus.AVAILABLE,
                currentSessionId: undefined
            };
        }

        return console;
    });
  }, [rawConsoles, transactions]);

  // --- SOURCE OF TRUTH: COMPUTED MEMBERS (CORE BUSINESS LOGIC) ---
  const computedMembers = useMemo(() => {
    if (!Array.isArray(rawMembers) || !Array.isArray(membershipConfigs) || !Array.isArray(transactions)) return [];

    return rawMembers.map(member => {
        // 1. Calculate History
        const memberHistory = transactions.filter(t => t.memberId === member.id && t.status === 'COMPLETED');
        
        // STRICT RULE: Only CASH or QRIS counts for Tier Progress
        const paidTransactions = memberHistory.filter(t => t.paymentMethod === 'CASH' || t.paymentMethod === 'QRIS');
        const calculatedTotalPlayTime = paidTransactions.reduce((sum, t) => sum + (t.durationHours || 0), 0);
        
        const calculatedTotalPaid = memberHistory.reduce((sum, t) => sum + (t.cost || 0), 0);

        // 2. Determine Tier based on PAID Hours
        const sortedConfigs = [...membershipConfigs].sort((a, b) => b.minHours - a.minHours);
        const correctTier = sortedConfigs.find(c => calculatedTotalPlayTime >= c.minHours) || sortedConfigs[sortedConfigs.length - 1] || membershipConfigs[0];
        
        // 3. Segmented Bonus Calculation (Progressive)
        let hoursForBonus = calculatedTotalPlayTime;
        let generatedBonus = 0;

        // Segment 1: Warrior - Grandmaster (0 - 30 hrs) -> Rate: 6h get 1
        const seg1 = Math.min(hoursForBonus, 30);
        generatedBonus += Math.floor(seg1 / 6);
        hoursForBonus -= seg1;

        // Segment 2: Epic - Mythic (31 - 120 hrs) -> Rate: 5h get 1
        // Note: 120 - 30 = 90 hours range
        if (hoursForBonus > 0) {
            const seg2 = Math.min(hoursForBonus, 90);
            generatedBonus += Math.floor(seg2 / 5);
            hoursForBonus -= seg2;
        }

        // Segment 3: Mythical Honor - Mythical Glory (121 - 300 hrs) -> Rate: 4h get 1
        // Note: 300 - 120 = 180 hours range
        if (hoursForBonus > 0) {
            const seg3 = Math.min(hoursForBonus, 180);
            generatedBonus += Math.floor(seg3 / 4);
            hoursForBonus -= seg3;
        }

        // Segment 4: Mythical Immortal (301+ hrs) -> Rate: 3h get 1
        if (hoursForBonus > 0) {
            generatedBonus += Math.floor(hoursForBonus / 3);
        }

        // 4. Calculate Usage and Balance
        const bonusUsed = memberHistory
            .filter(t => t.paymentMethod === 'BONUS')
            .reduce((sum, t) => sum + (t.durationHours || 0), 0);

        // Include manual adjustments (e.g. Birthday bonus) from the raw member data
        const manualBonus = member.freeHoursBalance || 0; 
        
        // Strict Cap: Max 3 hours stored
        const rawBalance = (generatedBonus - bonusUsed) + manualBonus;
        const cappedBalance = Math.max(0, Math.min(rawBalance, 3)); 

        // 5. Determine current cycle progress for UI
        let currentCycleTarget = 6; // Default
        if (calculatedTotalPlayTime >= 301) currentCycleTarget = 3;
        else if (calculatedTotalPlayTime >= 121) currentCycleTarget = 4;
        else if (calculatedTotalPlayTime >= 31) currentCycleTarget = 5;
        
        // Simplified progress calculation for the *current* active segment
        let progress = 0;
        if (calculatedTotalPlayTime < 30) progress = calculatedTotalPlayTime % 6;
        else if (calculatedTotalPlayTime < 120) progress = (calculatedTotalPlayTime - 30) % 5;
        else if (calculatedTotalPlayTime < 300) progress = (calculatedTotalPlayTime - 120) % 4;
        else progress = (calculatedTotalPlayTime - 300) % 3;

        return {
            ...member,
            membershipId: correctTier?.id || 'WARRIOR',
            totalPlayTime: calculatedTotalPlayTime, // SHOW PAID HOURS ONLY
            totalAmountPaid: calculatedTotalPaid,
            hoursProgressToNextBonus: progress, // Dynamic based on current tier rule
            totalBonusHoursUsed: bonusUsed,
            freeHoursBalance: cappedBalance
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

  // Automatic Birthday Check
  useEffect(() => {
    if (!isInitialSyncComplete || !Array.isArray(rawMembers) || rawMembers.length === 0) return;
    
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
                    // Adding to the manual balance component
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
    const updated = [...(rawConsoles || []), newConsole];
    safeSave(() => Storage.saveConsoles(updated));
    setRawConsoles(updated);
    syncService.syncNow();
  };

  const updateConsole = (id: string, name: string, imageUrl?: string) => {
    const updated = rawConsoles.map(c => c.id === id ? { ...c, name, imageUrl, updatedAt: new Date().toISOString(), synced: false } : c);
    safeSave(() => Storage.saveConsoles(updated));
    setRawConsoles(updated);
    syncService.syncNow();
  };

  const updateConsoleStatus = (id: string, status: ConsoleStatus) => {
    const updated = rawConsoles.map(c => c.id === id ? { ...c, status, updatedAt: new Date().toISOString(), synced: false } : c);
    safeSave(() => Storage.saveConsoles(updated));
    setRawConsoles(updated);
    syncService.syncNow();
  };

  const deleteConsole = (id: string) => {
    const consoleToDelete = computedConsoles.find(c => c.id === id);
    if (consoleToDelete && consoleToDelete.status === ConsoleStatus.IN_USE) return false;
    const updated = rawConsoles.filter(c => c.id !== id);
    safeSave(() => Storage.saveConsoles(updated));
    setRawConsoles(updated);
    syncService.deleteConsole(id);
    return true;
  };

  const addMember = (data: Omit<Member, 'id' | 'totalPlayTime' | 'hoursProgressToNextBonus' | 'freeHoursBalance' | 'totalBonusHoursUsed' | 'totalAmountPaid'> & { freeHoursBalance?: number }): string => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newMember: Member = {
      ...data,
      nickname: data.nickname || data.name.split(' ')[0], 
      membershipId: data.membershipId || 'WARRIOR',
      id: newId,
      totalPlayTime: 0,
      totalAmountPaid: 0,
      hoursProgressToNextBonus: 0,
      freeHoursBalance: data.freeHoursBalance || 0,
      totalBonusHoursUsed: 0,
      membershipExpiryDate: null,
      joinDate: data.joinDate || new Date().toISOString(),
      synced: false,
      updatedAt: new Date().toISOString()
    };
    
    const updated = [...(rawMembers || []), newMember];
    safeSave(() => Storage.saveMembers(updated));
    setRawMembers(updated);
    syncService.syncNow();
    return newId;
  };

  const updateMember = (member: Member) => {
    const updatedRaw = rawMembers.map(m => 
        m.id === member.id 
        ? { ...member, synced: false, updatedAt: new Date().toISOString() }
        : m
    );
    safeSave(() => Storage.saveMembers(updatedRaw));
    setRawMembers(updatedRaw);
    syncService.syncNow();
  };
  
  const adjustBonusHours = (memberId: string, amount: number) => {
    const updatedRaw = rawMembers.map(m => {
        if (m.id === memberId) {
            const currentBalance = m.freeHoursBalance || 0;
            const newBalance = Math.max(0, currentBalance + amount);
            const note = `[Admin] Bonus Adjustment: ${amount > 0 ? '+' : ''}${amount} Jam`;
            return {
                ...m,
                freeHoursBalance: newBalance,
                notes: (m.notes ? m.notes + '\n' : '') + note,
                synced: false,
                updatedAt: new Date().toISOString()
            };
        }
        return m;
    });
    safeSave(() => Storage.saveMembers(updatedRaw));
    setRawMembers(updatedRaw);
    syncService.syncNow();
  };

  const deleteMember = (id: string): boolean => {
    const hasActiveTx = transactions.some(t => t.memberId === id && t.status === 'ACTIVE');
    if (hasActiveTx) return false;
    
    // SOFT DELETE: Change status to INACTIVE instead of removing the record
    const updated = rawMembers.map(m => 
        m.id === id 
        ? { ...m, status: MemberStatus.INACTIVE, synced: false, updatedAt: new Date().toISOString() } 
        : m
    );
    safeSave(() => Storage.saveMembers(updated));
    setRawMembers(updated);
    syncService.syncNow(); // Let the regular sync handle the update to the cloud
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
      const updatedMembers = rawMembers.map(m => ({
          ...m,
          membershipId: 'WARRIOR' as MembershipTierId,
          totalPlayTime: 0, // Reset Total Play Time
          freeHoursBalance: 0, // Reset Bonuses
          totalBonusHoursUsed: 0,
          synced: false,
          updatedAt: new Date().toISOString()
      }));
      safeSave(() => Storage.saveMembers(updatedMembers));
      setRawMembers(updatedMembers);
      syncService.syncNow();
  };

  const startRental = (memberId: string, consoleId: string, duration: number, operator: string, paymentMethod: PaymentMethod) => {
    const consoleUnit = rawConsoles.find(c => c.id === consoleId);
    const member = computedMembers.find(m => m.id === memberId);
    if (!consoleUnit || !member) return;

    let cost = duration * settings.hourlyRate;
    let discount = 0;
    
    if (paymentMethod === 'BONUS') {
        if (member.freeHoursBalance >= duration) {
            discount = cost;
            cost = 0;
        } else {
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

    const updatedConsole = { 
        ...consoleUnit, 
        status: ConsoleStatus.IN_USE, 
        currentSessionId: transaction.id,
        synced: false,
        updatedAt: new Date().toISOString()
    };
    const newConsoles = rawConsoles.map(c => c.id === consoleId ? updatedConsole : c);
    setRawConsoles(newConsoles);
    safeSave(() => Storage.saveConsoles(newConsoles));

    const newTransactions = [transaction, ...(transactions || [])];
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

    const consoleUnit = rawConsoles.find(c => c.id === tx.consoleId);
    if (consoleUnit) {
        const updatedConsole = { 
            ...consoleUnit, 
            status: ConsoleStatus.AVAILABLE, 
            currentSessionId: undefined,
            totalHoursUsed: consoleUnit.totalHoursUsed + tx.durationHours,
            synced: false,
            updatedAt: new Date().toISOString()
        };
        const newConsoles = rawConsoles.map(c => c.id === consoleUnit.id ? updatedConsole : c);
        setRawConsoles(newConsoles);
        safeSave(() => Storage.saveConsoles(newConsoles));
    }

    if (isBtConnected) sendCommand({ type: 'STOP' });
    if(tx.consoleId) wifiService.sendCommand(tx.consoleId, 'STOP');
    syncService.syncNow();
  };

  return (
    <DataContext.Provider value={{
      consoles: computedConsoles, 
      members: computedMembers,
      membershipConfigs: membershipConfigs || [],
      transactions: transactions || [],
      settings,
      refreshData, updateSettings, updateMembershipConfig,
      addConsole, updateConsole, updateConsoleStatus, deleteConsole,
      addMember, updateMember, deleteMember, adjustBonusHours, upgradeMember, resetSeason,
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
