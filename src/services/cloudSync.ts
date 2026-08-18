import { Subscription, PaymentMethod, UserAccount, CloudSyncStatus } from '../types';
import { hashPassword, generateSalt, generateSecureUUID } from '../utils/security';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  subscriptionToDbRow,
  dbRowToSubscription,
  paymentMethodToDbRow,
  dbRowToPaymentMethod
} from './supabase';

const AUTH_USER_KEY = 'subtrax_auth_user_v1';
const USERS_REGISTRY_KEY = 'subtrax_user_registry_v1';
const CLOUD_VAULT_KEY_PREFIX = 'subtrax_cloud_vault_';
const BROADCAST_CHANNEL_NAME = 'subtrax_sync_channel';

export interface CloudPayload {
  version: number;
  userId: string;
  updatedAt: string;
  subscriptions: Subscription[];
  paymentMethods: PaymentMethod[];
  currency: string;
}

interface UserRegistryEntry {
  userId: string;
  email: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

function getUserRegistry(): Record<string, UserRegistryEntry> {
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUserRegistry(registry: Record<string, UserRegistryEntry>): void {
  try {
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('Failed to save user registry:', e);
    }
  }
}

export function getUserIdForEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const registry = getUserRegistry();
  if (registry[normalized]?.userId) {
    return registry[normalized].userId;
  }
  return generateSecureUUID();
}

