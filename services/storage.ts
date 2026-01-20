
import { Console, Member, Transaction, AppSettings, User, Role, MembershipConfig } from '../types';

// Initial Data Seeding - CLEARED FOR PRODUCTION
const DEFAULT_CONSOLES: Console[] = [];

// New 9-Tier "Mobile Legends Style" Configuration
// UPDATED: Easier progression from Warrior to Epic, specific targets for Legend/Mythic.
const DEFAULT_MEMBERSHIPS: MembershipConfig[] = [
  { 
    id: 'WARRIOR', 
    name: 'Warrior', 
    minHours: 0,
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 10, // Main 10 jam -> Bonus 1 jam
    bonusReward: 1,     
    isActive: true,
    color: 'orange'
  },
  { 
    id: 'ELITE', 
    name: 'Elite', 
    minHours: 5, // Dipermudah (sebelumnya 10)
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 10, 
    bonusReward: 1,    
    isActive: true,
    color: 'slate'
  },
  { 
    id: 'GRANDMASTER', 
    name: 'Grand Master', 
    minHours: 15, // Dipermudah (sebelumnya 30)
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 9, // Upgrade: Main 9 jam -> Bonus 1 jam
    bonusReward: 1,    
    isActive: true,
    color: 'amber'
  },
  { 
    id: 'EPIC', 
    name: 'Epic', 
    minHours: 30, // Dipermudah (sebelumnya 60)
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 8, // Upgrade: Main 8 jam -> Bonus 1 jam
    bonusReward: 1,    
    isActive: true,
    color: 'emerald'
  },
  { 
    id: 'LEGEND', 
    name: 'Legend', 
    minHours: 60, // Fixed as requested
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 7, // Upgrade: Main 7 jam -> Bonus 1 jam
    bonusReward: 1,    
    isActive: true,
    color: 'yellow'
  },
  { 
    id: 'MYTHIC', 
    name: 'Mythic', 
    minHours: 100, // Fixed as requested
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 6, // Upgrade: Main 6 jam -> Bonus 1 jam
    bonusReward: 1,    
    isActive: true,
    color: 'indigo'
  },
  { 
    id: 'MYTHICAL_HONOR', 
    name: 'Mythical Honor', 
    minHours: 150, // Smoother transition
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 5, // Upgrade: Main 5 jam -> Bonus 1 jam
    bonusReward: 1,    
    isActive: true,
    color: 'blue'
  },
  { 
    id: 'MYTHICAL_GLORY', 
    name: 'Mythical Glory', 
    minHours: 220, // Smoother transition
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 4, // Upgrade: Main 4 jam -> Bonus 1 jam
    bonusReward: 1,    
    isActive: true,
    color: 'pink'
  },
  { 
    id: 'MYTHICAL_IMMORTAL', 
    name: 'Mythical Immortal', 
    minHours: 365, // Top Tier
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 3, // GOD MODE: Main 3 Jam -> Gratis 1
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
  const data = localStorage.getItem(K_CONSOLES);
  return data ? JSON.parse(data) : DEFAULT_CONSOLES;
};

export const saveConsoles = (consoles: Console[]) => {
  localStorage.setItem(K_CONSOLES, JSON.stringify(consoles));
};

export const getMemberships = (): MembershipConfig[] => {
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
};

export const saveMemberships = (configs: MembershipConfig[]) => {
  localStorage.setItem(K_MEMBERSHIPS, JSON.stringify(configs));
};

export const getMembers = (): Member[] => {
  const data = localStorage.getItem(K_MEMBERS);
  if (!data) return [];
  
  let members: Member[] = JSON.parse(data);
  
  // Clean Data & Migration
  const nameMap = new Map<string, Member>();
  let hasChanges = false;

  members.forEach(m => {
      if (!m.id || !m.name) { hasChanges = true; return; }

      // Migration for old tiers to new 9-Tier schema
      let tier = m.membershipId;
      // Auto migrate old names to new structure if encountered
      if (tier as any === 'BASIC') tier = 'WARRIOR';
      if (tier as any === 'MASTER') tier = 'GRANDMASTER'; 
      if (tier as any === 'PLUS') tier = 'EPIC';
      if (tier as any === 'VIP') tier = 'LEGEND'; 

      const cleaned: Member = {
        ...m,
        name: m.name.trim(),
        nickname: m.nickname || m.name.split(' ')[0], 
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
};

export const saveMembers = (members: Member[]) => {
  localStorage.setItem(K_MEMBERS, JSON.stringify(members));
};

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(K_TRANSACTIONS);
  return data ? JSON.parse(data) : [];
};

export const saveTransactions = (txs: Transaction[]) => {
  localStorage.setItem(K_TRANSACTIONS, JSON.stringify(txs));
};

export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(K_SETTINGS);
  if (data) {
      const parsed = JSON.parse(data);
      return { 
        ...DEFAULT_SETTINGS, 
        ...parsed
      };
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (s: AppSettings) => {
  localStorage.setItem(K_SETTINGS, JSON.stringify(s));
};

export const checkLogin = (username: string, password?: string): User | null => {
  return DEFAULT_USERS.find(u => u.username === username && u.password === password) || null;
};
