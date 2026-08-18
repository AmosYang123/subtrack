import { Subscription, BillingCycle, SpendingMetrics } from '../types';
import { differenceInCalendarDays, parseISO, addWeeks, addMonths, addYears, format } from 'date-fns';
import { convertCurrency, FALLBACK_RATES } from '../services/currencyApi';

export function getNormalizedMonthlyCost(
  amount: number,
  cycle: BillingCycle,
  fromCurrency: string = 'USD',
  toCurrency: string = 'USD',
  rates: Record<string, number> = FALLBACK_RATES
): number {
  let baseAmount = amount;
  switch (cycle) {
    case 'weekly':
      baseAmount = amount * (52 / 12);
      break;
    case 'monthly':
      baseAmount = amount;
      break;
    case 'quarterly':
      baseAmount = amount / 3;
      break;
    case 'yearly':
      baseAmount = amount / 12;
      break;
    default:
      baseAmount = amount;
  }

  if (fromCurrency !== toCurrency) {
    return convertCurrency(baseAmount, fromCurrency, toCurrency, rates);
  }
  return baseAmount;
}

export function getNormalizedAnnualCost(
  amount: number,
  cycle: BillingCycle,
  fromCurrency: string = 'USD',
  toCurrency: string = 'USD',
  rates: Record<string, number> = FALLBACK_RATES
): number {
  let baseAmount = amount;
  switch (cycle) {
    case 'weekly':
      baseAmount = amount * 52;
      break;
    case 'monthly':
      baseAmount = amount * 12;
      break;
    case 'quarterly':
      baseAmount = amount * 4;
      break;
    case 'yearly':
      baseAmount = amount;
      break;
    default:
      baseAmount = amount * 12;
  }

  if (fromCurrency !== toCurrency) {
    return convertCurrency(baseAmount, fromCurrency, toCurrency, rates);
  }
  return baseAmount;
}

export function getDaysUntilRenewal(nextBillingDate: string): number {
  try {
    if (!nextBillingDate) return 0;
    const target = parseISO(nextBillingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return differenceInCalendarDays(target, today);
  } catch {
    return 0;
  }
}

export function getNextRenewalDate(currentDateStr: string, cycle: BillingCycle): string {
  try {
    const base = currentDateStr ? parseISO(currentDateStr) : new Date();
    let nextDate: Date;
    switch (cycle) {
      case 'weekly':
        nextDate = addWeeks(base, 1);
        break;
      case 'monthly':
        nextDate = addMonths(base, 1);
        break;
      case 'quarterly':
        nextDate = addMonths(base, 3);
        break;
      case 'yearly':
        nextDate = addYears(base, 1);
        break;
      default:
        nextDate = addMonths(base, 1);
    }
    return format(nextDate, 'yyyy-MM-dd');
  } catch {
    return format(addMonths(new Date(), 1), 'yyyy-MM-dd');
  }
}

export function calculateMetrics(
  subscriptions: Subscription[],
  targetCurrency: string = 'USD',
  rates: Record<string, number> = FALLBACK_RATES
): SpendingMetrics {
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const pausedCount = subscriptions.filter(s => s.status === 'paused').length;
  const cancelledCount = subscriptions.filter(s => s.status === 'cancelled').length;

  let totalMonthly = 0;
  let totalAnnual = 0;
  let renewingIn7DaysCount = 0;
  let renewingIn7DaysAmount = 0;
  let highestExpenseSub: Subscription | undefined;
  let maxMonthlyAmount = 0;

  activeSubs.forEach(sub => {
    const subCurrency = sub.currency || 'USD';
    const monthlyCost = getNormalizedMonthlyCost(sub.amount, sub.billingCycle, subCurrency, targetCurrency, rates);
    const annualCost = getNormalizedAnnualCost(sub.amount, sub.billingCycle, subCurrency, targetCurrency, rates);

    totalMonthly += monthlyCost;
    totalAnnual += annualCost;

    if (monthlyCost > maxMonthlyAmount) {
      maxMonthlyAmount = monthlyCost;
      highestExpenseSub = sub;
    }

    const daysLeft = getDaysUntilRenewal(sub.nextBillingDate);
    if (daysLeft >= 0 && daysLeft <= 7) {
      renewingIn7DaysCount += 1;
      const convertedSubAmount = convertCurrency(sub.amount, subCurrency, targetCurrency, rates);
      renewingIn7DaysAmount += convertedSubAmount;
    }
  });

  const averageMonthly = activeSubs.length > 0 ? totalMonthly / activeSubs.length : 0;

  return {
    totalMonthly,
    totalAnnual,
    activeCount: activeSubs.length,
    pausedCount,
    cancelledCount,
    renewingIn7DaysCount,
    renewingIn7DaysAmount,
    highestExpenseSub,
    averageMonthly
  };
}

export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'AU$',
    JPY: '¥',
    INR: '₹',
    SGD: 'S$',
    CHF: 'CHF ',
    NZD: 'NZ$',
    SEK: 'kr ',
    BRL: 'R$ '
  };

  const symbol = symbolMap[currencyCode] || '$';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getRenewalUrgencyColor(daysLeft: number): { badge: string; text: string; label: string } {
  if (daysLeft < 0) {
    return { badge: 'bg-danger-subtle text-danger border border-danger-subtle', text: 'text-danger', label: 'Overdue' };
  }
  if (daysLeft === 0) {
    return { badge: 'bg-danger text-white', text: 'text-danger fw-bold', label: 'Due today' };
  }
  if (daysLeft === 1) {
    return { badge: 'bg-warning text-dark fw-semibold', text: 'text-warning', label: 'Due tomorrow' };
  }
  if (daysLeft <= 3) {
    return { badge: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle', text: 'text-warning-emphasis', label: `In ${daysLeft} days` };
  }
  if (daysLeft <= 7) {
    return { badge: 'bg-info-subtle text-info-emphasis border border-info-subtle', text: 'text-info-emphasis', label: `In ${daysLeft} days` };
  }
  return { badge: 'bg-secondary-subtle text-secondary-emphasis', text: 'text-muted', label: `In ${daysLeft} days` };
}
