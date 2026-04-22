
import { Console, Member, Transaction, AppSettings, User, Role, MembershipConfig } from '../types';

// Initial Data Seeding - CLEARED FOR PRODUCTION
const DEFAULT_CONSOLES: Console[] = [];

// STRICT 9-TIER CONFIGURATION (FINAL - DO NOT CHANGE)
// Note: bonusThreshold is kept for UI reference, but actual calculation logic is in DataContext
const DEFAULT_MEMBERSHIPS: MembershipConfig[] = [
  { 
    id: 'WARRIOR', 
    name: 'Warrior', 
    minHours: 0,
    price: 0, 
    durationDays: 365, 
    bonusThreshold: 6,
    bonusReward: 1,     
    isActive: true,
    color: 'slate'
  },
  { 
    id: 'ELITE', 
    name: 'Elite', 
    minHours: 6, 
    price: 0, 
    durationDays: 365, 
    bonusThreshold: 6,
    bonusReward: 1,    
    isActive: true,
    color: 'slate'
  },
  { 
    id: 'GRANDMASTER', 
    name: 'Grandmaster', 
    minHours: 16, 
    price: 0, 
    durationDays: 365, 
    bonusThreshold: 6,
    bonusReward: 1,    
    isActive: true,
    color: 'amber'
  },
  { 
    id: 'EPIC', 
    name: 'Epic', 
    minHours: 31, 
    price: 0, 
    durationDays: 365, 
    bonusThreshold: 5,
    bonusReward: 1,    
    isActive: true,
    color: 'emerald'
  },
  { 
    id: 'LEGEND', 
    name: 'Legend', 
    minHours: 51, 
    price: 0, 
    durationDays: 365, 
    bonusThreshold: 5,
    bonusReward: 1,    
    isActive: true,
    color: 'yellow'
  },
  { 
    id: 'MYTHIC', 
    name: 'Mythic', 
    minHours: 81, 
    price: 0, 
    durationDays: 365, 
    bonusThreshold: 5,
    bonusReward: 1,    
    isActive: true,
    color: 'indigo'
  },
  { 
    id: 'MYTHICAL_HONOR', 
    name: 'Mythical Honor', 
    minHours: 121, 
    price: 0, 
    durationDays: 365, 
    bonusThreshold: 4,
    bonusReward: 1,    
    isActive: true,
    color: 'blue'
  },
  { 
    id: 'MYTHICAL_GLORY', 
    name: 'Mythical Glory', 
    minHours: 181, 
    price: 0, 
    durationDays: 365, 
    bonusThreshold: 4,
    bonusReward: 1,    
    isActive: true,
    color: 'pink'
  },
  { 
    id: 'MYTHICAL_IMMORTAL', 
    name: 'Mythical Immortal', 
    minHours: 301, 
    price: 0, 
    durationDays: 365, 
    bonusThreshold: 3,
    bonusReward: 1,    
    isActive: true,
    color: 'rose'
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  businessName: 'Ziezan Station',
  businessAddress: 'Blok Nyomplong No.34, RT.09/RW.02, Padasuka, Baros, Kab. Serang.',
  businessPhone: '+62 8888-9077-31',
  businessLogo: 'https://beeimg.com/images/s77882238754.png',
  hourlyRate: 5000,
  cloudRetentionDays: 90,
  birthdayBonusHours: 2,
  enableAlarm: true,
  reminderMinutes: 1,
  alarmSoundUrl: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg'
};

const DEFAULT_USERS: User[] = [
  { id: 'u1', username: 'ziezan', password: 'myp5', role: Role.ADMIN },
];

const K_CONSOLES = 'ziezan_consoles';
const K_MEMBERS = 'ziezan_members';
const K_TRANSACTIONS = 'ziezan_transactions';
const K_SETTINGS = 'ziezan_settings';
const K_MEMBERSHIPS = 'ziezan_memberships';

export const getConsoles = (): Console[] => {
  try {
    const data = localStorage.getItem(K_CONSOLES);
    if (!data) return DEFAULT_CONSOLES;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : DEFAULT_CONSOLES;
  } catch (e) {
    console.warn("Failed to parse consoles:", e);
    return DEFAULT_CONSOLES;
  }
};

export const saveConsoles = (consoles: Console[]) => {
  try {
    localStorage.setItem(K_CONSOLES, JSON.stringify(consoles));
  } catch (e) {
    console.error("Failed to save consoles", e);
  }
};

export const getMemberships = (): MembershipConfig[] => {
  try {
    const data = localStorage.getItem(K_MEMBERSHIPS);
    if (data) {
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) return DEFAULT_MEMBERSHIPS;

        // Force update defaults to ensure rules are strict
        return DEFAULT_MEMBERSHIPS.map(def => {
            const existing = parsed.find((p: any) => p && p.id === def.id);
            if (existing) {
               return { 
                   ...def, 
                   // Only allow updating visual/minor things, rules are strict in defaults
                   isActive: existing.isActive ?? def.isActive,
               }; 
            }
            return def;
        });
    }
    return DEFAULT_MEMBERSHIPS;
  } catch (e) {
    return DEFAULT_MEMBERSHIPS;
  }
};

