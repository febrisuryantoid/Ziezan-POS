
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [consoles, setConsoles] = useState<Console[]>(() => Storage.getConsoles());
  const [members, setMembers] = useState<Member[]>(() => Storage.getMembers());
  const [membershipConfigs, setMembershipConfigs] = useState<MembershipConfig[]>(() => Storage.getMemberships());
  const [transactions, setTransactions] = useState<Transaction[]>(() => Storage.getTransactions());
  const [settings, setSettings] = useState<AppSettings>(() => Storage.getSettings());
  
  // Flag to ensure we don't run auto-logic (like rank updates) on stale local data
  const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false);

  const { sendCommand, isConnected: isBtConnected } = useBluetooth();

  const refreshData = useCallback(() => {
    setConsoles(Storage.getConsoles());
    setMembers(Storage.getMembers());
    setMembershipConfigs(Storage.getMemberships());
    setTransactions(Storage.getTransactions());
    setSettings(Storage.getSettings());
  }, []);

  // Initial Data Load & Sync
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

    // Listen to local storage changes (multi-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('ziezan_')) refreshData();
    };
    
    // Listen to external data changes (from Realtime Supabase via syncService)
    const handleExternalChange = () => {
        console.log("External data change detected, refreshing context...");
        refreshData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('external-data-change', handleExternalChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('external-data-change', handleExternalChange);
    };
  }, [refreshData]);

  // --- AUTOMATIC MEMBERSHIP & BIRTHDAY CHECK ---
  useEffect(() => {
    // CRITICAL FIX: Only run this AFTER initial sync is done.
    // This prevents stale local data (e.g. 1 hour playtime) from overwriting fresh cloud data (5 hours)
    // by falsely marking the stale data as "synced: false".
    if (!isInitialSyncComplete || members.length === 0 || membershipConfigs.length === 0) return;
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    let hasUpdates = false;
    
    const sortedConfigs = [...membershipConfigs].sort((a, b) => b.minHours - a.minHours);

    const updatedMembers = members.map(member => {
        let updatedMember = { ...member };
        let changed = false;

        // 1. BIRTHDAY CHECK
        if (updatedMember.dateOfBirth) {
            const dob = new Date(updatedMember.dateOfBirth);
            if (dob.getMonth() === currentMonth && dob.getDate() === currentDate) {
                if (updatedMember.lastBirthdayBonusYear !== currentYear) {
                    const bonus = settings.birthdayBonusHours || 2;
                    updatedMember.freeHoursBalance += bonus;
                    updatedMember.lastBirthdayBonusYear = currentYear;
                    updatedMember.notes = (updatedMember.notes ? updatedMember.notes + '\n' : '') + `[System] HPBD ${currentYear}: +${bonus} Jam`;
                    changed = true;
                }
            }
        }

        // 2. AUTO RANK CHECK (STRICT MODE)
        let targetTierId = updatedMember.membershipId;
        const matchedConfig = sortedConfigs.find(config => updatedMember.totalPlayTime >= config.minHours);
        
        if (matchedConfig) {
            targetTierId = matchedConfig.id;
        } else {
            targetTierId = sortedConfigs[sortedConfigs.length - 1].id;
        }

        if (targetTierId !== updatedMember.membershipId) {
            updatedMember.membershipId = targetTierId;
            changed = true;
        }

        if (changed) {
            hasUpdates = true;
            updatedMember.synced = false;
            updatedMember.updatedAt = new Date().toISOString();
        }
        
        return updatedMember;
    });

    if (hasUpdates) {
        Storage.saveMembers(updatedMembers);
        setMembers(updatedMembers);
        syncService.syncNow();
    }
  }, [isInitialSyncComplete, members.length, membershipConfigs, settings.birthdayBonusHours]); 

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
    
    const updated = [...members, newMember];
    safeSave(() => Storage.saveMembers(updated));
    setMembers(updated);
    syncService.syncNow();
    return newId;
  };

  const updateMember = (member: Member) => {
    const updated = members.map(m => m.id === member.id ? { ...member, synced: false, updatedAt: new Date().toISOString() } : m);
    safeSave(() => Storage.saveMembers(updated));
    setMembers(updated);
    syncService.syncNow();
  };

  const deleteMember = (id: string): boolean => {
    const hasActiveTx = transactions.some(t => t.memberId === id && t.status === 'ACTIVE');
    if (hasActiveTx) {
        return false;
    }
    const updated = members.filter(m => m.id !== id);
    safeSave(() => Storage.saveMembers(updated));
    setMembers(updated);
    syncService.deleteMember(id);
    return true;
  };

  const upgradeMember = (memberId: string, newTierId: MembershipTierId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    updateMember({
        ...member,
        membershipId: newTierId,
        hoursProgressToNextBonus: 0,
        updatedAt: new Date().toISOString()
    });
  };

  const resetSeason = () => {
      const updatedMembers = members.map(m => {
          let newTier: MembershipTierId = 'WARRIOR';
          if (m.membershipId === 'MYTHICAL_IMMORTAL') newTier = 'MYTHICAL_GLORY';
          else if (m.membershipId === 'MYTHICAL_GLORY') newTier = 'MYTHICAL_HONOR';
          else if (m.membershipId === 'MYTHICAL_HONOR') newTier = 'MYTHIC';
          else if (m.membershipId === 'MYTHIC') newTier = 'LEGEND';
          else if (m.membershipId === 'LEGEND') newTier = 'EPIC';
          else if (m.membershipId === 'EPIC') newTier = 'GRANDMASTER';
          else if (m.membershipId === 'GRANDMASTER') newTier = 'ELITE';
          else if (m.membershipId === 'ELITE') newTier = 'WARRIOR';

          return {
              ...m,
              totalPlayTime: 0,
              membershipId: newTier,
              synced: false,
              updatedAt: new Date().toISOString()
          };
      });
      safeSave(() => Storage.saveMembers(updatedMembers));
      setMembers(updatedMembers);
      syncService.syncNow();
  };

  const startRental = (memberId: string, consoleId: string, duration: number, operator: string, paymentMethod: PaymentMethod) => {
    const consoleUnit = consoles.find(c => c.id === consoleId);
    const member = members.find(m => m.id === memberId);
    if (!consoleUnit || !member) return;

    let cost = duration * settings.hourlyRate;
    let discount = 0;
    let freeHoursUsed = 0;
    let finalPaymentMethod = paymentMethod;

    if (paymentMethod === 'BONUS') {
        if (member.freeHoursBalance >= duration) {
            freeHoursUsed = duration;
            discount = cost;
            cost = 0;
        } else {
            // Partial
            freeHoursUsed = member.freeHoursBalance;
            discount = freeHoursUsed * settings.hourlyRate;
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
      paymentMethod: finalPaymentMethod,
      status: 'ACTIVE',
      operatorName: operator || 'Unknown', 
      synced: false,
      updatedAt: new Date().toISOString()
    };

    const updatedMember = {
        ...member,
        freeHoursBalance: member.freeHoursBalance - freeHoursUsed,
        totalBonusHoursUsed: member.totalBonusHoursUsed + freeHoursUsed,
        synced: false,
        updatedAt: new Date().toISOString()
    };
    const newMembers = members.map(m => m.id === member.id ? updatedMember : m);
    setMembers(newMembers);
    safeSave(() => Storage.saveMembers(newMembers));

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
    const member = members.find(m => m.id === tx.memberId);
    
    let additionalDiscount = 0;
    let cost = tx.cost;
    let freeHoursDeductedNow = 0;

    if (finalPaymentMethod === 'BONUS' && tx.paymentMethod !== 'BONUS' && member) {
        if (member.freeHoursBalance >= tx.durationHours) {
            freeHoursDeductedNow = tx.durationHours;
            additionalDiscount = cost; 
            cost = 0; 
        } else {
            freeHoursDeductedNow = member.freeHoursBalance;
            additionalDiscount = freeHoursDeductedNow * settings.hourlyRate;
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

    if (member) {
        const currentConfig = membershipConfigs.find(c => c.id === member.membershipId) || membershipConfigs[0];
        const isBonusSession = updatedTx.paymentMethod === 'BONUS';
        
        let newProgress = member.hoursProgressToNextBonus;
        let newFreeBalance = member.freeHoursBalance - freeHoursDeductedNow; 

        if (!isBonusSession) {
            newProgress += tx.durationHours;
            if (newProgress >= currentConfig.bonusThreshold && currentConfig.bonusThreshold > 0) {
                const multipliers = Math.floor(newProgress / currentConfig.bonusThreshold);
                newFreeBalance += (multipliers * currentConfig.bonusReward);
                newProgress = newProgress % currentConfig.bonusThreshold;
            }
        }

        const newTotalPlayTime = member.totalPlayTime + tx.durationHours;
        let newTierId = member.membershipId;
        
        const sortedConfigs = [...membershipConfigs].sort((a, b) => b.minHours - a.minHours);
        const bestConfig = sortedConfigs.find(config => newTotalPlayTime >= config.minHours);
        if (bestConfig) {
            newTierId = bestConfig.id;
        }

        const updatedMember = {
            ...member,
            membershipId: newTierId,
            totalPlayTime: newTotalPlayTime,
            totalAmountPaid: member.totalAmountPaid + updatedTx.cost, 
            hoursProgressToNextBonus: newProgress,
            freeHoursBalance: newFreeBalance,
            totalBonusHoursUsed: member.totalBonusHoursUsed + freeHoursDeductedNow,
            synced: false,
            updatedAt: new Date().toISOString()
        };
        const newMembers = members.map(m => m.id === member.id ? updatedMember : m);
        setMembers(newMembers);
        safeSave(() => Storage.saveMembers(newMembers));
    }

    if (isBtConnected) sendCommand({ type: 'STOP' });
    if(tx.consoleId) wifiService.sendCommand(tx.consoleId, 'STOP');
    syncService.syncNow();
  };

  return (
    <DataContext.Provider value={{
      consoles, members, membershipConfigs, transactions, settings,
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
