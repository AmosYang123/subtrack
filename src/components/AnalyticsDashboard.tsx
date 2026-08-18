import React from 'react';
import { Row, Col } from 'react-bootstrap';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { useAppStore } from '../services/store';
import {
  getNormalizedMonthlyCost,
  formatCurrency,
  calculateMetrics
} from '../utils/calculator';
import { CATEGORY_COLORS } from '../utils/catalog';
import { format, addMonths } from 'date-fns';
import { convertCurrency } from '../services/currencyApi';

export const AnalyticsDashboard: React.FC = () => {
  const { subscriptions, paymentMethods, currency, exchangeRates } = useAppStore();
  const metrics = calculateMetrics(subscriptions, currency, exchangeRates);
  const activeSubs = subscriptions.filter(s => s.status === 'active');

  // Category data
  const categoryTotals: Record<string, number> = {};
  activeSubs.forEach(sub => {
    const cost = getNormalizedMonthlyCost(sub.amount, sub.billingCycle, sub.currency || 'USD', currency, exchangeRates);
    categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + cost;
  });

  const categoryChartData = Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      color: CATEGORY_COLORS[name] || '#64748b'
    }))
    .sort((a, b) => b.value - a.value);

  // Cycle data
  const cycleTotals: Record<string, number> = { monthly: 0, yearly: 0, weekly: 0, quarterly: 0 };
  activeSubs.forEach(sub => {
    cycleTotals[sub.billingCycle] = (cycleTotals[sub.billingCycle] || 0) + getNormalizedMonthlyCost(sub.amount, sub.billingCycle, sub.currency || 'USD', currency, exchangeRates);
  });
  const cycleChartData = Object.entries(cycleTotals).map(([cycle, value]) => ({
    cycle: cycle.charAt(0).toUpperCase() + cycle.slice(1),
    monthlyShare: parseFloat(value.toFixed(2))
  }));

  // 12-month projection
  const monthlyProjectionData = [];
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const targetMonth = addMonths(today, i);
    let expectedAmount = 0;
    activeSubs.forEach(sub => {
      const convertedSubAmount = convertCurrency(sub.amount, sub.currency || 'USD', currency, exchangeRates);
      if (sub.billingCycle === 'monthly') expectedAmount += convertedSubAmount;
      else if (sub.billingCycle === 'weekly') expectedAmount += convertedSubAmount * 4.33;
      else if (sub.billingCycle === 'quarterly') { if (i % 3 === 0) expectedAmount += convertedSubAmount; }
      else if (sub.billingCycle === 'yearly') { if (i === 0) expectedAmount += convertedSubAmount; }
    });
    monthlyProjectionData.push({ month: format(targetMonth, 'MMM yyyy'), amount: parseFloat(expectedAmount.toFixed(2)) });
  }

  // Payment method data
  const paymentTotals: Record<string, number> = {};
  activeSubs.forEach(sub => {
    const pm = paymentMethods.find(m => m.id === sub.paymentMethodId);
    const label = pm ? `${pm.brand} •••• ${pm.lastFour}` : 'Other';
    paymentTotals[label] = (paymentTotals[label] || 0) + getNormalizedMonthlyCost(sub.amount, sub.billingCycle, sub.currency || 'USD', currency, exchangeRates);
  });
  const paymentChartData = Object.entries(paymentTotals).map(([name, value]) => ({
    name,
    amount: parseFloat(value.toFixed(2))
  }));

  // Tooltip styling
  const tooltipStyle = {
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    fontSize: 12,
    color: 'var(--text)'
  };

  const gridColor = 'var(--border-subtle)';
  const axisColor = 'var(--text-muted)';

  const chartGreen = '#16794a';
  const chartBlue = '#2563eb';
  const chartAmber = '#d97706';

  return (
    <div>
      {/* Summary line */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
        <span>
          <strong style={{ color: 'var(--text)', fontSize: 15 }}>{formatCurrency(metrics.totalMonthly, currency)}</strong> /month
        </span>
        <span>
          <strong style={{ color: 'var(--text)', fontSize: 15 }}>{formatCurrency(metrics.totalAnnual, currency)}</strong> /year
        </span>
        <span>
          <strong style={{ color: 'var(--text)', fontSize: 15 }}>{metrics.activeCount}</strong> active
        </span>
      </div>

      <Row className="g-3 mb-3">
        {/* Category donut */}
        <Col xs={12} lg={7}>
          <div className="chart-section" style={{ minHeight: 320 }}>
            <div className="chart-title">Spending by category</div>
            {categoryChartData.length > 0 ? (
              <Row className="align-items-center">
                <Col xs={12} md={7}>
                  <div style={{ width: '100%', height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="var(--bg)"
                          strokeWidth={2}
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          formatter={(val: any) => [formatCurrency(Number(val), currency), 'Monthly']}
                          contentStyle={tooltipStyle}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Col>
                <Col xs={12} md={5}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {categoryChartData.map(item => {
                      const pct = metrics.totalMonthly > 0 ? ((item.value / metrics.totalMonthly) * 100).toFixed(0) : 0;
                      return (
                        <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                            {item.name}
                          </span>
                          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {formatCurrency(item.value, currency)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Col>
              </Row>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No active subscriptions.</p>
            )}
          </div>
        </Col>

        {/* 12-month projection */}
        <Col xs={12} lg={5}>
          <div className="chart-section" style={{ minHeight: 320 }}>
            <div className="chart-title">12-month forecast</div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyProjectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={axisColor} tick={{ fontSize: 11 }} />
                  <YAxis stroke={axisColor} tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    formatter={(val: any) => [formatCurrency(Number(val), currency), 'Projected']}
                    contentStyle={tooltipStyle}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={chartGreen}
                    strokeWidth={2}
                    fill={chartGreen}
                    fillOpacity={0.08}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-3">
        {/* Payment method */}
        <Col xs={12} md={6}>
          <div className="chart-section">
            <div className="chart-title">By payment method</div>
            <div style={{ width: '100%', height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis type="number" stroke={axisColor} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} width={120} />
                  <ChartTooltip
                    formatter={(val: any) => [formatCurrency(Number(val), currency), 'Monthly']}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="amount" fill={chartBlue} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Col>

        {/* Billing frequency */}
        <Col xs={12} md={6}>
          <div className="chart-section">
            <div className="chart-title">By billing frequency</div>
            <div style={{ width: '100%', height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cycleChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="cycle" stroke={axisColor} tick={{ fontSize: 11 }} />
                  <YAxis stroke={axisColor} tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    formatter={(val: any) => [formatCurrency(Number(val), currency), 'Monthly equiv.']}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="monthlyShare" fill={chartAmber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};
