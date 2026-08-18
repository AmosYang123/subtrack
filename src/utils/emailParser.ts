import { Subscription, BillingCycle, EmailScanItem } from '../types';
import { POPULAR_SERVICES } from './catalog';
import { addMonths, format } from 'date-fns';

export interface RawEmail {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
}

export const SAMPLE_REAL_RECEIPTS = [
  {
    title: 'Apple Subscription (iCloud+ & Apple One)',
    from: 'no_reply@email.apple.com',
    subject: 'Your receipt from Apple for iCloud+ and Apple Services',
    body: `APPLE INVOICE
Document No: 198421098231
Apple ID: amos.dev@icloud.com
Date: 15 Aug 2026

Billed To: Apple Card (...1099)
Item: Apple One Premier (Includes Apple Music, Apple TV+, Apple Arcade, 2TB iCloud+, Apple Fitness+)
Renews: 15 Sep 2026
Amount: $37.95
Status: Paid`
  },
  {
    title: 'Stripe / OpenAI (ChatGPT Plus)',
    from: 'billing@openai.com',
    subject: 'Invoice for ChatGPT Plus Subscription (inv_1OxKz9Lkd)',
    body: `OpenAI, LLC
Invoice #INV-2026-889102
Amount Paid: $20.00 USD
Date: 12 Aug 2026
Description: ChatGPT Plus subscription - 1 month access to GPT-4o, DALL-E, Canvas
Next billing date: September 12, 2026
Payment Method: Mastercard ending in 8812`
  },
  {
    title: 'Google Play (YouTube Premium)',
    from: 'googleplay-noreply@google.com',
    subject: 'Google Play: Your recurring order receipt for YouTube Premium',
    body: `Google Play Order Receipt
Order number: GPA.3392-8172-9011-48201
Order date: Aug 10, 2026
Item: YouTube Premium (Monthly)
Auto-renews: Sep 10, 2026
Price: $13.99 / month
Tax: $0.00
Total: $13.99 charged to Visa ending in 4242`
  },
  {
    title: 'GitHub (GitHub Copilot Individual)',
    from: 'billing@github.com',
    subject: '[GitHub] Receipt for your GitHub Copilot subscription',
    body: `GitHub, Inc.
Receipt Number: GH-COPILOT-992014
Receipt Date: Aug 08, 2026
Item: GitHub Copilot for Individuals - Monthly plan
Quantity: 1
Amount: $10.00
Paid with Visa ending in 4242. Renews automatically on September 8, 2026.`
  },
  {
    title: 'Spotify (Premium Family Plan)',
    from: 'no-reply@spotify.com',
    subject: 'Your Spotify Premium Receipt for August 2026',
    body: `Spotify AB
Receipt for: Spotify Premium Family
Billing date: Aug 05, 2026
Next renewal: Sep 05, 2026
Total charged: $19.99
Payment method: Mastercard ending in 8812`
  },
  {
    title: 'Amazon Prime Annual Renewal',
    from: 'auto-confirm@amazon.com',
    subject: 'Your Amazon Prime membership has been renewed for the year',
    body: `Amazon Prime Membership Renewal
Member since: 2021
Plan: Prime Annual Membership
Term: Aug 2026 - Aug 2027
Total: $139.00
Payment method: Amex ending in 5002`
  }
];

export const MOCK_EMAILS: RawEmail[] = SAMPLE_REAL_RECEIPTS.map((r, i) => ({
  id: `em-${i + 1}`,
  from: r.from,
  subject: r.subject,
  body: r.body,
  date: new Date(Date.now() - 86400000 * (i + 1) * 2).toISOString()
}));

function extractCardNumber(text: string): string | undefined {
  const match = text.match(/(?:card|ending in|acct|\.{3}|\*{3,4}|••••)\s*(\d{4})/i) || text.match(/\b\d{4}\b/);
  return match ? match[1] || match[0] : undefined;
}

/**
 * Parses raw text from a pasted invoice, receipt or email body and returns a detected scan item.
 */
