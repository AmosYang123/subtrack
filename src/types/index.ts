export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'quarterly';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export type CategoryType =
  | 'Streaming'
  | 'Music'
  | 'Software'
  | 'Gaming'
  | 'Fitness'
  | 'Cloud'
  | 'Utilities'
  | 'News'
  | 'Education'
  | 'Other';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  nextBillingDate: string; // YYYY-MM-DD
  firstBillingDate?: string;
  category: string;
  paymentMethodId?: string;
  accountEmail?: string; // Email/account used for this service
  accountPassword?: string; // Optional stored/generated password
  passwordHint?: string; // Optional reminder hint
  cancelUrl?: string; // Direct 1-click link to cancellation/billing settings
  isTrial?: boolean; // Is currently on free trial
  trialEndDate?: string; // YYYY-MM-DD
  lastUsedDate?: string; // YYYY-MM-DD
  usageFrequency?: 'daily' | 'weekly' | 'monthly' | 'dormant';
  annualPrice?: number; // Optional annual tier price if available
  notes?: string;
  status: SubscriptionStatus;
  websiteUrl?: string;
  remindDaysBefore?: number;
  color?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  lastFour: string;
  name: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
}

export interface EmailScanItem {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  detectedService: string;
  detectedAmount: number;
  detectedCurrency: string;
  detectedCycle: BillingCycle;
  detectedCategory: string;
  confidence: number; // 0 - 100
  cardLastFour?: string;
  cancelUrl?: string;
  websiteUrl?: string;
  alreadyTracked: boolean;
  selected?: boolean;
}

export interface StatementParsedItem {
  id: string;
  rawMerchant: string;
  matchedService: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  category: string;
  transactionDate: string;
  frequencyScore: number; // 0 to 100
  cardLastFour?: string;
  cancelUrl?: string;
  websiteUrl?: string;
  selected?: boolean;
  alreadyTracked?: boolean;
}

export interface PresetProfile {
  id: string;
  title: string;
  description: string;
  badge: string;
  currency: string;
  subscriptions: Omit<Subscription, 'id' | 'createdAt'>[];
  paymentMethods: PaymentMethod[];
}

export interface ImportExportData {
  version: number;
  exportedAt: string;
  currency: string;
  subscriptions: Omit<Subscription, 'id' | 'createdAt'>[];
  paymentMethods: PaymentMethod[];
}

export interface FilterState {
  searchTerm: string;
  category: string;
  status: string;
  billingCycle: string;
  paymentMethodId: string;
  sortBy: 'nextBilling' | 'amount' | 'name' | 'status' | 'category';
  sortOrder: 'asc' | 'desc';
  viewMode: 'table' | 'grid';
}

export type ThemeMode = 'dark' | 'light' | 'system';

export type ActiveTab = 'subscriptions' | 'optimizer' | 'analytics' | 'calendar' | 'payments';

export interface SpendingMetrics {
  totalMonthly: number;
  totalAnnual: number;
  activeCount: number;
  pausedCount: number;
  cancelledCount: number;
  renewingIn7DaysCount: number;
  renewingIn7DaysAmount: number;
  highestExpenseSub?: Subscription;
  averageMonthly: number;
}

export interface UserAccount {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  lastSyncedAt?: string;
}

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'local';
