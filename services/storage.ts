
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
    
    let members: Member[] = JSON.parse(data);
    
    // Clean Data & Migration
    const nameMap = new Map<string, Member>();
    let hasChanges = false;

    members.forEach(m => {
        // SAFETY FIX: Ensure 'name' exists and is a string
        if (!m || !m.id) { hasChanges = true; return; }
        
        const safeName = (m.name && typeof m.name === 'string') ? m.name : 'Unknown Member';
        const safeNick = (m.nickname && typeof m.nickname === 'string') ? m.nickname : safeName.split(' ')[0];

        // Migration for old tiers
        let tier = m.membershipId;
        if (tier as any === 'BASIC') tier = 'WARRIOR';
        if (tier as any === 'MASTER') tier = 'GRANDMASTER'; 
        if (tier as any === 'PLUS') tier = 'EPIC';
        if (tier as any === 'VIP') tier = 'LEGEND'; 

        const cleaned: Member = {
          ...m,
          name: safeName.trim(),
          nickname: safeNick, 
          membershipId: tier,
          address: m.address || 'Nyomplong', 
          totalAmountPaid: m.totalAmountPaid || 0,
          membershipExpiryDate: m.membershipExpiryDate || null,
          photoUrl: m.photoUrl || undefined,
          dateOfBirth: m.dateOfBirth || undefined,
          lastBirthdayBonusYear: m.lastBirthdayBonusYear || undefined,
          notes: m.notes || ''
        };

        const key = cleaned.name.toLowerCase();
        if (nameMap.has(key)) {
            const existing = nameMap.get(key)!;
            const isBetter = cleaned.totalPlayTime > existing.totalPlayTime;
            if (isBetter) nameMap.set(key, cleaned);
            hasChanges = true; 
        } else {
            nameMap.set(key, cleaned);
        }
    });

    if (hasChanges || nameMap.size !== members.length) {
        const cleanList = Array.from(nameMap.values());
        saveMembers(cleanList);
        return cleanList;
    }

    return members;
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
    
    // SAFETY FIX: Ensure transactions have valid names for display
    return txs.map(t => ({
        ...t,
        memberName: t.memberName || 'Unknown',
        consoleName: t.consoleName || 'Unknown Console'
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
