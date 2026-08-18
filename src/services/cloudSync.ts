import { Subscription, PaymentMethod, UserAccount, CloudSyncStatus } from '../types';

const AUTH_USER_KEY = 'subtrax_auth_user_v1';
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

// Generate a consistent, deterministic user ID from email for reliable account recovery
export function getUserIdForEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash |= 0;
  }
  const cleanPrefix = normalized.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || 'usr';
  return `usr_${cleanPrefix}_${Math.abs(hash).toString(36)}`;
}

class CloudSyncService {
  private channel: BroadcastChannel | null = null;
  private syncListeners: ((status: CloudSyncStatus) => void)[] = [];
  private dataListeners: ((payload: CloudPayload) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'DATA_UPDATED') {
            this.notifyDataListeners(event.data.payload);
          } else if (event.data && event.data.type === 'AUTH_CHANGED') {
            if (event.data.user) {
              this.notifyDataListeners(this.getCloudVault(event.data.user.id));
            }
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or blocked:', e);
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

    const userId = getUserIdForEmail(email);
    const user: UserAccount = {
      id: userId,
      email: email.trim().toLowerCase(),
      name: name?.trim() || email.split('@')[0],
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

    const userId = getUserIdForEmail(email);
    const user: UserAccount = {
      id: userId,
      email: email.trim().toLowerCase(),
      name: email.split('@')[0],
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString()
    };

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    this.broadcastAuthChange(user);
    return user;
  }

  public async signOut(): Promise<void> {
    localStorage.removeItem(AUTH_USER_KEY);
    this.broadcastAuthChange(null);
  }

  public getCloudVault(userId: string): CloudPayload {
    try {
      const raw = localStorage.getItem(`${CLOUD_VAULT_KEY_PREFIX}${userId}`);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
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

    try {
      localStorage.setItem(`${CLOUD_VAULT_KEY_PREFIX}${user.id}`, JSON.stringify(payload));
      
      // Broadcast to other open tabs / windows
      if (this.channel) {
        this.channel.postMessage({
          type: 'DATA_UPDATED',
          payload
        });
      }

      this.notifyStatusListeners('synced');
    } catch (e) {
      console.error('Failed to sync to cloud:', e);
      this.notifyStatusListeners('offline');
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

/**
 * Extracts a list of unique suggested emails from previous subscriptions and user account,
 * sorted by frequency of use.
 */
export function getSuggestedAccountEmails(
  subscriptions: Subscription[],
  currentUser?: UserAccount | null
): string[] {
  const counts: Record<string, number> = {};

  if (currentUser?.email) {
    counts[currentUser.email.toLowerCase()] = 100; // prioritize user's login email
  }

  subscriptions.forEach((sub) => {
    if (sub.accountEmail && sub.accountEmail.trim()) {
      const email = sub.accountEmail.trim().toLowerCase();
      counts[email] = (counts[email] || 0) + 1;
    }
  });

  return Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
}
