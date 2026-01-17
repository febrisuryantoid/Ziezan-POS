
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

export type PaymentMethod = 'CASH' | 'QRIS';
export type MembershipTierId = 'BASIC' | 'PLUS' | 'VIP';

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
  price: number; // For selling the plan
  durationDays: number; // 0 for lifetime/unlimited
  bonusThreshold: number; // Play X hours
  bonusReward: number; // Get Y hours
  isActive: boolean;
  color: string; // UI Color helper
}

export interface Console {
  id: string;
  name: string;
  status: ConsoleStatus;
  totalHoursUsed: number;
  notes?: string;
  currentSessionId?: string; // Link to active transaction
  synced?: boolean; // Sync status
}

export interface Member {
  id: string;
  membershipId: MembershipTierId; 
  membershipExpiryDate?: string | null; // ISO String, null for lifetime
  name: string;
  photoUrl?: string; // Base64 or URL
  phone?: string; 
  address?: string; 
  dateOfBirth?: string; // ISO String YYYY-MM-DD
  lastBirthdayBonusYear?: number; // Year when bonus was last applied
  joinDate: string; // ISO String
  totalPlayTime: number; // in hours
  totalAmountPaid: number; // To calculate effective rate (Total Paid / Total Play)
  hoursProgressToNextBonus: number; // Accumulator based on tier rule
  freeHoursBalance: number;
  totalBonusHoursUsed: number; 
  status: MemberStatus;
  notes?: string;
  synced?: boolean; // Sync status
}

export interface Transaction {
  id: string;
  consoleId: string;
  consoleName: string;
  memberId: string;
  memberName: string;
  startTime: string; // ISO String
  endTime?: string; // ISO String (Planned or Actual)
  durationHours: number;
  cost: number;
  discountApplied: number; // Value of free hours used
  paymentMethod: PaymentMethod;
  status: 'ACTIVE' | 'COMPLETED';
  operatorName: string;
  synced?: boolean; // Sync status
}

export interface AppSettings {
  hourlyRate: number;
  cloudRetentionDays: number; // 0 = Keep Forever (Risk full), 30/60/90 = Auto Prune
  birthdayBonusHours: number; // Hours given for free on birthday
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