export function parseReceiptText(rawText: string, existingSubs: Subscription[] = []): EmailScanItem | null {
  if (!rawText || rawText.trim().length < 5) return null;

  const textToScan = rawText.toLowerCase();

  // 1. Match catalog service by longest matched alias
  let detectedService = '';
  let detectedCategory = 'Software';
  let defaultAmount = 0;
  let detectedCycle: BillingCycle = 'monthly';
  let confidence = 50;
  let cancelUrl: string | undefined;
  let websiteUrl: string | undefined;

  let bestMatch: (typeof POPULAR_SERVICES)[0] | null = null;
  for (const service of POPULAR_SERVICES) {
    for (const alias of service.aliases) {
      if (textToScan.includes(alias.toLowerCase())) {
        if (!bestMatch || alias.length > (bestMatch.aliases[0]?.length || 0)) {
          bestMatch = service;
        }
      }
    }
  }

  if (bestMatch) {
    detectedService = bestMatch.name;
    detectedCategory = bestMatch.category;
    defaultAmount = bestMatch.defaultAmount;
    detectedCycle = bestMatch.billingCycle;
    cancelUrl = bestMatch.cancelUrl;
    websiteUrl = bestMatch.websiteUrl;
    confidence += 35;
  }

  // 2. Extract Price & Currency
  let detectedAmount = 0;
  let detectedCurrency = 'USD';

  // Currency symbols and codes: $19.99, €20.00, £9.99, 20.00 USD, EUR 15.00
  const priceRegex = /([$€£¥₹])\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(USD|EUR|GBP|CAD|AUD|INR|JPY|SGD)|(USD|EUR|GBP|CAD|AUD)\s*(\d+(?:\.\d{1,2})?)/i;
  const match = rawText.match(priceRegex);

  if (match) {
    if (match[1] && match[2]) {
      detectedAmount = parseFloat(match[2]);
      const sym = match[1];
      if (sym === '€') detectedCurrency = 'EUR';
      else if (sym === '£') detectedCurrency = 'GBP';
      else if (sym === '¥') detectedCurrency = 'JPY';
      else if (sym === '₹') detectedCurrency = 'INR';
      else detectedCurrency = 'USD';
      confidence += 25;
    } else if (match[3] && match[4]) {
      detectedAmount = parseFloat(match[3]);
      detectedCurrency = match[4].toUpperCase();
      confidence += 25;
    } else if (match[5] && match[6]) {
      detectedAmount = parseFloat(match[6]);
      detectedCurrency = match[5].toUpperCase();
      confidence += 25;
    }
  } else if (defaultAmount > 0) {
    detectedAmount = defaultAmount;
  }

  // 3. Extract Billing cycle
  if (textToScan.includes('annual') || textToScan.includes('year') || textToScan.includes('/yr') || textToScan.includes('/ year')) {
    detectedCycle = 'yearly';
  } else if (textToScan.includes('week') || textToScan.includes('/wk')) {
    detectedCycle = 'weekly';
  } else if (textToScan.includes('quarter')) {
    detectedCycle = 'quarterly';
  } else {
    detectedCycle = 'monthly';
  }

  // 4. Fallback vendor name from text if catalog match failed
  if (!detectedService) {
    const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
    const firstLine = lines[0] || 'Unknown Service';
    detectedService = firstLine
      .replace(/invoice|receipt|payment|statement|bill|order|subscription/gi, '')
      .trim()
      .slice(0, 30);
    if (!detectedService) detectedService = 'Custom Receipt Service';
  }

  const cardLastFour = extractCardNumber(rawText);

  const alreadyTracked = existingSubs.some(
    s => s.name.toLowerCase() === detectedService.toLowerCase() && s.status !== 'cancelled'
  );

  return {
    id: `scan_${Date.now()}`,
    from: 'Pasted Receipt / Invoice',
    subject: `Parsed: ${detectedService}`,
    date: new Date().toISOString(),
    snippet: rawText.length > 140 ? rawText.substring(0, 140) + '...' : rawText,
    detectedService,
    detectedAmount: detectedAmount || defaultAmount || 9.99,
    detectedCurrency,
    detectedCycle,
    detectedCategory,
    confidence: Math.min(confidence, 99),
    cardLastFour,
    cancelUrl,
    websiteUrl,
    alreadyTracked,
    selected: !alreadyTracked
  };
}

