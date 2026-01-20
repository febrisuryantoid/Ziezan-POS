
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
    return data ? JSON.parse(data) : DEFAULT_CONSOLES;
  } catch (e) {
    return DEFAULT_CONSOLES;
  }
};

export const saveConsoles = (consoles: Console[]) => {
  localStorage.setItem(K_CONSOLES, JSON.stringify(consoles));
};

export const getMemberships = (): MembershipConfig[] => {
  try {
    const data = localStorage.getItem(K_MEMBERSHIPS);
    if (data) {
        const parsed = JSON.parse(data);
        const merged = DEFAULT_MEMBERSHIPS.map(def => {
            const existing = parsed.find((p: any) => p.id === def.id);
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
    
    let rawMembers: any[] = JSON.parse(data);
    if (!Array.isArray(rawMembers)) return [];

    // Validasi dan Clean Data tanpa Merging Nama (ID is King)
    const cleanedMembers: Member[] = rawMembers.map(m => {
        if (!m || !m.id) return null;
        
        const safeName = (m.name && typeof m.name === 'string') ? m.name : 'Unknown';
        const safeNick = (m.nickname && typeof m.nickname === 'string') ? m.nickname : safeName.split(' ')[0];

        // Migration for old tiers
        let tier = m.membershipId;
        if (tier as any === 'BASIC') tier = 'WARRIOR';
        if (tier as any === 'MASTER') tier = 'GRANDMASTER'; 
        if (tier as any === 'PLUS') tier = 'EPIC';
        if (tier as any === 'VIP') tier = 'LEGEND'; 

        return {
          ...m,
          name: safeName.trim(),
          nickname: safeNick, 
          membershipId: tier,
          address: m.address || 'Nyomplong', 
          totalAmountPaid: m.totalAmountPaid || 0,
          totalPlayTime: m.totalPlayTime || 0, // Ensure playtime is number
          membershipExpiryDate: m.membershipExpiryDate || null,
          photoUrl: m.photoUrl || undefined,
          dateOfBirth: m.dateOfBirth || undefined,
          lastBirthdayBonusYear: m.lastBirthdayBonusYear || undefined,
          notes: m.notes || '',
          synced: m.synced !== undefined ? m.synced : false, // Default to false if missing to trigger sync
          updatedAt: m.updatedAt || new Date().toISOString()
        };
    }).filter(m => m !== null) as Member[];

    // Removed the dangerously loose "nameMap" deduplication logic.
    // We trust that IDs are unique. If there are duplicates in localStorage, 
    // we assume the last one in the array is the most recent state or filter by ID.
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
    const txs: Transaction[] = data ? JSON.parse(data) : [];
    
    return txs.map(t => ({
        ...t,
        memberName: t.memberName || 'Unknown',
        consoleName: t.consoleName || 'Unknown Console',
        updatedAt: t.updatedAt || new Date().toISOString()
    }));
  } catch (e) {
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
