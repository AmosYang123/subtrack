import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Subscription, PaymentMethod } from '../types';

const STORAGE_SUPABASE_URL_KEY = 'subtrax_supabase_url';
const STORAGE_SUPABASE_ANON_KEY = 'subtrax_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let cachedUrl: string | null = null;
let cachedAnonKey: string | null = null;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isFromEnv: boolean;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('your-project')) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      isFromEnv: true
    };
  }

  try {
    const storedUrl = localStorage.getItem(STORAGE_SUPABASE_URL_KEY);
    const storedKey = localStorage.getItem(STORAGE_SUPABASE_ANON_KEY);
    if (storedUrl && storedKey) {
      return {
        url: storedUrl.trim(),
        anonKey: storedKey.trim(),
        isFromEnv: false
      };
    }
  } catch {
    // Ignore localStorage access errors
  }

  return null;
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return !!config && !!config.url && !!config.anonKey;
}

export function setSupabaseConfig(url: string, anonKey: string): void {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  localStorage.setItem(STORAGE_SUPABASE_URL_KEY, cleanUrl);
  localStorage.setItem(STORAGE_SUPABASE_ANON_KEY, cleanKey);
  cachedClient = null;
  cachedUrl = null;
  cachedAnonKey = null;
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_SUPABASE_URL_KEY);
  localStorage.removeItem(STORAGE_SUPABASE_ANON_KEY);
  cachedClient = null;
  cachedUrl = null;
  cachedAnonKey = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  if (cachedClient && cachedUrl === config.url && cachedAnonKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    cachedUrl = config.url;
    cachedAnonKey = config.anonKey;
    return cachedClient;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('Failed to initialize Supabase client:', err);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// DB Mappers: CamelCase <-> SnakeCase
// ---------------------------------------------------------------------------

export function subscriptionToDbRow(sub: Subscription, userId: string): Record<string, any> {
  return {
    id: sub.id,
    user_id: userId,
    name: sub.name,
    amount: sub.amount,
    currency: sub.currency || 'USD',
    billing_cycle: sub.billingCycle || 'monthly',
    next_billing_date: sub.nextBillingDate,
    first_billing_date: sub.firstBillingDate || null,
    category: sub.category || 'Other',
    payment_method_id: sub.paymentMethodId || null,
    account_email: sub.accountEmail || null,
    account_password: sub.accountPassword || null,
    password_hint: sub.passwordHint || null,
    cancel_url: sub.cancelUrl || null,
    is_trial: !!sub.isTrial,
    trial_end_date: sub.trialEndDate || null,
    last_used_date: sub.lastUsedDate || null,
    usage_frequency: sub.usageFrequency || null,
    annual_price: sub.annualPrice || null,
    notes: sub.notes || null,
    status: sub.status || 'active',
    website_url: sub.websiteUrl || null,
    remind_days_before: sub.remindDaysBefore ?? 3,
    color: sub.color || '#64748b',
    updated_at: new Date().toISOString()
  };
}

export function dbRowToSubscription(row: any): Subscription {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount) || 0,
    currency: row.currency || 'USD',
    billingCycle: row.billing_cycle || 'monthly',
    nextBillingDate: row.next_billing_date,
    firstBillingDate: row.first_billing_date || undefined,
    category: row.category || 'Other',
    paymentMethodId: row.payment_method_id || undefined,
    accountEmail: row.account_email || undefined,
    accountPassword: row.account_password || undefined,
    passwordHint: row.password_hint || undefined,
    cancelUrl: row.cancel_url || undefined,
    isTrial: !!row.is_trial,
    trialEndDate: row.trial_end_date || undefined,
    lastUsedDate: row.last_used_date || undefined,
    usageFrequency: row.usage_frequency || undefined,
    annualPrice: row.annual_price ? Number(row.annual_price) : undefined,
    notes: row.notes || undefined,
    status: row.status || 'active',
    websiteUrl: row.website_url || undefined,
    remindDaysBefore: row.remind_days_before ?? 3,
    color: row.color || '#64748b',
    createdAt: row.created_at || new Date().toISOString()
  };
}

export function paymentMethodToDbRow(pm: PaymentMethod, userId: string): Record<string, any> {
  return {
    id: pm.id,
    user_id: userId,
    name: pm.name,
    brand: pm.brand || 'Visa',
    last_four: pm.lastFour || '0000',
    expiry_month: pm.expiryMonth || null,
    expiry_year: pm.expiryYear || null,
    is_default: !!pm.isDefault
  };
}

export function dbRowToPaymentMethod(row: any): PaymentMethod {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand || 'Visa',
    lastFour: row.last_four || '0000',
    expiryMonth: row.expiry_month || undefined,
    expiryYear: row.expiry_year || undefined,
    isDefault: !!row.is_default
  };
}
