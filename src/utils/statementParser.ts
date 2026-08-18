// 100% Client-Side Safe Bank and Credit Card Statement Parser
// Zero Cloud Exposure: All parsing runs exclusively in browser memory.
// Supports CSV, TSV, and Statement exports from Chase, Amex, BofA, Apple Card, Revolut, Monzo, PayPal, Stripe, etc.

import { BillingCycle, Subscription } from '../types';
import { POPULAR_SERVICES } from './catalog';
import { format, addMonths, parseISO } from 'date-fns';

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

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  cardLastFour?: string;
}

// Patterns for non-subscription one-off expenses (groceries, gas, dining, transfers)
const EXCLUSION_PATTERNS = [
  /whole foods/i,
  /trader joe/i,
  /kroger/i,
  /safeway/i,
  /costco/i,
  /starbucks/i,
  /mcdonald/i,
  /chipotle/i,
  /chevron/i,
  /shell oil/i,
  /exxon/i,
  /bp gas/i,
  /atm withdrawal/i,
  /zelle to/i,
  /venmo payment to/i,
  /transfer to/i,
  /check #/i,
  /uber eats/i,
  /doordash/i,
  /grubhub/i
];

export function parseBankStatementCSV(
  csvContent: string,
  existingSubs: Subscription[] = []
): StatementParsedItem[] {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  // 1. Detect headers and column indexes
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());

  let dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time') || h.includes('posted'));
  let descIdx = headers.findIndex(
    h => h.includes('description') || h.includes('merchant') || h.includes('payee') || h.includes('name') || h.includes('memo') || h.includes('title')
  );
  let amountIdx = headers.findIndex(
    h => h.includes('amount') || h.includes('debit') || h.includes('total') || h.includes('sum') || h.includes('cost')
  );
  let cardIdx = headers.findIndex(
    h => h.includes('card') || h.includes('account') || h.includes('last4') || h.includes('number')
  );

  // Fallbacks if no explicit headers found
  if (dateIdx === -1) dateIdx = 0;
  if (descIdx === -1) descIdx = Math.min(1, headers.length - 1);
  if (amountIdx === -1) amountIdx = Math.min(2, headers.length - 1);

  const rawRows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length <= Math.max(dateIdx, descIdx, amountIdx)) continue;

    const rawDesc = cols[descIdx] || '';
    const rawAmt = (cols[amountIdx] || '').replace(/[$€£¥₹,\s]/g, '');
    const rawDate = cols[dateIdx] || '';
    const rawCard = cardIdx >= 0 ? cols[cardIdx] : '';

    const numAmt = Math.abs(parseFloat(rawAmt));
    if (!rawDesc || isNaN(numAmt) || numAmt <= 0) continue;

    // Check exclusion patterns
    if (EXCLUSION_PATTERNS.some(p => p.test(rawDesc))) {
      continue;
    }

    const cardLastFour = extractCardLastFour(rawDesc) || extractCardLastFour(rawCard);

    rawRows.push({
      date: normalizeDate(rawDate),
      description: rawDesc,
      amount: numAmt,
      cardLastFour
    });
  }

  // 2. Group by merchant to detect recurring patterns
  const merchantGroups: Record<string, ParsedRow[]> = {};

  rawRows.forEach(row => {
    const matched = matchService(row.description);
    const key = matched ? matched.name.toLowerCase() : cleanMerchantName(row.description).toLowerCase();
    if (!merchantGroups[key]) merchantGroups[key] = [];
    merchantGroups[key].push(row);
  });

  const results: StatementParsedItem[] = [];

  for (const [key, rows] of Object.entries(merchantGroups)) {
    const latestRow = rows[rows.length - 1];
    const matchedService = matchService(latestRow.description);

    const name = matchedService ? matchedService.name : cleanMerchantName(latestRow.description);
    const category = matchedService ? matchedService.category : guessCategory(latestRow.description);
    const cycle: BillingCycle = matchedService ? matchedService.billingCycle : (latestRow.amount > 60 ? 'yearly' : 'monthly');
    
    // Calculate recurring confidence
    let confidence = matchedService ? 95 : 60;
    if (rows.length >= 2) {
      confidence = 100; // Strong recurring pattern found in statement history
    }

    const alreadyTracked = existingSubs.some(
      s => s.name.toLowerCase() === name.toLowerCase() && s.status !== 'cancelled'
    );

    results.push({
      id: `stmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      rawMerchant: latestRow.description,
      matchedService: name,
      amount: latestRow.amount,
      currency: 'USD',
      billingCycle: cycle,
      category,
      transactionDate: latestRow.date,
      frequencyScore: confidence,
      cardLastFour: latestRow.cardLastFour,
      cancelUrl: matchedService?.cancelUrl,
      websiteUrl: matchedService?.websiteUrl,
      selected: !alreadyTracked,
      alreadyTracked
    });
  }

  // Sort by confidence (matched services first)
  return results.sort((a, b) => b.frequencyScore - a.frequencyScore);
}

function extractCardLastFour(text: string): string | undefined {
  if (!text) return undefined;
  const match = text.match(/(?:card|ending in|acct|\*{4}|x{4}|••••)\s*(\d{4})/i) || text.match(/\b\d{4}\b/);
  return match ? match[1] || match[0] : undefined;
}

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let cur = '';

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'") {
      inQuotes = !inQuotes;
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

function normalizeDate(raw: string): string {
  try {
    const d = new Date(raw.trim());
    if (!isNaN(d.getTime())) {
      return format(d, 'yyyy-MM-dd');
    }
  } catch {
    // ignore
  }
  return format(new Date(), 'yyyy-MM-dd');
}

function matchService(desc: string) {
  const d = desc.toLowerCase();
  return POPULAR_SERVICES.find(s => {
    if (d.includes(s.name.toLowerCase())) return true;
    return s.aliases.some(alias => d.includes(alias.toLowerCase()));
  });
}

function cleanMerchantName(desc: string): string {
  return desc
    .replace(/^POS DEBIT\s+/i, '')
    .replace(/^PURCHASE AUTHORIZED ON\s+/i, '')
    .replace(/^PAYPAL \*/i, '')
    .replace(/^APL\*/i, '')
    .replace(/^GOOGLE \*/i, '')
    .replace(/\s+(INC|LLC|CORP|CO|LTD)\.?$/i, '')
    .replace(/[\d\*\#\.\-_]{4,}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function guessCategory(desc: string): string {
  const d = desc.toLowerCase();
  if (/music|spotify|apple music|tidal|pandora|soundcloud/i.test(d)) return 'Music';
  if (/stream|netflix|hulu|disney|hbo|prime video|youtube/i.test(d)) return 'Streaming';
  if (/cloud|aws|gcp|azure|digitalocean|heroku|vercel/i.test(d)) return 'Cloud';
  if (/game|playstation|xbox|nintendo|steam|ea play/i.test(d)) return 'Gaming';
  if (/gym|fitness|fitbit|strava|peloton|whoop/i.test(d)) return 'Fitness';
  if (/ai|openai|anthropic|cursor|github|adobe|figma|notion/i.test(d)) return 'Software';
  if (/mobile|internet|att|verizon|t-mobile|comcast|spectrum/i.test(d)) return 'Utilities';
  if (/news|nyt|wsj|bloomberg|the economist|medium/i.test(d)) return 'News';
  return 'Software';
}
