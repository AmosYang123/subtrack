// Bank and credit card statement parser
// Supports CSV/TSV exports from Chase, Amex, BofA, Apple Card, Revolut, Monzo, PayPal, Stripe, etc.

import { StatementParsedItem, BillingCycle, Subscription } from '../types';
import { POPULAR_SERVICES } from './catalog';
import { format, addMonths } from 'date-fns';

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
}

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

    const numAmt = Math.abs(parseFloat(rawAmt));
    if (!rawDesc || isNaN(numAmt) || numAmt <= 0) continue;

    rawRows.push({
      date: normalizeDate(rawDate),
      description: rawDesc,
      amount: numAmt
    });
  }

  // 2. Identify potential recurring subscription transactions
  const results: StatementParsedItem[] = [];
  const processedKeys = new Set<string>();

  for (const row of rawRows) {
    const matchedService = matchService(row.description);
    const serviceKey = matchedService ? matchedService.name.toLowerCase() : row.description.toLowerCase().trim();

    if (processedKeys.has(serviceKey)) continue;
    processedKeys.add(serviceKey);

    const name = matchedService ? matchedService.name : cleanMerchantName(row.description);
    const category = matchedService ? matchedService.category : guessCategory(row.description);
    const cycle: BillingCycle = matchedService ? matchedService.billingCycle : (row.amount > 60 ? 'yearly' : 'monthly');
    const confidence = matchedService ? 95 : 65;

    const alreadyTracked = existingSubs.some(
      s => s.name.toLowerCase() === name.toLowerCase() && s.status !== 'cancelled'
    );

    results.push({
      id: `stmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      rawMerchant: row.description,
      matchedService: name,
      amount: row.amount,
      currency: 'USD',
      billingCycle: cycle,
      category,
      transactionDate: row.date,
      frequencyScore: confidence,
      selected: !alreadyTracked,
      alreadyTracked
    });
  }

  // Sort by confidence (matched services first)
  return results.sort((a, b) => b.frequencyScore - a.frequencyScore);
}

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let cur = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

function normalizeDate(raw: string): string {
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return format(d, 'yyyy-MM-dd');
    }
  } catch {
    // ignore
  }
  return format(new Date(), 'yyyy-MM-dd');
}

function matchService(desc: string) {
  const lower = desc.toLowerCase();
  for (const svc of POPULAR_SERVICES) {
    if (svc.aliases.some(alias => lower.includes(alias.toLowerCase()))) {
      return svc;
    }
  }
  return null;
}

function cleanMerchantName(desc: string): string {
  // Remove common card transaction noise like "POS DEBIT", "RECURRING", "PAYPAL *", "SQ *", "TST*", numbers, etc.
  let cleaned = desc
    .replace(/^(pos debit|recurring debit|ach debit|card purchase|chk card|debit purchase|purchase authorized on \d\d\/\d\d)\s*/i, '')
    .replace(/(paypal \*|sq \*|tst\*|amzn mktp|apple\.com\/bill|google \*|stripe \*)/i, '')
    .replace(/\b(inc|llc|corp|co|ltd|com|net|org|bill|payment|services|sub|subscription)\b/gi, '')
    .replace(/[0-9#\*\-_]{3,}/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Capitalize words
  if (!cleaned) cleaned = desc;
  return cleaned
    .split(' ')
    .slice(0, 3)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function guessCategory(desc: string): string {
  const lower = desc.toLowerCase();
  if (lower.includes('music') || lower.includes('audio') || lower.includes('sound')) return 'Music';
  if (lower.includes('tv') || lower.includes('stream') || lower.includes('video') || lower.includes('movie')) return 'Streaming';
  if (lower.includes('cloud') || lower.includes('host') || lower.includes('server') || lower.includes('aws') || lower.includes('storage')) return 'Cloud';
  if (lower.includes('gym') || lower.includes('fitness') || lower.includes('workout') || lower.includes('athletic')) return 'Fitness';
  if (lower.includes('game') || lower.includes('play') || lower.includes('xbox') || lower.includes('nintendo')) return 'Gaming';
  if (lower.includes('news') || lower.includes('times') || lower.includes('post') || lower.includes('journal')) return 'News';
  if (lower.includes('learn') || lower.includes('edu') || lower.includes('academy') || lower.includes('course')) return 'Education';
  return 'Software';
}