class CloudSyncService {
  private channel: BroadcastChannel | null = null;
  private supabaseRealtimeChannel: any = null;
  private syncListeners: ((status: CloudSyncStatus) => void)[] = [];
  private dataListeners: ((payload: CloudPayload) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          const currentUser = this.getStoredUser();
          if (!currentUser) return;

          if (event.data && event.data.type === 'DATA_UPDATED') {
            const incomingPayload = event.data.payload as CloudPayload;
            if (incomingPayload && incomingPayload.userId === currentUser.id) {
              this.notifyDataListeners(incomingPayload);
            }
          } else if (event.data && event.data.type === 'AUTH_CHANGED') {
            if (event.data.user && event.data.user.id === currentUser.id) {
              this.notifyDataListeners(this.getCloudVault(event.data.user.id));
            }
          }
        };
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('BroadcastChannel not supported or blocked:', e);
        }
      }
    }
  }

  public getStoredUser(): UserAccount | null {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public async signUp(email: string, password: string, name?: string): Promise<UserAccount> {
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const normalized = email.trim().toLowerCase();
    const supabase = getSupabaseClient();

    // 1. Supabase Cloud Auth if configured
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: {
          data: {
            name: name?.trim() || normalized.split('@')[0]
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Failed to create account. Please try again.');
      }

      const user: UserAccount = {
        id: data.user.id,
        email: data.user.email || normalized,
        name: data.user.user_metadata?.name || name?.trim() || normalized.split('@')[0],
        createdAt: data.user.created_at || new Date().toISOString(),
        lastSyncedAt: new Date().toISOString()
      };

      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      this.broadcastAuthChange(user);
      this.initSupabaseRealtime(user.id);
      return user;
    }

    // 2. Local Vault fallback
    const registry = getUserRegistry();
    if (registry[normalized]) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const userId = generateSecureUUID();

    registry[normalized] = {
      userId,
      email: normalized,
      salt,
      passwordHash,
      createdAt: new Date().toISOString()
    };
    saveUserRegistry(registry);

    const user: UserAccount = {
      id: userId,
      email: normalized,
      name: name?.trim() || normalized.split('@')[0],
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString()
    };

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    this.broadcastAuthChange(user);
    return user;
  }

  public async signIn(email: string, password: string): Promise<UserAccount> {
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const normalized = email.trim().toLowerCase();
    const supabase = getSupabaseClient();

    // 1. Supabase Cloud Auth if configured
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalized,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('No user returned from authentication.');
      }

      const user: UserAccount = {
        id: data.user.id,
        email: data.user.email || normalized,
        name: data.user.user_metadata?.name || normalized.split('@')[0],
        createdAt: data.user.created_at || new Date().toISOString(),
        lastSyncedAt: new Date().toISOString()
      };

      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      this.broadcastAuthChange(user);
      this.initSupabaseRealtime(user.id);
      return user;
    }

    // 2. Local Vault fallback
    const registry = getUserRegistry();
    const record = registry[normalized];

    if (!record) {
      throw new Error('No account found for this email. Please create an account.');
    }

    const computedHash = await hashPassword(password, record.salt);
    if (computedHash !== record.passwordHash) {
      throw new Error('Invalid email or password.');
    }

    const user: UserAccount = {
      id: record.userId,
      email: normalized,
      name: normalized.split('@')[0],
      createdAt: record.createdAt,
      lastSyncedAt: new Date().toISOString()
    };

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    this.broadcastAuthChange(user);
    return user;
  }

  public async signOut(): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // Continue with local cleanup
      }
    }

    if (this.supabaseRealtimeChannel) {
      try {
        this.supabaseRealtimeChannel.unsubscribe();
        this.supabaseRealtimeChannel = null;
      } catch {}
    }

    localStorage.removeItem(AUTH_USER_KEY);
    this.broadcastAuthChange(null);
  }

  public async pullFromCloud(userId: string): Promise<CloudPayload | null> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return this.getCloudVault(userId);
    }

    try {
      this.notifyStatusListeners('syncing');

      const [subsRes, paymentsRes] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', userId),
        supabase.from('payment_methods').select('*').eq('user_id', userId)
      ]);

      if (subsRes.error) {
        if (import.meta.env.DEV) console.warn('Supabase pull error:', subsRes.error);
        return this.getCloudVault(userId);
      }

      const subscriptions = (subsRes.data || []).map(dbRowToSubscription);
      const paymentMethods = (paymentsRes.data || []).map(dbRowToPaymentMethod);

      const payload: CloudPayload = {
        version: 1,
        userId,
        updatedAt: new Date().toISOString(),
        subscriptions,
        paymentMethods,
        currency: 'USD'
      };

      // Also cache in local vault for offline availability
      localStorage.setItem(`${CLOUD_VAULT_KEY_PREFIX}${userId}`, JSON.stringify(payload));
      this.notifyStatusListeners('synced');
      return payload;
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to pull from Supabase:', err);
      this.notifyStatusListeners('offline');
      return this.getCloudVault(userId);
    }
  }

  public getCloudVault(userId: string): CloudPayload {
    try {
      const raw = localStorage.getItem(`${CLOUD_VAULT_KEY_PREFIX}${userId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      version: 1,
      userId,
      updatedAt: new Date().toISOString(),
      subscriptions: [],
      paymentMethods: [],
      currency: 'USD'
    };
  }

  public async pushToCloud(
    user: UserAccount,
    subscriptions: Subscription[],
    paymentMethods: PaymentMethod[],
    currency: string
  ): Promise<void> {
    if (!user) return;

    this.notifyStatusListeners('syncing');

    const payload: CloudPayload = {
      version: 1,
      userId: user.id,
      updatedAt: new Date().toISOString(),
      subscriptions,
      paymentMethods,
      currency
    };

    // 1. Always update local vault for instant offline access
    try {
      localStorage.setItem(`${CLOUD_VAULT_KEY_PREFIX}${user.id}`, JSON.stringify(payload));
    } catch {}

    // 2. Broadcast across local browser tabs
    if (this.channel) {
      const broadcastSubs = subscriptions.map((s) => {
        const { accountPassword, ...rest } = s;
        return rest as Subscription;
      });

      this.channel.postMessage({
        type: 'DATA_UPDATED',
        payload: {
          ...payload,
          subscriptions: broadcastSubs
        }
      });
    }

    // 3. Remote Supabase sync if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const subRows = subscriptions.map(s => subscriptionToDbRow(s, user.id));
        const pmRows = paymentMethods.map(pm => paymentMethodToDbRow(pm, user.id));

        // Sync Subscriptions
        if (subRows.length > 0) {
          const { error: subErr } = await supabase.from('subscriptions').upsert(subRows);
          if (subErr && import.meta.env.DEV) console.warn('Supabase upsert subs error:', subErr);
        }

        // Sync Payment Methods
        if (pmRows.length > 0) {
          const { error: pmErr } = await supabase.from('payment_methods').upsert(pmRows);
          if (pmErr && import.meta.env.DEV) console.warn('Supabase upsert payments error:', pmErr);
        }

        this.notifyStatusListeners('synced');
      } catch (err) {
        if (import.meta.env.DEV) console.error('Supabase push error:', err);
        this.notifyStatusListeners('offline');
      }
    } else {
      this.notifyStatusListeners('synced');
    }
  }

  public async deleteSubscriptionRemote(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase && userId) {
      try {
        await supabase.from('subscriptions').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Supabase delete sub error:', err);
      }
    }
  }

  public async deletePaymentMethodRemote(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase && userId) {
      try {
        await supabase.from('payment_methods').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Supabase delete payment error:', err);
      }
    }
  }

  public initSupabaseRealtime(userId: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return;

    if (this.supabaseRealtimeChannel) {
      try {
        this.supabaseRealtimeChannel.unsubscribe();
      } catch {}
    }

    try {
      this.supabaseRealtimeChannel = supabase
        .channel(`public:user:${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${userId}` },
          async () => {
            const updated = await this.pullFromCloud(userId);
            if (updated) {
              this.notifyDataListeners(updated);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'payment_methods', filter: `user_id=eq.${userId}` },
          async () => {
            const updated = await this.pullFromCloud(userId);
            if (updated) {
              this.notifyDataListeners(updated);
            }
          }
        )
        .subscribe();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Realtime subscription error:', err);
      }
    }
  }

  private broadcastAuthChange(user: UserAccount | null) {
    if (this.channel) {
      this.channel.postMessage({
        type: 'AUTH_CHANGED',
        user
      });
    }
  }

  public onStatusChange(listener: (status: CloudSyncStatus) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener);
    };
  }

  public onDataSync(listener: (payload: CloudPayload) => void): () => void {
    this.dataListeners.push(listener);
    return () => {
      this.dataListeners = this.dataListeners.filter((l) => l !== listener);
    };
  }

  private notifyStatusListeners(status: CloudSyncStatus) {
    this.syncListeners.forEach((l) => l(status));
  }

  private notifyDataListeners(payload: CloudPayload) {
    this.dataListeners.forEach((l) => l(payload));
  }
}

export const cloudSync = new CloudSyncService();

export function getSuggestedAccountEmails(
  subscriptions: Subscription[],
  currentUser?: UserAccount | null
): string[] {
  const counts: Record<string, number> = {};

  if (currentUser?.email) {
    counts[currentUser.email.toLowerCase()] = 100;
  }

  subscriptions.forEach((sub) => {
    if (sub.accountEmail && sub.accountEmail.trim()) {
      const email = sub.accountEmail.trim().toLowerCase();
      counts[email] = (counts[email] || 0) + 1;
    }
  });

  return Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
}