export const saveMemberships = (configs: MembershipConfig[]) => {
  try {
    localStorage.setItem(K_MEMBERSHIPS, JSON.stringify(configs));
  } catch (e) {
    console.warn("localStorage setItem failed", e);
  }
};

export const getMembers = (): Member[] => {
  try {
    const data = localStorage.getItem(K_MEMBERS);
    if (!data) return [];
    
    let rawMembers: any = JSON.parse(data);
    if (!Array.isArray(rawMembers)) return [];

    const cleanedMembers: Member[] = rawMembers.map((m: any) => {
        if (!m || typeof m !== 'object' || !m.id) return null;
        
        const safeName = (m.name && typeof m.name === 'string') ? m.name : 'Unknown';
        const safeNick = (m.nickname && typeof m.nickname === 'string') ? m.nickname : safeName.split(' ')[0];

        // Map legacy tiers if exists
        let tier = m.membershipId;
        if (tier === 'BASIC') tier = 'WARRIOR';
        if (tier === 'MASTER') tier = 'GRANDMASTER'; 
        if (tier === 'PLUS') tier = 'EPIC';
        if (tier === 'VIP') tier = 'LEGEND'; 

        return {
          ...m,
          name: safeName.trim(),
          nickname: safeNick, 
          membershipId: tier || 'WARRIOR',
          status: m.status || 'ACTIVE', // Default to ACTIVE
          address: m.address || '-', 
          totalAmountPaid: Number(m.totalAmountPaid) || 0,
          totalPlayTime: Number(m.totalPlayTime) || 0, 
          membershipExpiryDate: m.membershipExpiryDate || null,
          photoUrl: m.photoUrl || undefined,
          dateOfBirth: m.dateOfBirth || undefined,
          lastBirthdayBonusYear: m.lastBirthdayBonusYear || undefined,
          notes: m.notes || '',
          synced: m.synced !== undefined ? m.synced : false, 
          updatedAt: m.updatedAt || new Date().toISOString()
        };
    }).filter((m: any) => m !== null) as Member[];

    const uniqueMembers = Array.from(new Map(cleanedMembers.map(item => [item.id, item])).values());

    return uniqueMembers;
  } catch (e) {
    console.error("Failed to load members", e);
    return [];
  }
};

export const saveMembers = (members: Member[]) => {
  try {
    localStorage.setItem(K_MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.warn("localStorage setItem failed", e);
  }
};

export const getTransactions = (): Transaction[] => {
  try {
    const data = localStorage.getItem(K_TRANSACTIONS);
    if (!data) return [];
    
    const txs: any = JSON.parse(data);
    if (!Array.isArray(txs)) return [];

    return txs.map((t: any) => ({
        ...t,
        memberName: t.memberName || 'Unknown',
        consoleName: t.consoleName || 'Unknown Console',
        cost: Number(t.cost) || 0,
        durationHours: Number(t.durationHours) || 0,
        discountApplied: Number(t.discountApplied) || 0,
        updatedAt: t.updatedAt || new Date().toISOString()
    }));
  } catch (e) {
    return [];
  }
};

export const saveTransactions = (txs: Transaction[]) => {
  try {
    localStorage.setItem(K_TRANSACTIONS, JSON.stringify(txs));
  } catch (e) {
    console.warn("localStorage setItem failed", e);
  }
};

export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(K_SETTINGS);
    if (data) {
        const parsed = JSON.parse(data);
        if (typeof parsed !== 'object' || parsed === null) return DEFAULT_SETTINGS;
        return { 
          ...DEFAULT_SETTINGS, 
          ...parsed
        };
    }
    return DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (s: AppSettings) => {
  try {
    localStorage.setItem(K_SETTINGS, JSON.stringify(s));
  } catch (e) {
    console.warn("localStorage setItem failed", e);
  }
};

export const checkLogin = (username: string, password?: string): User | null => {
  return DEFAULT_USERS.find(u => u.username === username && u.password === password) || null;
};
