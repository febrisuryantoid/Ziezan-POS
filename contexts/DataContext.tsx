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
  updateConsole: (id: string, name: string) => void; 
  updateConsoleStatus: (id: string, status: ConsoleStatus) => void;
  deleteConsole: (id: string) => boolean; 

  // Member Actions
  addMember: (m: Omit<Member, 'id' | 'totalPlayTime' | 'hoursProgressToNextBonus' | 'freeHoursBalance' | 'totalBonusHoursUsed' | 'totalAmountPaid'>) => void;
  updateMember: (m: Member) => void;
  deleteMember: (id: string) => void;
  upgradeMember: (memberId: string, newTierId: MembershipTierId) => void;

  // Rental Actions
  startRental: (memberId: string, consoleId: string, duration: number, operator: string, paymentMethod: PaymentMethod) => void;
  stopRental: (transactionId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [membershipConfigs, setMembershipConfigs] = useState<MembershipConfig[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(Storage.getSettings());
  
  // Access Bluetooth
  const { sendCommand, isConnected: isBtConnected } = useBluetooth();

  const refreshData = useCallback(() => {
    setConsoles(Storage.getConsoles());
    setMembers(Storage.getMembers());
    setMembershipConfigs(Storage.getMemberships());
    setTransactions(Storage.getTransactions());
    setSettings(Storage.getSettings());
  }, []);

  useEffect(() => {
    refreshData();
    // Try to sync on load if online
    if (navigator.onLine) {
        syncService.syncNow();
    }
    
    // Cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('ziezan_')) {
        refreshData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshData]);

  // --- CHECK BIRTHDAYS AUTOMATICALLY ---
  useEffect(() => {
    if (members.length === 0) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    const currentDate = today.getDate();

    let hasUpdates = false;
    const updatedMembers = members.map(member => {
        if (!member.dateOfBirth) return member;

        const dob = new Date(member.dateOfBirth);
        // Check if today matches Birthday Month & Day
        if (dob.getMonth() === currentMonth && dob.getDate() === currentDate) {
            // Check if bonus already given this year
            if (member.lastBirthdayBonusYear !== currentYear) {
                hasUpdates = true;
                const bonus = settings.birthdayBonusHours || 2;
                return {
                    ...member,
                    freeHoursBalance: member.freeHoursBalance + bonus,
                    lastBirthdayBonusYear: currentYear,
                    notes: (member.notes || '') + `\n[System] Birthday Gift ${currentYear}: +${bonus} Hours`,
                    synced: false
                };
            }
        }
        return member;
    });

    if (hasUpdates) {
        console.log("Birthday bonuses applied!");
        Storage.saveMembers(updatedMembers);
        setMembers(updatedMembers);
        syncService.syncNow();
    }
  }, [members.length, settings.birthdayBonusHours]); // Run when member count changes or settings change, but also implicitly on mount via refreshData

  // --- SAFE STORAGE HELPER ---
  const safeSave = (fn: () => void) => {
    try {
        fn();
    } catch (e) {
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
            alert("Penyimpanan penuh! Hapus beberapa data member atau foto untuk melanjutkan.");
        } else {
            console.error("Storage Error:", e);
        }
    }
  };

  // --- Actions ---

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

  const updateConsole = (id: string, name: string) => {
    const updated = consoles.map(c => c.id === id ? { ...c, name } : c);
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
    if (consoleToDelete && consoleToDelete.status === ConsoleStatus.IN_USE) {
      return false; // Cannot delete active console
    }
    const updated = consoles.filter(c => c.id !== id);
    safeSave(() => Storage.saveConsoles(updated));
    setConsoles(updated);
    return true;
  };

  const addMember = (data: Omit<Member, 'id' | 'totalPlayTime' | 'hoursProgressToNextBonus' | 'freeHoursBalance' | 'totalBonusHoursUsed' | 'totalAmountPaid'>) => {
    const newMember: Member = {
      ...data,
      membershipId: data.membershipId || 'BASIC',
      id: Math.random().toString(36).substr(2, 9),
      totalPlayTime: 0,
      totalAmountPaid: 0,
      hoursProgressToNextBonus: 0,
      freeHoursBalance: 0,
      totalBonusHoursUsed: 0,
      membershipExpiryDate: null,
      synced: false // Pending sync
    };
    
    if (newMember.membershipId !== 'BASIC') {
      const config = membershipConfigs.find(c => c.id === newMember.membershipId);
      if (config && config.durationDays > 0) {
        const d = new Date();
        d.setDate(d.getDate() + config.durationDays);
        newMember.membershipExpiryDate = d.toISOString();
      }
    }

    const updated = [...members, newMember];
    safeSave(() => Storage.saveMembers(updated));
    setMembers(updated);
    
    // Trigger sync
    syncService.syncNow();
  };

  const updateMember = (member: Member) => {
    const updated = members.map(m => m.id === member.id ? { ...member, synced: false } : m);
    safeSave(() => Storage.saveMembers(updated));
    setMembers(updated);
    syncService.syncNow();
  };

  const deleteMember = (id: string) => {
    const updated = members.filter(m => m.id !== id);
    safeSave(() => Storage.saveMembers(updated));
    setMembers(updated);
    // Note: Deletes also need sync logic (soft delete) ideally
  };

  const upgradeMember = (memberId: string, newTierId: MembershipTierId) => {
    const config = membershipConfigs.find(c => c.id === newTierId);
    if (!config) return;

    let newExpiry: string | null = null;
    if (config.durationDays > 0) {
      const d = new Date();
      d.setDate(d.getDate() + config.durationDays);
      newExpiry = d.toISOString();
    }

    const updatedMembers = members.map(m => 
      m.id === memberId ? { 
        ...m, 
        membershipId: newTierId, 
        membershipExpiryDate: newExpiry,
        synced: false 
      } : m
    );

    safeSave(() => Storage.saveMembers(updatedMembers));
    setMembers(updatedMembers);
    syncService.syncNow();
  }

  const startRental = (memberId: string, consoleId: string, duration: number, operator: string, paymentMethod: PaymentMethod) => {
    const durationSeconds = duration * 3600;
    const memberName = members.find(m => m.id === memberId)?.name || 'Unknown';

    // PRIORITY 1: REMOTE CONTROL (BLUETOOTH + WIFI/CLOUD)
    // Send to Bluetooth
    if (isBtConnected) {
        sendCommand({ type: 'START', durationSeconds });
    }
    // Send to Wi-Fi / Cloud
    wifiService.sendCommand(consoleId, 'START', durationSeconds, memberName);

    let member = members.find(m => m.id === memberId);
    if (!member) return;
    
    // 1. Check Membership Expiry
    let updatedMembers = [...members];
    if (member.membershipId !== 'BASIC' && member.membershipExpiryDate) {
      if (new Date() > new Date(member.membershipExpiryDate)) {
        member = { ...member, membershipId: 'BASIC', membershipExpiryDate: null, synced: false };
        updatedMembers = members.map(m => m.id === memberId ? member! : m);
      }
    }

    // 2. Calculate Cost
    let hoursToPay = duration;
    let freeHoursUsed = 0;

    if (member.freeHoursBalance > 0) {
      if (member.freeHoursBalance >= duration) {
        freeHoursUsed = duration;
        hoursToPay = 0;
      } else {
        freeHoursUsed = member.freeHoursBalance;
        hoursToPay = duration - member.freeHoursBalance;
      }
    }

    const cost = hoursToPay * settings.hourlyRate;
    const discount = freeHoursUsed * settings.hourlyRate;

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      consoleId,
      consoleName: consoles.find(c => c.id === consoleId)?.name || 'Unknown',
      memberId,
      memberName: member.name,
      startTime: new Date().toISOString(),
      durationHours: duration,
      cost,
      discountApplied: discount,
      paymentMethod,
      status: 'ACTIVE',
      operatorName: operator,
      synced: false // Pending Sync
    };

    const updatedConsoles = consoles.map(c => 
      c.id === consoleId ? { ...c, status: ConsoleStatus.IN_USE, currentSessionId: newTx.id } : c
    );
    
    updatedMembers = updatedMembers.map(m => 
      m.id === memberId ? { ...m, freeHoursBalance: m.freeHoursBalance - freeHoursUsed, synced: false } : m
    );

    // PRIORITY 2: LOCAL STORAGE
    safeSave(() => {
        Storage.saveTransactions([newTx, ...transactions]);
        Storage.saveConsoles(updatedConsoles);
        Storage.saveMembers(updatedMembers);
    });
    
    refreshData();

    // PRIORITY 3: BACKGROUND SYNC
    syncService.syncNow();
  };

  const stopRental = (transactionId: string) => {
    // PRIORITY 1: REMOTE CONTROL
    const tx = transactions.find(t => t.id === transactionId);
    
    // Bluetooth
    if (isBtConnected) {
        sendCommand({ type: 'STOP' });
    }
    
    // Wi-Fi / Cloud
    if (tx) {
        wifiService.sendCommand(tx.consoleId, 'STOP');
    }

    if (!tx || tx.status === 'COMPLETED') return;

    const updatedTx = transactions.map(t => 
      t.id === transactionId ? { 
          ...t, 
          status: 'COMPLETED' as const, 
          endTime: new Date().toISOString(),
          synced: false // Mark as unsynced so updated status goes to DB
      } : t
    );

    const updatedConsoles = consoles.map(c => 
      c.id === tx.consoleId ? { 
        ...c, 
        status: ConsoleStatus.AVAILABLE, 
        currentSessionId: undefined,
        totalHoursUsed: c.totalHoursUsed + tx.durationHours 
      } : c
    );

    const member = members.find(m => m.id === tx.memberId);
    let updatedMembers = members;

    if (member) {
      const tierConfig = membershipConfigs.find(c => c.id === member.membershipId) || membershipConfigs[0]; 
      const bonusThreshold = tierConfig.bonusThreshold;
      const bonusReward = tierConfig.bonusReward;

      const newTotalPlayTime = member.totalPlayTime + tx.durationHours;
      const newProgress = member.hoursProgressToNextBonus + tx.durationHours;
      const newTotalAmountPaid = (member.totalAmountPaid || 0) + tx.cost;
      
      const newFreeHoursEarned = Math.floor(newProgress / bonusThreshold) * bonusReward;
      const remainingProgress = newProgress % bonusThreshold;
      
      const freeUsedInThisTx = tx.durationHours - (tx.cost / settings.hourlyRate);

      updatedMembers = members.map(m => 
        m.id === tx.memberId ? {
          ...m,
          totalPlayTime: newTotalPlayTime,
          totalAmountPaid: newTotalAmountPaid,
          hoursProgressToNextBonus: remainingProgress,
          freeHoursBalance: m.freeHoursBalance + newFreeHoursEarned,
          totalBonusHoursUsed: (m.totalBonusHoursUsed || 0) + freeUsedInThisTx,
          synced: false
        } : m
      );
    }

    // PRIORITY 2: LOCAL STORAGE
    safeSave(() => {
        Storage.saveTransactions(updatedTx);
        Storage.saveConsoles(updatedConsoles);
        Storage.saveMembers(updatedMembers);
    });
    
    refreshData();

    // PRIORITY 3: BACKGROUND SYNC
    syncService.syncNow();
  };

  return (
    <DataContext.Provider value={{
      consoles, members, transactions, settings, membershipConfigs, refreshData,
      updateSettings, updateMembershipConfig, 
      addConsole, updateConsole, updateConsoleStatus, deleteConsole,
      addMember, updateMember, deleteMember, upgradeMember,
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