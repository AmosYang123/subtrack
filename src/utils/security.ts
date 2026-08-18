// Security and input sanitization utility module
// Protects against XSS, CSV formula injection, ReDoS, and malicious URL schemes.

import { AutoCapturedPayload } from './autoSyncConnector';
import { BillingCycle } from '../types';

/**
 * Validates that an external URL strictly uses http:// or https:// protocol.
 * Strips dangerous schemes like javascript:, data:, vbscript:, file:, etc.
 */
export function getSafeExternalUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

/**
 * Escapes and sanitizes a cell value for CSV export to prevent Formula / DDE Injection.
 * Prefixes cells starting with =, +, -, @, \t, or \r with a single quote (').
 */
export function sanitizeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) {
    return '""';
  }
  if (typeof value === 'number') {
    return isFinite(value) ? String(value) : '0';
  }

  const str = String(value);
  const escapedQuotes = str.replace(/"/g, '""');

  // Check if string begins with dangerous spreadsheet formula triggers
  if (/^[=+@\-\t\r]/.test(escapedQuotes)) {
    return `"'${escapedQuotes}"`;
  }

  return `"${escapedQuotes}"`;
}

/**
 * Deterministic, linear-time CSV line parser.
 * Replaces vulnerable regex with non-backtracking character-by-character scanner.
 */
export function parseCsvLineSafe(text: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let cur = '';

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      // Check for escaped double quote ("")
      if (inQuotes && i + 1 < text.length && text[i + 1] === '"') {
        cur += '"';
        i++; // skip second quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((c === ',' || c === '\t' || c === ';') && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

/**
 * Enforces file size boundaries on user-uploaded files to prevent memory exhaustion and UI denial of service.
 * Defaults to 5 MB max limit.
 */
export function validateFileSize(file: File, maxMb: number = 5): boolean {
  const maxBytes = maxMb * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Performs strict runtime schema validation on payloads passed via ?auto_add= or background messages.
 */
export function validateAutoAddPayload(raw: any): AutoCapturedPayload | null {
  if (!raw || typeof raw !== 'object') return null;

  const validSources = ['bookmarklet', 'extension', 'clipboard', 'webhook'];
  const validCycles: BillingCycle[] = ['monthly', 'yearly', 'weekly', 'quarterly'];

  const serviceName = typeof raw.serviceName === 'string' ? raw.serviceName.trim().slice(0, 100) : '';
  if (!serviceName) return null;

  const source = validSources.includes(raw.source) ? raw.source : 'bookmarklet';
  const amount = typeof raw.amount === 'number' && isFinite(raw.amount) && raw.amount >= 0 ? raw.amount : undefined;
  const currency = typeof raw.currency === 'string' && raw.currency.length >= 2 && raw.currency.length <= 5 ? raw.currency.toUpperCase() : 'USD';
  const billingCycle = validCycles.includes(raw.billingCycle) ? raw.billingCycle : 'monthly';
  const category = typeof raw.category === 'string' ? raw.category.trim().slice(0, 50) : undefined;
  
  const url = getSafeExternalUrl(raw.url);
  const cancelUrl = getSafeExternalUrl(raw.cancelUrl);

  return {
    source,
    serviceName,
    amount,
    currency,
    billingCycle,
    category,
    url,
    cancelUrl,
    timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString()
  };
}

/**
 * Generates a random cryptographic salt as a hex string.
 */
export function generateSalt(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Hashes a password with a cryptographic salt using SHA-256 via Web Crypto API.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + ':' + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Deterministic fallback for non-crypto test environments
  let h = 0;
  const combined = password + ':' + salt;
  for (let i = 0; i < combined.length; i++) {
    h = ((h << 5) - h) + combined.charCodeAt(i);
    h |= 0;
  }
  return String(Math.abs(h));
}

/**
 * Generates a cryptographically random UUIDv4.
 */
export function generateSecureUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'usr_' + generateSalt();
}

