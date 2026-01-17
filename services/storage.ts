import { Console, Member, Transaction, AppSettings, User, Role, MembershipConfig } from '../types';

// Initial Data Seeding - CLEARED FOR PRODUCTION
const DEFAULT_CONSOLES: Console[] = [];

// Default Membership Tiers Configuration
const DEFAULT_MEMBERSHIPS: MembershipConfig[] = [
  { 
    id: 'BASIC', 
    name: 'Basic', 
    price: 5000, // UPDATED: Harga 5.000
    durationDays: 30, // UPDATED: Masa aktif 30 Hari
    // Skema bonus tetap: Main 6 Jam Gratis 1 Jam
    bonusThreshold: 6, 
    bonusReward: 1,    
    isActive: true,
    // Silver Metallic
    color: 'BASIC'
  },
  { 
    id: 'PLUS', 
    name: 'Plus', 
    price: 25000, 
    durationDays: 30, // 1 Month
    bonusThreshold: 4, // Play 4
    bonusReward: 1,    // Get 1
    isActive: true,
    // Electric Purple
    color: 'PLUS'
  },
  { 
    id: 'VIP', 
    name: 'VIP', 
    price: 50000, 
    durationDays: 30, // 1 Month
    bonusThreshold: 3, // Play 3
    bonusReward: 1,    // Get 1
    isActive: true,
    // Luxury Gold
    color: 'VIP'
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  // New Business Defaults
  businessName: 'Ziezan Station',
  businessAddress: 'Blok Nyomplong No.34, RT.09/RW.02, Padasuka, Baros, Kab. Serang.',
  businessPhone: '+62 8888-9077-31',
  businessLogo: 'https://beeimg.com/images/s77882238754.png', // Updated Default Icon

  // Operational Defaults
  hourlyRate: 5000,
  cloudRetentionDays: 90, // Default: Keep cloud clean by removing data older than 3 months
  birthdayBonusHours: 2 // Default: 2 Hours free on birthday
};

// Default Admin Account
const DEFAULT_USERS: User[] = [
  { id: 'u1', username: 'ziezan', password: 'myp5', role: Role.ADMIN },
];

// Keys
const K_CONSOLES = 'ziezan_consoles';
const K_MEMBERS = 'ziezan_members';
const K_TRANSACTIONS = 'ziezan_transactions';
const K_SETTINGS = 'ziezan_settings';
const K_MEMBERSHIPS = 'ziezan_memberships';

// Helpers
export const getConsoles = (): Console[] => {
  const data = localStorage.getItem(K_CONSOLES);
  return data ? JSON.parse(data) : DEFAULT_CONSOLES;
};

export const saveConsoles = (consoles: Console[]) => {
  localStorage.setItem(K_CONSOLES, JSON.stringify(consoles));
};

export const getMemberships = (): MembershipConfig[] => {
  const data = localStorage.getItem(K_MEMBERSHIPS);
  // If data exists, merge with defaults to ensure BASIC updates apply if ID matches but structure changed
  if (data) {
      const parsed = JSON.parse(data);
      // Optional: Logic to force update defaults if needed, for now return parsed or default if empty
      return parsed.length > 0 ? parsed : DEFAULT_MEMBERSHIPS; 
  }
  return DEFAULT_MEMBERSHIPS;
};

export const saveMemberships = (configs: MembershipConfig[]) => {
  localStorage.setItem(K_MEMBERSHIPS, JSON.stringify(configs));
};

export const getMembers = (): Member[] => {
  const data = localStorage.getItem(K_MEMBERS);
  if (!data) return [];
  
  const members: Member[] = JSON.parse(data);
  
  // --- MIGRATION / "SQL EDITOR" LOGIC ---
  // Ensures all existing members have the new schema defaults
  return members.map(m => ({
    ...m,
    nickname: m.nickname || m.name.split(' ')[0], // Generate nickname if missing
    membershipId: m.membershipId || 'BASIC',
    address: m.address || 'Nyomplong', // Default Address Migration
    totalAmountPaid: m.totalAmountPaid || 0,
    membershipExpiryDate: m.membershipExpiryDate || null,
    photoUrl: m.photoUrl || undefined,
    dateOfBirth: m.dateOfBirth || undefined,
    lastBirthdayBonusYear: m.lastBirthdayBonusYear || undefined,
    notes: m.notes || ''
  }));
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
      // Migration for old settings
      return { 
        ...DEFAULT_SETTINGS, 
        ...parsed,
        // Ensure new fields are populated if they don't exist in saved data
        businessName: parsed.businessName || DEFAULT_SETTINGS.businessName,
        businessAddress: parsed.businessAddress || DEFAULT_SETTINGS.businessAddress,
        businessPhone: parsed.businessPhone || DEFAULT_SETTINGS.businessPhone,
        businessLogo: parsed.businessLogo || DEFAULT_SETTINGS.businessLogo,
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