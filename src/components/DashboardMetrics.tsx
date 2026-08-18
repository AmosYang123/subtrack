import React from 'react';
import { useAppStore } from '../services/store';
import { calculateMetrics, formatCurrency } from '../utils/calculator';

export const DashboardMetrics: React.FC = () => {
  const { subscriptions, currency, exchangeRates } = useAppStore();
  const m = calculateMetrics(subscriptions, currency, exchangeRates);

  return (
    <div className="metrics-row">
      <div className="metric-item">
        <div className="metric-label">Monthly</div>
        <div className="metric-value">{formatCurrency(m.totalMonthly, currency)}</div>
        <div className="metric-detail">{m.activeCount} active</div>
      </div>
      <div className="metric-item">
        <div className="metric-label">Annual</div>
        <div className="metric-value">{formatCurrency(m.totalAnnual, currency)}</div>
        <div className="metric-detail">avg {formatCurrency(m.averageMonthly, currency)}/mo each</div>
      </div>
      <div className="metric-item">
        <div className="metric-label">Due this week</div>
        <div className="metric-value">{m.renewingIn7DaysCount}</div>
        <div className="metric-detail">{formatCurrency(m.renewingIn7DaysAmount, currency)} total</div>
      </div>
      <div className="metric-item">
        <div className="metric-label">Largest</div>
        <div className="metric-value" style={{ fontSize: m.highestExpenseSub && m.highestExpenseSub.name.length > 12 ? '16px' : undefined }}>
          {m.highestExpenseSub ? m.highestExpenseSub.name : '—'}
        </div>
        <div className="metric-detail">
          {m.highestExpenseSub
            ? `${formatCurrency(m.highestExpenseSub.amount, m.highestExpenseSub.currency || currency)}/${m.highestExpenseSub.billingCycle}`
            : 'No active subscriptions'}
        </div>
      </div>
    </div>
  );
};