export function parseInboxEmails(emails: RawEmail[], existingSubs: Subscription[]): EmailScanItem[] {
  return emails.map(email => {
    const textToScan = `${email.subject} ${email.body}`.toLowerCase();

    // 1. Identify Service from Catalog by longest matched alias
    let detectedService = '';
    let detectedCategory = 'Other';
    let defaultAmount = 0;
    let detectedCycle: BillingCycle = 'monthly';
    let confidence = 50;
    let cancelUrl: string | undefined;
    let websiteUrl: string | undefined;

    let bestMatch: (typeof POPULAR_SERVICES)[0] | null = null;
    for (const service of POPULAR_SERVICES) {
      for (const alias of service.aliases) {
        if (textToScan.includes(alias.toLowerCase())) {
          if (!bestMatch || alias.length > (bestMatch.aliases[0]?.length || 0)) {
            bestMatch = service;
          }
        }
      }
    }

    if (bestMatch) {
      detectedService = bestMatch.name;
      detectedCategory = bestMatch.category;
      defaultAmount = bestMatch.defaultAmount;
      detectedCycle = bestMatch.billingCycle;
      cancelUrl = bestMatch.cancelUrl;
      websiteUrl = bestMatch.websiteUrl;
      confidence += 30;
    }

    if (!detectedService) {
      const cleaned = email.subject
        .replace(/^(re:|fwd:|\s*\[.*?\]|\s*receipt\s*for|\s*invoice\s*for|\s*your\s*)/i, '')
        .replace(/subscription|membership|renewal|receipt|invoice|payment/gi, '')
        .trim();
      const firstWords = cleaned.split(/[:\-\–]/)[0].trim().split(' ').slice(0, 2).join(' ');
      detectedService = firstWords || 'Unknown Service';
    }

    // 2. Identify Amount & Currency
    let detectedAmount = 0;
    let detectedCurrency = 'USD';

    const priceRegex = /([$€£¥₹])\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(USD|EUR|GBP|CAD|AUD)/i;
    const match = `${email.subject} ${email.body}`.match(priceRegex);

    if (match) {
      if (match[1] && match[2]) {
        detectedAmount = parseFloat(match[2]);
        const sym = match[1];
        if (sym === '€') detectedCurrency = 'EUR';
        else if (sym === '£') detectedCurrency = 'GBP';
        else if (sym === '¥') detectedCurrency = 'JPY';
        else if (sym === '₹') detectedCurrency = 'INR';
        else detectedCurrency = 'USD';
        confidence += 20;
      } else if (match[3] && match[4]) {
        detectedAmount = parseFloat(match[3]);
        detectedCurrency = match[4].toUpperCase();
        confidence += 20;
      }
    } else if (defaultAmount > 0) {
      detectedAmount = defaultAmount;
      confidence += 10;
    }

    // 3. Identify Billing Cycle
    if (textToScan.includes('annual') || textToScan.includes('year') || textToScan.includes('/yr')) {
      detectedCycle = 'yearly';
    } else if (textToScan.includes('week') || textToScan.includes('/wk')) {
      detectedCycle = 'weekly';
    } else if (textToScan.includes('quarter')) {
      detectedCycle = 'quarterly';
    } else {
      detectedCycle = 'monthly';
    }

    const cardLastFour = extractCardNumber(`${email.subject} ${email.body}`);

    const alreadyTracked = existingSubs.some(
      s => s.name.toLowerCase() === detectedService.toLowerCase() && s.status !== 'cancelled'
    );

    return {
      id: email.id,
      from: email.from,
      subject: email.subject,
      date: email.date,
      snippet: email.body.length > 120 ? email.body.substring(0, 120) + '...' : email.body,
      detectedService,
      detectedAmount: detectedAmount || defaultAmount || 9.99,
      detectedCurrency,
      detectedCycle,
      detectedCategory,
      confidence: Math.min(confidence, 98),
      cardLastFour,
      cancelUrl,
      websiteUrl,
      alreadyTracked,
      selected: !alreadyTracked
    };
  });
}

export function convertScanItemToSubscription(item: EmailScanItem, paymentMethodId?: string): Subscription {
  return {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: item.detectedService,
    amount: item.detectedAmount,
    currency: item.detectedCurrency || 'USD',
    billingCycle: item.detectedCycle,
    nextBillingDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    category: item.detectedCategory || 'Other',
    paymentMethodId: paymentMethodId || 'pm_default',
    cancelUrl: item.cancelUrl,
    websiteUrl: item.websiteUrl,
    notes: `Discovered from receipt: "${item.subject}"`,
    status: 'active',
    createdAt: new Date().toISOString()
  };
}
