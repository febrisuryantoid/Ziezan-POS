import { Console, Member, Transaction, AppSettings, User, Role, MembershipConfig } from '../types';

// Initial Data Seeding - CLEARED FOR PRODUCTION
const DEFAULT_CONSOLES: Console[] = [];

// Default Membership Tiers Configuration
const DEFAULT_MEMBERSHIPS: MembershipConfig[] = [
  { 
    id: 'BASIC', 
    name: 'Ziezan Basic', 
    price: 0, 
    durationDays: 0, // Lifetime
    bonusThreshold: 5, // Play 5
    bonusReward: 1,    // Get 1
    isActive: true,
    // Silver Metallic
    color: 'BASIC'
  },
  { 
    id: 'PLUS', 
    name: 'Ziezan Plus', 
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
    name: 'Ziezan VIP', 
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
  hourlyRate: 5000,
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
  return data ? JSON.parse(data) : DEFAULT_MEMBERSHIPS;
};

export const saveMemberships = (configs: MembershipConfig[]) => {
  localStorage.setItem(K_MEMBERSHIPS, JSON.stringify(configs));
};

export const getMembers = (): Member[] => {
  const data = localStorage.getItem(K_MEMBERS);
  if (!data) return [];
  
  const members: Member[] = JSON.parse(data);
  // Migration: Ensure new fields exist
  return members.map(m => ({
    ...m,
    membershipId: m.membershipId || 'BASIC',
    totalAmountPaid: m.totalAmountPaid || 0,
    membershipExpiryDate: m.membershipExpiryDate || null
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
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
};

export const saveSettings = (s: AppSettings) => {
  localStorage.setItem(K_SETTINGS, JSON.stringify(s));
};

export const checkLogin = (username: string, password?: string): User | null => {
  return DEFAULT_USERS.find(u => u.username === username && u.password === password) || null;
};