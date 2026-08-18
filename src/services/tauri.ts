// Tauri bridge service
// Transparently handles native Tauri IPC when running in desktop mode,
// or provides fallback to localStorage when running in the browser.

import { Subscription, PaymentMethod, EmailScanItem } from '../types';
import { MOCK_EMAILS, parseInboxEmails } from '../utils/emailParser';

const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

const devWarn = (msg: string, err?: unknown) => {
  if (import.meta.env.DEV) {
    console.warn(msg, err);
  }
};

export async function getSubscriptions(): Promise<Subscription[]> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      return await invoke<Subscription[]>('get_subscriptions');
    } catch (e) {
      devWarn('Tauri invoke get_subscriptions failed, falling back to localStorage', e);
    }
  }
  const raw = localStorage.getItem('subtrack_subscriptions_v2');
  return raw ? JSON.parse(raw) : [];
}

export async function saveSubscription(sub: Subscription): Promise<void> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      await invoke('save_subscription', { subscription: sub });
      return;
    } catch (e) {
      devWarn('Tauri invoke save_subscription failed, falling back to localStorage', e);
    }
  }
  const existing = await getSubscriptions();
  const updated = [...existing.filter(s => s.id !== sub.id), sub];
  localStorage.setItem('subtrack_subscriptions_v2', JSON.stringify(updated));
}

export async function deleteSubscription(id: string): Promise<void> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      await invoke('delete_subscription', { id });
      return;
    } catch (e) {
      devWarn('Tauri invoke delete_subscription failed, falling back to localStorage', e);
    }
  }
  const existing = await getSubscriptions();
  localStorage.setItem(
    'subtrack_subscriptions_v2',
    JSON.stringify(existing.filter(s => s.id !== id))
  );
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      return await invoke<PaymentMethod[]>('get_payment_methods');
    } catch (e) {
      devWarn('Tauri invoke get_payment_methods failed', e);
    }
  }
  const raw = localStorage.getItem('subtrack_payment_methods_v2');
  return raw ? JSON.parse(raw) : [];
}

export async function scanEmails(existingSubs: Subscription[] = []): Promise<EmailScanItem[]> {
  // In real desktop app with email integration, this calls backend IMAP/OAuth
  // For browser or mock demo, it parses rich mock inbox receipts
  return parseInboxEmails(MOCK_EMAILS, existingSubs);
}
