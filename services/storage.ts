
import { Console, Member, Transaction, AppSettings, User, Role, MembershipConfig } from '../types';

// Initial Data Seeding - CLEARED FOR PRODUCTION
const DEFAULT_CONSOLES: Console[] = [];

// New 9-Tier "Mobile Legends Style" Configuration
const DEFAULT_MEMBERSHIPS: MembershipConfig[] = [
  { 
    id: 'WARRIOR', 
    name: 'Warrior', 
    minHours: 0,
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 6,
    bonusReward: 1,     
    isActive: true,
    color: 'orange'
  },
  { 
    id: 'ELITE', 
    name: 'Elite', 
    minHours: 5, 
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 6,
    bonusReward: 1,    
    isActive: true,
    color: 'slate'
  },
  { 
    id: 'GRANDMASTER', 
    name: 'Grand Master', 
    minHours: 15, 
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 6,
    bonusReward: 1,    
    isActive: true,
    color: 'amber'
  },
  { 
    id: 'EPIC', 
    name: 'Epic', 
    minHours: 30, 
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 6,
    bonusReward: 1,    
    isActive: true,
    color: 'emerald'
  },
  { 
    id: 'LEGEND', 
    name: 'Legend', 
    minHours: 60, 
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 5,
    bonusReward: 1,    
    isActive: true,
    color: 'yellow'
  },
  { 
    id: 'MYTHIC', 
    name: 'Mythic', 
    minHours: 100, 
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 5,
    bonusReward: 1,    
    isActive: true,
    color: 'indigo'
  },
  { 
    id: 'MYTHICAL_HONOR', 
    name: 'Mythical Honor', 
    minHours: 150, 
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 4,
    bonusReward: 1,    
    isActive: true,
    color: 'blue'
  },
  { 
    id: 'MYTHICAL_GLORY', 
    name: 'Mythical Glory', 
    minHours: 220, 
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 4,
    bonusReward: 1,    
    isActive: true,
    color: 'pink'
  },
  { 
    id: 'MYTHICAL_IMMORTAL', 
    name: 'Mythical Immortal', 
    minHours: 365, 
    price: 0, 
    durationDays: 0, 
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
  birthdayBonusHours: 2
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
        // CRITICAL FIX: Ensure parsed is an array before mapping
        if (!Array.isArray(parsed)) return DEFAULT_MEMBERSHIPS;

        const merged = DEFAULT_MEMBERSHIPS.map(def => {
            const existing = parsed.find((p: any) => p && p.id === def.id);
            if (existing) {
               return { 
                   ...def, 
                   isActive: existing.isActive ?? def.isActive,
                   minHours: existing.minHours ?? def.minHours,
                   bonusThreshold: existing.bonusThreshold ?? def.bonusThreshold,
                   bonusReward: existing.bonusReward ?? def.bonusReward,
                   price: existing.price ?? def.price,
                   durationDays: existing.durationDays ?? def.durationDays
               }; 
            }
            return def;
        });
        return merged;
    }
    return DEFAULT_MEMBERSHIPS;
  } catch (e) {
    console.warn("Failed to load memberships, using defaults", e);
    return DEFAULT_MEMBERSHIPS;
  }
};

export const saveMemberships = (configs: MembershipConfig[]) => {
  localStorage.setItem(K_MEMBERSHIPS, JSON.stringify(configs));
};

export const getMembers = (): Member[] => {
  try {
    const data = localStorage.getItem(K_MEMBERS);
    if (!data) return [];
    
    let rawMembers: any = JSON.parse(data);
    // CRITICAL FIX: Explicit check for array
    if (!Array.isArray(rawMembers)) return [];

    const cleanedMembers: Member[] = rawMembers.map((m: any) => {
        if (!m || typeof m !== 'object' || !m.id) return null;
        
        const safeName = (m.name && typeof m.name === 'string') ? m.name : 'Unknown';
        const safeNick = (m.nickname && typeof m.nickname === 'string') ? m.nickname : safeName.split(' ')[0];

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
          address: m.address || 'Nyomplong', 
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
  localStorage.setItem(K_MEMBERS, JSON.stringify(members));
};

export const getTransactions = (): Transaction[] => {
  try {
    const data = localStorage.getItem(K_TRANSACTIONS);
    if (!data) return [];
    
    const txs: any = JSON.parse(data);
    // CRITICAL FIX: Explicit check for array
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
    console.warn("Failed to load transactions", e);
    return [];
  }
};

export const saveTransactions = (txs: Transaction[]) => {
  localStorage.setItem(K_TRANSACTIONS, JSON.stringify(txs));
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
  localStorage.setItem(K_SETTINGS, JSON.stringify(s));
};

export const checkLogin = (username: string, password?: string): User | null => {
  return DEFAULT_USERS.find(u => u.username === username && u.password === password) || null;
};
