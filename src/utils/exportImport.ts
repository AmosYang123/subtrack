import { Subscription, BillingCycle, SubscriptionStatus } from '../types';
import { sanitizeCsvCell, parseCsvLineSafe } from './security';

export function exportSubscriptionsToCSV(subscriptions: Subscription[]): string {
  const headers = [
    'ID',
    'Name',
    'Amount',
    'Currency',
    'Billing Cycle',
    'Next Billing Date',
    'Category',
    'Status',
    'Website',
    'Notes'
  ];

  const rows = subscriptions.map(sub => [
    sanitizeCsvCell(sub.id),
    sanitizeCsvCell(sub.name),
    sub.amount,
    sanitizeCsvCell(sub.currency),
    sanitizeCsvCell(sub.billingCycle),
    sanitizeCsvCell(sub.nextBillingDate),
    sanitizeCsvCell(sub.category),
    sanitizeCsvCell(sub.status),
    sanitizeCsvCell(sub.websiteUrl || ''),
    sanitizeCsvCell(sub.notes || '')
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportSubscriptionsToJSON(subscriptions: Subscription[]): string {
  // Strip sensitive account passwords before exporting backup files
  const sanitizedSubs = subscriptions.map(sub => {
    const { accountPassword, ...rest } = sub;
    return rest;
  });

  return JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      subscriptions: sanitizedSubs
    },
    null,
    2
  );
}

export function parseSubscriptionsFromCSV(csvText: string): Partial<Subscription>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const headers = parseCsvLineSafe(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('service') || h.includes('title'));
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('cost') || h.includes('price'));
  const cycleIdx = headers.findIndex(h => h.includes('cycle') || h.includes('frequency') || h.includes('period'));
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('billing') || h.includes('renewal'));
  const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('type'));
  const statusIdx = headers.findIndex(h => h.includes('status') || h.includes('state'));

  const parsed: Partial<Subscription>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const matches = parseCsvLineSafe(lines[i]);
    if (matches.length === 0) continue;

    const name = nameIdx !== -1 && matches[nameIdx] ? matches[nameIdx] : matches[0];
    if (!name) continue;

    const rawAmount = amountIdx !== -1 && matches[amountIdx] ? matches[amountIdx].replace(/[^0-9.]/g, '') : '9.99';
    const amount = parseFloat(rawAmount) || 0;

    let billingCycle: BillingCycle = 'monthly';
    if (cycleIdx !== -1 && matches[cycleIdx]) {
      const c = matches[cycleIdx].toLowerCase();
      if (c.includes('year') || c.includes('annual')) billingCycle = 'yearly';
      else if (c.includes('week')) billingCycle = 'weekly';
      else if (c.includes('quarter')) billingCycle = 'quarterly';
    }

    let status: SubscriptionStatus = 'active';
    if (statusIdx !== -1 && matches[statusIdx]) {
      const s = matches[statusIdx].toLowerCase();
      if (s.includes('pause')) status = 'paused';
      else if (s.includes('cancel')) status = 'cancelled';
    }

    const category = categoryIdx !== -1 && matches[categoryIdx] ? matches[categoryIdx] : 'Other';
    const nextBillingDate = dateIdx !== -1 && matches[dateIdx] ? matches[dateIdx] : new Date().toISOString().split('T')[0];

    parsed.push({
      id: `imported_${Date.now()}_${i}`,
      name,
      amount,
      currency: 'USD',
      billingCycle,
      nextBillingDate,
      category,
      status,
      createdAt: new Date().toISOString()
    });
  }

  return parsed;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
