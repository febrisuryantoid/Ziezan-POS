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
  // FIX: Allow freeHoursBalance to be passed optionally
  addMember: (m: Omit<Member, 'id' | 'totalPlayTime' | 'hoursProgressToNextBonus' | 'freeHoursBalance' | 'totalBonusHoursUsed' | 'totalAmountPaid'> & { freeHoursBalance?: number }) => string;
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

  // --- INITIALIZATION & SYNC LOGIC ---
  useEffect(() => {
    const initData = async () => {
        // 1. Load what we have locally first (Fast Render)
        refreshData();

        // 2. CRITICAL: Pull from Cloud (Restore Data)
        if (navigator.onLine) {
            console.log("[DataContext] Pulling latest data from Cloud...");
            const success = await syncService.pullFromCloud();
            if (success) {
                refreshData(); // Refresh UI after pull
            }
            
            // 3. Then Push any pending changes
            syncService.syncNow();
        }
    };

    initData();
    
    // Cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('ziezan_')) {
        refreshData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshData]);

  // --- AUTOMATIC BIRTHDAY CHECKER ---
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
                    notes: (member.notes ? member.notes + '\n' : '') + `[System] Ulang Tahun ${currentYear}: Bonus +${bonus} Jam`,
                    synced: false
                };
            }
        }
        return member;
    });

    if (hasUpdates) {
        console.log("[System] Birthday bonuses applied to members.");
        Storage.saveMembers(updatedMembers);
        setMembers(updatedMembers);
        syncService.syncNow();
    }
  }, [members.length, settings.birthdayBonusHours]); 

  // --- SAFE STORAGE HELPER (Quota Handler) ---
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

  // --- ACTIONS ---

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
    if (consoleToDelete && consoleToDelete.status === ConsoleStatus.IN_USE) {
      return false; // Cannot delete active console
    }
    const updated = consoles.filter(c => c.id !== id);
    safeSave(() => Storage.saveConsoles(updated));
    setConsoles(updated);
    
    // TRIGGER CLOUD DELETE
    syncService.deleteConsole(id);
    
    return true;
  };

  const addMember = (data: Omit<Member, 'id' | 'totalPlayTime' | 'hoursProgressToNextBonus' | 'freeHoursBalance' | 'totalBonusHoursUsed' | 'totalAmountPaid'> & { freeHoursBalance?: number }): string => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newMember: Member = {
      ...data,
      // Default nickname to first word if not provided
      nickname: data.nickname || data.name.split(' ')[0], 
      membershipId: data.membershipId || 'BASIC',
      id: newId,
      totalPlayTime: 0,
      totalAmountPaid: 0,
      hoursProgressToNextBonus: 0,
      freeHoursBalance: data.freeHoursBalance || 0, // Allow manual init
      totalBonusHoursUsed: 0,
      membershipExpiryDate: null,
      joinDate: data.joinDate || new Date().toISOString(), // Allow custom join date or default to now
      synced: false // Pending sync
    };
    
    if (newMember.membershipId !== 'BASIC') {
      const config = membershipConfigs.find(c => c.id === newMember.membershipId);
      if (config && config.durationDays > 0) {
        const d = new Date(newMember.joinDate);
        d.setDate(d.getDate() + config.durationDays);
        newMember.membershipExpiryDate = d.toISOString();
      }
    }

    const updated = [...members, newMember];
    safeSave(() => Storage.saveMembers(updated));
    setMembers(updated);
    
    // Trigger sync
    syncService.syncNow();
    return newId;
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
    
    // TRIGGER CLOUD DELETE
    syncService.deleteMember(id);
  };

  const upgradeMember = (memberId: string, newTierId: MembershipTierId) => {
    const member = members.find(m => m.id === memberId);
    const config = membershipConfigs.find(c => c.id === newTierId);
    if (!member || !config) return;

    let newExpiry: string | null = null;
    if (config.durationDays > 0) {
        const d = new Date();
        d.setDate(d.getDate() + config.durationDays);
        newExpiry = d.toISOString();
    }

    updateMember({
        ...member,
        membershipId: newTierId,
        membershipExpiryDate: newExpiry,
        // Reset progress on tier change
        hoursProgressToNextBonus: 0 
    });
  };

  // --- RENTAL LOGIC ---

  const startRental = (memberId: string, consoleId: string, duration: number, operator: string, paymentMethod: PaymentMethod) => {
    const consoleUnit = consoles.find(c => c.id === consoleId);
    const member = members.find(m => m.id === memberId);
    if (!consoleUnit || !member) return;

    // 1. Calculate Cost & Bonus
    let cost = duration * settings.hourlyRate;
    let discount = 0;
    let freeHoursUsed = 0;
    let finalPaymentMethod = paymentMethod;

    // Apply Free Hours Logic (Redeem)
    if (member.freeHoursBalance > 0) {
        if (member.freeHoursBalance >= duration) {
            // Case A: Full coverage (e.g. 3h balance, 1h request -> freeHoursUsed = 1, Cost = 0)
            freeHoursUsed = duration;
            discount = cost;
            cost = 0;
            // FORCE PAYMENT METHOD TO 'BONUS' IF COST IS 0 DUE TO BONUS
            finalPaymentMethod = 'BONUS';
        } else {
            // Case B: Partial coverage (e.g. 1h balance, 3h request -> freeHoursUsed = 1, Cost = 2h price)
            freeHoursUsed = member.freeHoursBalance;
            discount = freeHoursUsed * settings.hourlyRate;
            cost = cost - discount;
        }
    }

    // 2. Create Transaction
    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      consoleId,
      consoleName: consoleUnit.name,
      memberId,
      memberName: member.name, // Record Full Name in history
      startTime: new Date().toISOString(),
      durationHours: duration,
      cost,
      discountApplied: discount,
      paymentMethod: finalPaymentMethod,
      status: 'ACTIVE',
      operatorName: operator,
      synced: false
    };

    // 3. Update Member (Deduct Bonus Balance immediately)
    // Note: Playtime accumulation happens on STOP, but bonus deduction happens on START
    const updatedMember = {
        ...member,
        freeHoursBalance: member.freeHoursBalance - freeHoursUsed,
        totalBonusHoursUsed: member.totalBonusHoursUsed + freeHoursUsed,
        synced: false
    };
    const newMembers = members.map(m => m.id === member.id ? updatedMember : m);
    setMembers(newMembers);
    safeSave(() => Storage.saveMembers(newMembers));

    // 4. Update Console
    const updatedConsole = { 
        ...consoleUnit, 
        status: ConsoleStatus.IN_USE, 
        currentSessionId: transaction.id 
    };
    const newConsoles = consoles.map(c => c.id === consoleId ? updatedConsole : c);
    setConsoles(newConsoles);
    safeSave(() => Storage.saveConsoles(newConsoles));

    // 5. Save Transaction
    const newTransactions = [transaction, ...transactions];
    setTransactions(newTransactions);
    safeSave(() => Storage.saveTransactions(newTransactions));

    // 6. Trigger Hardware (Bluetooth/Wi-Fi)
    if (isBtConnected) {
        sendCommand({ type: 'START', durationSeconds: duration * 3600 });
    }
    // Send Cloud Command for TV Receiver
    wifiService.sendCommand(consoleId, 'START', duration * 3600, member.nickname || member.name);

    syncService.syncNow();
  };

  const stopRental = (transactionId: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || tx.status === 'COMPLETED') return;

    // 1. Close Transaction
    const updatedTx: Transaction = { 
        ...tx, 
        status: 'COMPLETED', 
        endTime: new Date().toISOString(),
        synced: false 
    };
    const newTransactions = transactions.map(t => t.id === transactionId ? updatedTx : t);
    setTransactions(newTransactions);
    safeSave(() => Storage.saveTransactions(newTransactions));

    // 2. Free Console & Add Usage Stats
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

    // 3. Update Member Loyalty (Add Playtime, Progress, & Revenue)
    const member = members.find(m => m.id === tx.memberId);
    if (member) {
        const config = membershipConfigs.find(c => c.id === member.membershipId) || membershipConfigs[0];
        
        // Calculate new progress
        let newProgress = member.hoursProgressToNextBonus + tx.durationHours;
        let newFreeBalance = member.freeHoursBalance;

        // Loyalty Rule Check
        if (newProgress >= config.bonusThreshold && config.bonusThreshold > 0) {
            const multipliers = Math.floor(newProgress / config.bonusThreshold);
            newFreeBalance += (multipliers * config.bonusReward);
            newProgress = newProgress % config.bonusThreshold;
        }

        const updatedMember = {
            ...member,
            totalPlayTime: member.totalPlayTime + tx.durationHours,
            totalAmountPaid: member.totalAmountPaid + tx.cost,
            hoursProgressToNextBonus: newProgress,
            freeHoursBalance: newFreeBalance,
            synced: false
        };
        const newMembers = members.map(m => m.id === member.id ? updatedMember : m);
        setMembers(newMembers);
        safeSave(() => Storage.saveMembers(newMembers));
    }

    // 4. Trigger Hardware Off
    if (isBtConnected) {
        sendCommand({ type: 'STOP' });
    }
    // Send Cloud Command
    if(tx.consoleId) {
        wifiService.sendCommand(tx.consoleId, 'STOP');
    }

    syncService.syncNow();
  };

  return (
    <DataContext.Provider value={{
      consoles,
      members,
      membershipConfigs,
      transactions,
      settings,
      refreshData,
      updateSettings,
      updateMembershipConfig,
      addConsole,
      updateConsole,
      updateConsoleStatus,
      deleteConsole,
      addMember,
      updateMember,
      deleteMember,
      upgradeMember,
      startRental,
      stopRental
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