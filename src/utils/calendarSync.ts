import { Subscription } from '../types';
import { format, parseISO, addDays, addMonths, addYears } from 'date-fns';

export interface CalendarExportOptions {
  reminderDays?: number; // e.g. 3 days before
  includeAmounts?: boolean;
  includeCancelLinks?: boolean;
  activeOnly?: boolean;
}

/**
 * Formats a Date object to iCalendar UTC timestamp string: YYYYMMDDTHHMMSSZ
 */
function toICalDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
}

/**
 * Formats a date string (YYYY-MM-DD) to iCalendar DATE value: YYYYMMDD
 */
function toICalDateOnly(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

function escapeICalText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generates an RFC 5545 compliant .ics calendar string containing recurring subscription renewal events
 */
export function generateICalendarFeed(
  subscriptions: Subscription[],
  options: CalendarExportOptions = {}
): string {
  const {
    reminderDays = 3,
    includeAmounts = true,
    includeCancelLinks = true,
    activeOnly = true
  } = options;

  const filtered = subscriptions.filter(s => !activeOnly || s.status === 'active');
  const now = new Date();
  const nowStamp = toICalDate(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Subtrax//Private Subscription Manager//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Subtrax Subscriptions',
    'X-WR-CALDESC:Automatic subscription renewals and payment reminders'
  ];

  filtered.forEach(sub => {
    if (!sub.nextBillingDate) return;

    const startDate = toICalDateOnly(sub.nextBillingDate);
    const uid = `subtrax_${sub.id}_${startDate}@subtrax.app`;
    const cleanName = escapeICalText(sub.name);
    const summary = includeAmounts
      ? `[Subtrax] ${cleanName} Renewal (${escapeICalText(sub.currency || 'USD')} ${sub.amount})`
      : `[Subtrax] ${cleanName} Renewal`;

    let description = `Subscription: ${cleanName}\\nAmount: ${escapeICalText(sub.currency || 'USD')} ${sub.amount} / ${sub.billingCycle}\\nCategory: ${escapeICalText(sub.category)}`;
    if (sub.accountEmail) {
      description += `\\nAccount: ${escapeICalText(sub.accountEmail)}`;
    }
    if (includeCancelLinks && (sub.cancelUrl || sub.websiteUrl)) {
      description += `\\nManage / Cancel: ${escapeICalText(sub.cancelUrl || sub.websiteUrl)}`;
    }
    if (sub.notes) {
      description += `\\nNotes: ${escapeICalText(sub.notes)}`;
    }

    // Determine RRULE recurrence
    let rrule = '';
    if (sub.billingCycle === 'monthly') {
      rrule = 'RRULE:FREQ=MONTHLY';
    } else if (sub.billingCycle === 'yearly') {
      rrule = 'RRULE:FREQ=YEARLY';
    } else if (sub.billingCycle === 'weekly') {
      rrule = 'RRULE:FREQ=WEEKLY';
    } else if (sub.billingCycle === 'quarterly') {
      rrule = 'RRULE:FREQ=MONTHLY;INTERVAL=3';
    }

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `CATEGORIES:${escapeICalText(sub.category)}`
    );

    if (rrule) {
      lines.push(rrule);
    }

    const targetUrl = sub.cancelUrl || sub.websiteUrl;
    if (targetUrl) {
      lines.push(`URL:${targetUrl.replace(/[\r\n]/g, '')}`);
    }

    // Add reminder alarm
    if (reminderDays > 0) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:Upcoming renewal for ${cleanName}`,
        `TRIGGER:-P${reminderDays}D`,
        'END:VALARM'
      );
    }

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers a browser download for the .ics file
 */
export function downloadICalendarFile(
  subscriptions: Subscription[],
  filename = 'subtrax_renewals.ics',
  options?: CalendarExportOptions
): void {
  const content = generateICalendarFeed(subscriptions, options);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Generates a direct Web Intent URL to add a renewal event to Google Calendar
 */
export function getGoogleCalendarAddUrl(sub: Subscription): string {
  const nextDateStr = sub.nextBillingDate || format(new Date(), 'yyyy-MM-dd');
  const startDate = nextDateStr.replace(/-/g, '');
  let nextDay: Date;
  try {
    nextDay = addDays(parseISO(nextDateStr), 1);
  } catch {
    nextDay = addDays(new Date(), 1);
  }
  const endDate = format(nextDay, 'yyyyMMdd');

  const title = encodeURIComponent(`[Subtrax] ${sub.name} Renewal (${sub.currency || 'USD'} ${sub.amount})`);
  
  let details = `Subscription: ${sub.name}\nAmount: ${sub.currency || 'USD'} ${sub.amount}/${sub.billingCycle}\nCategory: ${sub.category}`;
  if (sub.accountEmail) details += `\nAccount: ${sub.accountEmail}`;
  if (sub.cancelUrl || sub.websiteUrl) details += `\nCancel / Manage: ${sub.cancelUrl || sub.websiteUrl}`;
  
  const encodedDetails = encodeURIComponent(details);
  const recurrence = sub.billingCycle === 'monthly' ? 'RRULE:FREQ=MONTHLY' : sub.billingCycle === 'yearly' ? 'RRULE:FREQ=YEARLY' : '';
  const encodedRecur = recurrence ? `&recur=${encodeURIComponent(recurrence)}` : '';

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${encodedDetails}${encodedRecur}`;
}

/**
 * Generates a direct Web Intent URL to add a renewal event to Outlook Calendar (web)
 */
export function getOutlookCalendarAddUrl(sub: Subscription): string {
  const nextDateStr = sub.nextBillingDate || format(new Date(), 'yyyy-MM-dd');
  const subject = encodeURIComponent(`[Subtrax] ${sub.name} Renewal (${sub.currency || 'USD'} ${sub.amount})`);
  const body = encodeURIComponent(`Subscription: ${sub.name}\nAmount: ${sub.currency || 'USD'} ${sub.amount}\nManage: ${sub.cancelUrl || sub.websiteUrl || ''}`);

  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${subject}&body=${body}&startdt=${nextDateStr}&allday=true`;
}
