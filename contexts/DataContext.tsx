
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

  // --- SOURCE OF TRUTH: COMPUTED MEMBERS ---
  const computedMembers = useMemo(() => {
    if (!Array.isArray(rawMembers) || !Array.isArray(membershipConfigs) || !Array.isArray(transactions)) return [];

    return rawMembers.map(member => {
        const memberHistory = transactions.filter(t => t.memberId === member.id && t.status === 'COMPLETED');
        
        // UPDATED LOGIC: Total Play Time ONLY counts CASH or QRIS. BONUS is excluded.
        const calculatedTotalPlayTime = memberHistory.reduce((sum, t) => {
            if (t.paymentMethod === 'BONUS') return sum;
            return sum + (t.durationHours || 0);
        }, 0);

        const calculatedTotalPaid = memberHistory.reduce((sum, t) => sum + (t.cost || 0), 0);

        // Defensive copy and sort for configs
        const sortedConfigs = [...membershipConfigs].sort((a, b) => b.minHours - a.minHours);
        const correctTier = sortedConfigs.find(c => calculatedTotalPlayTime >= c.minHours) || sortedConfigs[sortedConfigs.length - 1] || membershipConfigs[0];
        const configForBonus = membershipConfigs.find(c => c.id === correctTier?.id) || membershipConfigs[0];
        
        let generatedBonus = 0;
        let progress = 0;

        if (configForBonus && configForBonus.bonusThreshold > 0) {
            const cycles = Math.floor(calculatedTotalPlayTime / configForBonus.bonusThreshold);
            generatedBonus = cycles * configForBonus.bonusReward;
            progress = calculatedTotalPlayTime % configForBonus.bonusThreshold;
        }

        const bonusUsed = memberHistory
            .filter(t => t.paymentMethod === 'BONUS')
            .reduce((sum, t) => sum + (t.durationHours || 0), 0);

        const manualBonus = member.freeHoursBalance || 0;
        const calculatedBalance = (generatedBonus - bonusUsed) + manualBonus;

        return {
            ...member,
            membershipId: correctTier?.id || 'WARRIOR',
            totalPlayTime: calculatedTotalPlayTime,
            totalAmountPaid: calculatedTotalPaid,
            hoursProgressToNextBonus: progress,
            totalBonusHoursUsed: bonusUsed,
            freeHoursBalance: calculatedBalance
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
      const updatedMembers = rawMembers.map(m => ({
          ...m,
          membershipId: 'WARRIOR' as MembershipTierId,
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
