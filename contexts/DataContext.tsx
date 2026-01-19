
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
  deleteMember: (id: string) => boolean; // Changed return type to boolean for success/fail feedback
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
  
  const { sendCommand, isConnected: isBtConnected } = useBluetooth();

  const refreshData = useCallback(() => {
    setConsoles(Storage.getConsoles());
    setMembers(Storage.getMembers());
    setMembershipConfigs(Storage.getMemberships());
    setTransactions(Storage.getTransactions());
    setSettings(Storage.getSettings());
  }, []);

  useEffect(() => {
    const initData = async () => {
        refreshData();
        if (navigator.onLine) {
            try {
               const success = await syncService.pullFromCloud();
               if (success) refreshData(); 
               await syncService.syncNow();
            } catch (e) {
               console.error("Sync init failed:", e);
            }
        }
    };
    initData();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('ziezan_')) refreshData();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshData]);

  // --- AUTOMATIC MEMBERSHIP & BIRTHDAY CHECK ---
  useEffect(() => {
    if (members.length === 0 || membershipConfigs.length === 0) return;
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    let hasUpdates = false;
    
    // Sort configs DESCENDING (Highest minHours first)
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
        }
        
        return updatedMember;
    });

    if (hasUpdates) {
        Storage.saveMembers(updatedMembers);
        setMembers(updatedMembers);
        syncService.syncNow();
    }
  }, [members.length, membershipConfigs, settings.birthdayBonusHours]); 

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
      totalHoursUsed: 0
    };
    const updated = [...consoles, newConsole];
    safeSave(() => Storage.saveConsoles(updated));
    setConsoles(updated);
  };

  const updateConsole = (id: string, name: string, imageUrl?: string) => {
    const updated = consoles.map(c => c.id === id ? { ...c, name, imageUrl } : c);
    safeSave(() => Storage.saveConsoles(updated));
    setConsoles(updated);
  };

  const updateConsoleStatus = (id: string, status: ConsoleStatus) => {
    const updated = consoles.map(c => c.id === id ? { ...c, status } : c);
    safeSave(() => Storage.saveConsoles(updated));
    setConsoles(updated);
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
      synced: false 
    };
    
    const updated = [...members, newMember];
    safeSave(() => Storage.saveMembers(updated));
    setMembers(updated);
    syncService.syncNow();
    return newId;
  };

  const updateMember = (member: Member) => {
    const updated = members.map(m => m.id === member.id ? { ...member, synced: false } : m);
    safeSave(() => Storage.saveMembers(updated));
    setMembers(updated);
    syncService.syncNow();
  };

  // ROOT CAUSE FIX 1: Prevent deleting active members
  const deleteMember = (id: string): boolean => {
    // Check if member has active transaction
    const hasActiveTx = transactions.some(t => t.memberId === id && t.status === 'ACTIVE');
    if (hasActiveTx) {
        return false; // Fail safe
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
        hoursProgressToNextBonus: 0 
    });
  };

  const resetSeason = () => {
      const updatedMembers = members.map(m => {
          let newTier: MembershipTierId = 'WARRIOR';
          if (m.membershipId === 'MYTHIC') newTier = 'LEGEND';
          else if (m.membershipId === 'LEGEND') newTier = 'EPIC';
          else if (m.membershipId === 'EPIC') newTier = 'GRANDMASTER';
          else if (m.membershipId === 'GRANDMASTER') newTier = 'MASTER';
          else if (m.membershipId === 'MASTER') newTier = 'ELITE';
          else if (m.membershipId === 'ELITE') newTier = 'WARRIOR';

          return {
              ...m,
              totalPlayTime: 0,
              membershipId: newTier,
              synced: false
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

    if (member.freeHoursBalance > 0) {
        if (member.freeHoursBalance >= duration) {
            freeHoursUsed = duration;
            discount = cost;
            cost = 0;
            finalPaymentMethod = 'BONUS';
        } else {
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
      // CHANGE: Use Nickname as the primary identifier in Transaction Snapshot
      memberName: member.nickname || member.name, 
      startTime: new Date().toISOString(),
      durationHours: duration,
      cost,
      discountApplied: discount,
      paymentMethod: finalPaymentMethod,
      status: 'ACTIVE',
      operatorName: operator || 'Unknown', 
      synced: false
    };

    const updatedMember = {
        ...member,
        freeHoursBalance: member.freeHoursBalance - freeHoursUsed,
        totalBonusHoursUsed: member.totalBonusHoursUsed + freeHoursUsed,
        synced: false
    };
    const newMembers = members.map(m => m.id === member.id ? updatedMember : m);
    setMembers(newMembers);
    safeSave(() => Storage.saveMembers(newMembers));

    const updatedConsole = { 
        ...consoleUnit, 
        status: ConsoleStatus.IN_USE, 
        currentSessionId: transaction.id 
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

    // Sanitize extraCost to prevent negative values (fraud prevention)
    const safeExtraCost = Math.max(0, extraCost);

    const updatedTx: Transaction = { 
        ...tx, 
        cost: tx.cost + safeExtraCost, // Add sanitized extra cost (F&B, etc)
        paymentMethod: finalPaymentMethod || tx.paymentMethod,
        status: 'COMPLETED', 
        endTime: new Date().toISOString(),
        synced: false 
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
            totalHoursUsed: consoleUnit.totalHoursUsed + tx.durationHours 
        };
        const newConsoles = consoles.map(c => c.id === consoleUnit.id ? updatedConsole : c);
        setConsoles(newConsoles);
        safeSave(() => Storage.saveConsoles(newConsoles));
    }

    const member = members.find(m => m.id === tx.memberId);
    if (member) {
        const currentConfig = membershipConfigs.find(c => c.id === member.membershipId) || membershipConfigs[0];
        
        // BUG FIX (Bonus Farming): Bonus progress ONLY if PAID (CASH/QRIS), NOT for BONUS sessions.
        const isBonusSession = tx.paymentMethod === 'BONUS';
        
        let newProgress = member.hoursProgressToNextBonus;
        let newFreeBalance = member.freeHoursBalance;

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
            // FIX: totalAmountPaid MUST include the final transaction cost (including extraCost)
            totalAmountPaid: member.totalAmountPaid + updatedTx.cost, 
            hoursProgressToNextBonus: newProgress,
            freeHoursBalance: newFreeBalance,
            synced: false
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
