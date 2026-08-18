import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAppStore } from '../services/store';
import { getDaysUntilRenewal, formatCurrency } from '../utils/calculator';
import { convertCurrency } from '../services/currencyApi';

export const UpcomingAlertBanner: React.FC = () => {
  const { subscriptions, currency, exchangeRates } = useAppStore();
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  const urgent = subscriptions.filter(sub => {
    if (sub.status !== 'active') return false;
    const days = getDaysUntilRenewal(sub.nextBillingDate);
    return days >= 0 && days <= 3;
  });

  if (urgent.length === 0) return null;

  const total = urgent.reduce((sum, s) => {
    const converted = convertCurrency(s.amount, s.currency || 'USD', currency, exchangeRates);
    return sum + converted;
  }, 0);

  const names = urgent.map(s => {
    const d = getDaysUntilRenewal(s.nextBillingDate);
    return `${s.name} (${d === 0 ? 'today' : d === 1 ? 'tomorrow' : `${d} days`})`;
  });

  return (
    <div className="alert-banner">
      <div className="alert-banner-text">
        <AlertTriangle size={15} style={{ color: 'var(--warning)', flexShrink: 0 }} />
        <span>
          <span className="alert-banner-label">{formatCurrency(total, currency)} due soon</span>
          {' — '}
          <span style={{ color: 'var(--text-secondary)' }}>{names.join(', ')}</span>
        </span>
      </div>
      <button className="btn-ghost" onClick={() => setDismissed(true)} style={{ padding: '4px' }}>
        <X size={14} />
      </button>
    </div>
  );
};
