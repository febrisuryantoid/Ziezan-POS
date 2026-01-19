
export enum Role {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export enum ConsoleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE'
}

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export type PaymentMethod = 'CASH' | 'QRIS' | 'BONUS';
// Updated to 7 Tiers (Mythic Added)
export type MembershipTierId = 'WARRIOR' | 'ELITE' | 'MASTER' | 'GRANDMASTER' | 'EPIC' | 'LEGEND' | 'MYTHIC';

// --- NEW: TOAST TYPES ---
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
// ------------------------

export interface User {
  id: string;
  username: string;
  role: Role;
  password?: string; // Simple check
}

export interface MembershipConfig {
  id: MembershipTierId;
  name: string;
  minHours: number; // NEW: Minimum hours required to reach this tier
  price: number; // Registration fee (if any, usually 0 for auto-rank)
  durationDays: number; // 0 for seasonal/lifetime
  bonusThreshold: number; // Play X hours
  bonusReward: number; // Get Y hours
  isActive: boolean;
  color: string; // UI Color helper
}

export interface Console {
  id: string;
  name: string;
  imageUrl?: string; 
  status: ConsoleStatus;
  totalHoursUsed: number;
  notes?: string;
  currentSessionId?: string; 
  synced?: boolean; 
}

export interface Member {
  id: string;
  membershipId: MembershipTierId; 
  membershipExpiryDate?: string | null; 
  name: string; 
  nickname: string; 
  photoUrl?: string; 
  phone?: string; 
  address?: string; 
  dateOfBirth?: string; 
  lastBirthdayBonusYear?: number; 
  joinDate: string; 
  totalPlayTime: number; // This acts as Season XP
  totalAmountPaid: number; 
  hoursProgressToNextBonus: number; 
  freeHoursBalance: number;
  totalBonusHoursUsed: number; 
  status: MemberStatus;
  notes?: string;
  synced?: boolean; 
}

export interface Transaction {
  id: string;
  consoleId: string;
  consoleName: string;
  memberId: string;
  memberName: string;
  startTime: string; 
  endTime?: string; 
  durationHours: number;
  cost: number;
  discountApplied: number; 
  paymentMethod: PaymentMethod;
  status: 'ACTIVE' | 'COMPLETED';
  operatorName: string;
  synced?: boolean; 
}

export interface AppSettings {
  // Business Profile
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessLogo: string;

  // Operational
  hourlyRate: number;
  cloudRetentionDays: number; 
  birthdayBonusHours: number; 
}

export interface DashboardStats {
  activeConsoles: number;
  totalRevenueToday: number;
  totalTransactionsToday: number;
  activeMembers: number;
}

// Bluetooth Types
export type BluetoothCommandType = 'START' | 'STOP' | 'EXTEND';

export interface BluetoothCommand {
  type: BluetoothCommandType;
  durationSeconds?: number;
}
