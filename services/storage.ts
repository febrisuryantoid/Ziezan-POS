import { Console, Member, Transaction, AppSettings, User, Role, MembershipConfig } from '../types';

// Initial Data Seeding - CLEARED FOR PRODUCTION
const DEFAULT_CONSOLES: Console[] = [];

// Default Membership Tiers Configuration
const DEFAULT_MEMBERSHIPS: MembershipConfig[] = [
  { 
    id: 'BASIC', 
    name: 'Basic', 
    price: 5000, 
    durationDays: 30, 
    bonusThreshold: 6, 
    bonusReward: 1,    
    isActive: true,
    color: 'BASIC'
  },
  { 
    id: 'PLUS', 
    name: 'Plus', 
    price: 25000, 
    durationDays: 30, 
    bonusThreshold: 4, 
    bonusReward: 1,    
    isActive: true,
    color: 'PLUS'
  },
  { 
    id: 'VIP', 
    name: 'VIP', 
    price: 50000, 
    durationDays: 30, 
    bonusThreshold: 3, 
    bonusReward: 1,    
    isActive: true,
    color: 'VIP'
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
  
  let members: Member[] = JSON.parse(data);
  
  // --- DATA CLEANUP & DEDUPLICATION LOGIC ---
  // Fix data integrity issues automatically on load
  const nameMap = new Map<string, Member>();
  const uniqueMembers: Member[] = [];
  let hasChanges = false;

  members.forEach(m => {
      // 1. Skip invalid records
      if (!m.id || !m.name) {
          hasChanges = true;
          return;
      }

      // 2. Normalize and Fix structure
      const cleaned: Member = {
        ...m,
        name: m.name.trim(),
        nickname: m.nickname || m.name.split(' ')[0], 
        membershipId: m.membershipId || 'BASIC',
        address: m.address || 'Nyomplong', 
        totalAmountPaid: m.totalAmountPaid || 0,
        membershipExpiryDate: m.membershipExpiryDate || null,
        photoUrl: m.photoUrl || undefined,
        dateOfBirth: m.dateOfBirth || undefined,
        lastBirthdayBonusYear: m.lastBirthdayBonusYear || undefined,
        notes: m.notes || ''
      };

      // 3. Smart Deduplication by Name (Case Insensitive)
      // If "Asep" exists twice, keep the one with the most playtime or higher tier
      const key = cleaned.name.toLowerCase();
      
      if (nameMap.has(key)) {
          const existing = nameMap.get(key)!;
          // Criteria to keep current 'cleaned' over 'existing':
          // 1. Higher Playtime OR
          // 2. Same Playtime but Higher Tier (VIP > BASIC)
          const isBetter = cleaned.totalPlayTime > existing.totalPlayTime || 
                           (cleaned.totalPlayTime === existing.totalPlayTime && cleaned.membershipId !== 'BASIC');
          
          if (isBetter) {
              nameMap.set(key, cleaned);
          }
          hasChanges = true; // We found a duplicate, so we are modifying the list
      } else {
          nameMap.set(key, cleaned);
      }
  });

  // Convert Map back to Array
  if (hasChanges || nameMap.size !== members.length) {
      const cleanList = Array.from(nameMap.values());
      console.log(`[Storage] Cleaned members: Reduced from ${members.length} to ${cleanList.length}`);
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