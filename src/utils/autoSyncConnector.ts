// Zero-Touch Autonomous Background Connector
// Allows registering subscriptions directly upon checkout on Spotify, Netflix, OpenAI, etc.
// without needing manual entry.

import { findCatalogService } from './catalog';
import { parseReceiptText } from './emailParser';
import { Subscription, BillingCycle } from '../types';
import { validateAutoAddPayload, getSafeExternalUrl } from './security';

const AUTOSYNC_CHANNEL_NAME = 'subtrax_autosync_channel';

export interface AutoCapturedPayload {
  source: 'bookmarklet' | 'extension' | 'clipboard' | 'webhook';
  serviceName: string;
  amount?: number;
  currency?: string;
  url?: string;
  cancelUrl?: string;
  category?: string;
  billingCycle?: BillingCycle;
  timestamp: string;
}

/**
 * Returns the executable JavaScript bookmarklet code for 1-click subscription capture from any webpage.
 */
export function getSubtraxBookmarkletCode(): string {
  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://subtrax.vercel.app';

  const code = `
    javascript:(function(){
      try {
        var domain = window.location.hostname.replace(/^www\\./, '');
        var pageTitle = document.title;
        var fullUrl = window.location.href;
        
        // Scan for price patterns in page text
        var text = document.body.innerText || '';
        var priceMatch = text.match(/([$€£¥₹])\\s*(\\d+(?:\\.\\d{1,2})?)/);
        var amount = priceMatch ? parseFloat(priceMatch[2]) : null;
        var currency = priceMatch ? (priceMatch[1] === '€' ? 'EUR' : priceMatch[1] === '£' ? 'GBP' : 'USD') : 'USD';
        
        var payload = {
          source: 'bookmarklet',
          serviceName: pageTitle.split(/[-–|]/)[0].trim() || domain,
          url: fullUrl,
          amount: amount,
          currency: currency,
          timestamp: new Date().toISOString()
        };
        
        var subtraxUrl = '${currentHost}/?auto_add=' + encodeURIComponent(JSON.stringify(payload));
        window.open(subtraxUrl, '_blank');
      } catch(e) {
        alert('Subtrax Auto-Sync: ' + e.message);
      }
    })();
  `.replace(/\s+/g, ' ').trim();

  return code;
}

/**
 * Parses and consumes the ?auto_add= parameter from the current URL if present.
 * Cleans the URL without triggering a page reload.
 */
export function parseAutoAddUrlQuery(): AutoCapturedPayload | null {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const autoAddRaw = params.get('auto_add');
    if (!autoAddRaw) return null;

    const parsedRaw = JSON.parse(decodeURIComponent(autoAddRaw));
    const payload = validateAutoAddPayload(parsedRaw);

    // Clean URL query parameter cleanly
    const url = new URL(window.location.href);
    url.searchParams.delete('auto_add');
    window.history.replaceState({}, document.title, url.toString());

    return payload;
  } catch (e) {
    console.warn('Failed to parse auto_add query parameter:', e);
    return null;
  }
}

/**
 * Listens for background captures sent via BroadcastChannel
 */
export function listenForAutoSyncCaptures(
  onCapture: (payload: AutoCapturedPayload) => void
): () => void {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return () => {};
  }

  try {
    const channel = new BroadcastChannel(AUTOSYNC_CHANNEL_NAME);
    channel.onmessage = (event) => {
      const validated = validateAutoAddPayload(event.data);
      if (validated) {
        onCapture(validated);
      }
    };

    return () => {
      channel.close();
    };
  } catch (e) {
    console.warn('AutoSync BroadcastChannel unavailable:', e);
    return () => {};
  }
}

/**
 * Checks clipboard text for subscription receipts or checkout confirmations
 */
export async function checkClipboardForReceipt(
  existingSubs: Subscription[]
): Promise<AutoCapturedPayload | null> {
  if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.readText) {
    return null;
  }

  try {
    const text = await navigator.clipboard.readText();
    if (!text || text.length < 10) return null;

    // Check for receipt patterns
    const parsed = parseReceiptText(text, existingSubs);
    if (parsed && parsed.confidence >= 70 && !parsed.alreadyTracked) {
      return {
        source: 'clipboard',
        serviceName: parsed.detectedService,
        amount: parsed.detectedAmount,
        currency: parsed.detectedCurrency,
        category: parsed.detectedCategory,
        billingCycle: parsed.detectedCycle,
        cancelUrl: getSafeExternalUrl(parsed.cancelUrl),
        url: getSafeExternalUrl(parsed.websiteUrl),
        timestamp: new Date().toISOString()
      };
    }
  } catch {
    // Clipboard permission denied or unavailable
  }

  return null;
}
