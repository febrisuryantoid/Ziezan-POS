
import { Console, Member, Transaction, AppSettings, User, Role, MembershipConfig } from '../types';

// Initial Data Seeding - CLEARED FOR PRODUCTION
const DEFAULT_CONSOLES: Console[] = [];

// New 7-Tier "Kid-Friendly Progression" Configuration
// Philosophy: Fast rank-up early game, generous bonuses for loyalty.
// Warrior (0h) -> Elite (10h) -> Master (25h) -> GM (50h) -> Epic (85h) -> Legend (120h) -> Mythic (160h)
const DEFAULT_MEMBERSHIPS: MembershipConfig[] = [
  { 
    id: 'WARRIOR', 
    name: 'Warrior', 
    minHours: 0,
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 6, // START: Main 6 Jam -> Gratis 1
    bonusReward: 1,     
    isActive: true,
    color: 'slate'
  },
  { 
    id: 'ELITE', 
    name: 'Elite', 
    minHours: 10, // Cepat naik pangkat (sekitar 5x main)
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 6, // Masih 6:1, tapi status naik
    bonusReward: 1,    
    isActive: true,
    color: 'zinc'
  },
  { 
    id: 'MASTER', 
    name: 'Master', 
    minHours: 25, // Target 2-3 Minggu
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 5, // UPGRADE 1: Jadi Main 5 Jam -> Gratis 1
    bonusReward: 1,    
    isActive: true,
    color: 'amber'
  },
  { 
    id: 'GRANDMASTER', 
    name: 'Grandmaster', 
    minHours: 50, // Target 1 Bulan
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 5, 
    bonusReward: 1,    
    isActive: true,
    color: 'emerald'
  },
  { 
    id: 'EPIC', 
    name: 'Epic', 
    minHours: 85, // Target 1.5 Bulan
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 4, // UPGRADE 2: Jadi Main 4 Jam -> Gratis 1
    bonusReward: 1,    
    isActive: true,
    color: 'cyan'
  },
  { 
    id: 'LEGEND', 
    name: 'Legend', 
    minHours: 120, // Target 2 Bulan
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 4, 
    bonusReward: 1,    
    isActive: true,
    color: 'violet'
  },
  { 
    id: 'MYTHIC', 
    name: 'Mythic', 
    minHours: 160, // Target Akhir Season (±3 Bulan)
    price: 0, 
    durationDays: 0, 
    bonusThreshold: 3, // JACKPOT: Main 3 Jam -> Gratis 1
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
      // Ensure we always have the 7 tiers even if local storage is old
      // We map over default and merge preserved fields (isActive)
      const merged = DEFAULT_MEMBERSHIPS.map(def => {
          const existing = parsed.find((p: any) => p.id === def.id);
          if (existing) {
             return { ...def, isActive: existing.isActive }; 
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

      // Name Migration for old tiers to new schema
      let tier = m.membershipId;
      if (tier as any === 'BASIC') tier = 'WARRIOR';
      if (tier as any === 'PLUS') tier = 'GRANDMASTER'; // Mid-tier mapping
      if (tier as any === 'VIP') tier = 'LEGEND'; // High-tier mapping

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
        ...parsed,
        birthdayBonusHours: parsed.birthdayBonusHours ?? DEFAULT_SETTINGS.birthdayBonusHours,
        cloudRetentionDays: parsed.cloudRetentionDays ?? DEFAULT_SETTINGS.cloudRetentionDays,
        businessName: parsed.businessName || DEFAULT_SETTINGS.businessName,
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
