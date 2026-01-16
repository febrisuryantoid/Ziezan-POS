import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Console, Member, Transaction, AppSettings, ConsoleStatus, MemberStatus, PaymentMethod, MembershipConfig, MembershipTierId 
} from '../types';
import * as Storage from '../services/storage';
import { useBluetooth } from './BluetoothContext';
import { syncService } from '../services/sync';

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

  // --- Actions ---

  const updateSettings = (newSettings: AppSettings) => {
    Storage.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const updateMembershipConfig = (config: MembershipConfig) => {
    const updated = membershipConfigs.map(c => c.id === config.id ? config : c);
    Storage.saveMemberships(updated);
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
    Storage.saveConsoles(updated);
    setConsoles(updated);
  };

  const updateConsole = (id: string, name: string) => {
    const updated = consoles.map(c => c.id === id ? { ...c, name } : c);
    Storage.saveConsoles(updated);
    setConsoles(updated);
  };

  const updateConsoleStatus = (id: string, status: ConsoleStatus) => {
    const updated = consoles.map(c => c.id === id ? { ...c, status } : c);
    Storage.saveConsoles(updated);
    setConsoles(updated);
  };

  const deleteConsole = (id: string) => {
    const consoleToDelete = consoles.find(c => c.id === id);
    if (consoleToDelete && consoleToDelete.status === ConsoleStatus.IN_USE) {
      return false; // Cannot delete active console
    }
    const updated = consoles.filter(c => c.id !== id);
    Storage.saveConsoles(updated);
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
    Storage.saveMembers(updated);
    setMembers(updated);
    
    // Trigger sync
    syncService.syncNow();
  };

  const updateMember = (member: Member) => {
    const updated = members.map(m => m.id === member.id ? { ...member, synced: false } : m);
    Storage.saveMembers(updated);
    setMembers(updated);
    syncService.syncNow();
  };

  const deleteMember = (id: string) => {
    const updated = members.filter(m => m.id !== id);
    Storage.saveMembers(updated);
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

    Storage.saveMembers(updatedMembers);
    setMembers(updatedMembers);
    syncService.syncNow();
  }

  const startRental = (memberId: string, consoleId: string, duration: number, operator: string, paymentMethod: PaymentMethod) => {
    // PRIORITY 1: BLUETOOTH CONTROL
    // Send command blindly, don't wait for success to block UI, but log it.
    if (isBtConnected) {
        sendCommand({ type: 'START', durationSeconds: duration * 3600 });
    }

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
    Storage.saveTransactions([newTx, ...transactions]);
    Storage.saveConsoles(updatedConsoles);
    Storage.saveMembers(updatedMembers);
    
    refreshData();

    // PRIORITY 3: BACKGROUND SYNC
    syncService.syncNow();
  };

  const stopRental = (transactionId: string) => {
    // PRIORITY 1: BLUETOOTH CONTROL
    if (isBtConnected) {
        sendCommand({ type: 'STOP' });
    }

    const tx = transactions.find(t => t.id === transactionId);
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
    Storage.saveTransactions(updatedTx);
    Storage.saveConsoles(updatedConsoles);
    Storage.saveMembers(updatedMembers);
    
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