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
    // Silver / Platinum Look
    color: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
  },
  { 
    id: 'PLUS', 
    name: 'Ziezan Plus', 
    price: 25000, 
    durationDays: 30, // 1 Month
    bonusThreshold: 4, // Play 4
    bonusReward: 1,    // Get 1
    isActive: true,
    // Soft Gold / Champagne
    color: 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-800'
  },
  { 
    id: 'VIP', 
    name: 'Ziezan VIP', 
    price: 50000, 
    durationDays: 30, // 1 Month
    bonusThreshold: 3, // Play 3
    bonusReward: 1,    // Get 1
    isActive: true,
    // Solid Deep Gold / Luxury
    color: 'bg-gradient-to-r from-brand-100 to-brand-50 text-brand-800 border-brand-400 dark:from-brand-900/40 dark:to-brand-900/20 dark:text-brand-200 dark:border-brand-600'
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