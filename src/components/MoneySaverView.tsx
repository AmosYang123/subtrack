import React, { useState } from 'react';
import { Row, Col, Card, Alert } from 'react-bootstrap';
import {
  Sparkles,
  TrendingDown,
  Clock,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Zap,
  Check
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { Subscription } from '../types';
import { formatCurrency, getNormalizedMonthlyCost } from '../utils/calculator';
import { differenceInDays, parseISO, format } from 'date-fns';

export const MoneySaverView: React.FC = () => {
  const {
    subscriptions,
    currency,
    exchangeRates,
    updateSubscription,
    openEditModal
  } = useAppStore();

  const [appliedUpgrades, setAppliedUpgrades] = useState<Record<string, boolean>>({});

  // 1. Annual Savings Calculation
  // Standard annual savings across industry is ~16.7% (2 months free) or custom catalog annualPrice
  const monthlySubs = subscriptions.filter(s => s.status === 'active' && s.billingCycle === 'monthly');
  
  const annualSavingsOpportunities = monthlySubs.map(sub => {
    const monthlyCost = getNormalizedMonthlyCost(sub.amount, 'monthly', sub.currency || 'USD', currency, exchangeRates);
    const annualIfMonthly = monthlyCost * 12;
    
    // If specific annual price set, use that, otherwise default to 2 months free (10x monthly price)
    const annualDiscounted = sub.annualPrice
      ? getNormalizedMonthlyCost(sub.annualPrice, 'yearly', sub.currency || 'USD', currency, exchangeRates) * 12
      : monthlyCost * 10;
    
    const potentialSaving = Math.max(0, annualIfMonthly - annualDiscounted);
    return {
      sub,
      monthlyCost,
      annualIfMonthly,
      annualDiscounted,
      potentialSaving
    };
  }).filter(item => item.potentialSaving > 5);

  const totalPotentialAnnualSavings = annualSavingsOpportunities.reduce((acc, curr) => acc + curr.potentialSaving, 0);

  // 2. Dormant Services Detector
  const now = new Date();
  const dormantServices = subscriptions.filter(s => {
    if (s.status !== 'active') return false;
    if (s.usageFrequency === 'dormant') return true;
    if (s.lastUsedDate) {
      const days = differenceInDays(now, parseISO(s.lastUsedDate));
      return days >= 30;
    }
    return false;
  }).map(sub => {
    const daysSinceUsed = sub.lastUsedDate ? differenceInDays(now, parseISO(sub.lastUsedDate)) : 45;
    const monthlyCost = getNormalizedMonthlyCost(sub.amount, sub.billingCycle, sub.currency || 'USD', currency, exchangeRates);
    const wastedSpend = monthlyCost * (daysSinceUsed / 30);
    return {
      sub,
      daysSinceUsed,
      monthlyCost,
      wastedSpend
    };
  });

  const totalMonthlyDormantWaste = dormantServices.reduce((acc, curr) => acc + curr.monthlyCost, 0);

  // 3. Free Trial Expirations
  const trialSubs = subscriptions.filter(s => s.status === 'active' && s.isTrial).map(sub => {
    const targetDate = sub.trialEndDate ? parseISO(sub.trialEndDate) : parseISO(sub.nextBillingDate);
    const daysRemaining = differenceInDays(targetDate, now);
    return {
      sub,
      daysRemaining,
      targetDate
    };
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);

  const handleApplyAnnualSwitch = (sub: Subscription, annualCost: number) => {
    updateSubscription(sub.id, {
      billingCycle: 'yearly',
      amount: sub.annualPrice || sub.amount * 10,
      notes: sub.notes ? `${sub.notes} (Optimized to Annual)` : 'Switched to Annual tier'
    });
    setAppliedUpgrades(prev => ({ ...prev, [sub.id]: true }));
  };

  const handleMarkUsedToday = (sub: Subscription) => {
    updateSubscription(sub.id, {
      lastUsedDate: format(new Date(), 'yyyy-MM-dd'),
      usageFrequency: 'daily'
    });
  };

  return (
    <div className="optimizer-view">
      {/* Top Headline & KPI Cards */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 750, letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} style={{ color: 'var(--primary)' }} />
            <span>Money Saver & Subscription Health</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0 0' }}>
            Autonomous optimizations, annual discount calculators, and dormant service alerts.
          </p>
        </div>
      </div>

      <Row className="g-3 mb-4">
        {/* KPI 1: Annual Savings */}
        <Col xs={12} md={4}>
          <div className="section-panel" style={{ padding: '16px 18px', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span style={{ fontSize: 12, fontWeight: 650, color: 'var(--primary-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Annual Plan Savings
              </span>
              <TrendingDown size={16} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary-text)', letterSpacing: '-0.03em' }}>
              {formatCurrency(totalPotentialAnnualSavings, currency)}
              <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 4 }}>/ year</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Across {annualSavingsOpportunities.length} monthly subscriptions
            </div>
          </div>
        </Col>

        {/* KPI 2: Dormant Service Waste */}
        <Col xs={12} md={4}>
          <div className="section-panel" style={{ padding: '16px 18px', background: dormantServices.length > 0 ? 'var(--warning-bg)' : 'var(--bg-subtle)', border: `1px solid ${dormantServices.length > 0 ? 'var(--warning-border)' : 'var(--border)'}` }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span style={{ fontSize: 12, fontWeight: 650, color: dormantServices.length > 0 ? 'var(--warning-text)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Dormant / Unused Spend
              </span>
              <Clock size={16} style={{ color: dormantServices.length > 0 ? 'var(--warning)' : 'var(--text-muted)' }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: dormantServices.length > 0 ? 'var(--warning-text)' : 'var(--text)', letterSpacing: '-0.03em' }}>
              {formatCurrency(totalMonthlyDormantWaste, currency)}
              <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 4 }}>/ mo</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              {dormantServices.length} service{dormantServices.length === 1 ? '' : 's'} inactive for 30+ days
            </div>
          </div>
        </Col>

        {/* KPI 3: Trial Expirations */}
        <Col xs={12} md={4}>
          <div className="section-panel" style={{ padding: '16px 18px', background: trialSubs.length > 0 ? 'var(--danger-bg)' : 'var(--bg-subtle)', border: `1px solid ${trialSubs.length > 0 ? 'var(--danger-border)' : 'var(--border)'}` }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span style={{ fontSize: 12, fontWeight: 650, color: trialSubs.length > 0 ? 'var(--danger-text)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Free Trials
              </span>
              <AlertTriangle size={16} style={{ color: trialSubs.length > 0 ? 'var(--danger)' : 'var(--text-muted)' }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: trialSubs.length > 0 ? 'var(--danger-text)' : 'var(--text)', letterSpacing: '-0.03em' }}>
              {trialSubs.length}
              <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 4 }}>monitored trials</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              {trialSubs.filter(t => t.daysRemaining <= 3).length} expiring in ≤ 3 days
            </div>
          </div>
        </Col>
      </Row>

      {/* Section 1: Annual vs. Monthly Savings Optimizer */}
      <div className="section-panel mb-4" style={{ padding: '20px 22px' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
              Annual Billing Discounts (Save ~15-25%)
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Services that offer a discounted annual tier. Switching saves 1 to 2 months of subscription costs each year.
            </p>
          </div>
        </div>

        {annualSavingsOpportunities.length === 0 ? (
          <div className="p-3 text-center" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <CheckCircle2 size={24} style={{ color: 'var(--primary)', marginBottom: 6 }} />
            <div style={{ fontWeight: 600, fontSize: 13 }}>All subscriptions are fully optimized!</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No monthly services with untapped annual discounts found.</div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2.5">
            {annualSavingsOpportunities.map(({ sub, monthlyCost, annualIfMonthly, annualDiscounted, potentialSaving }) => (
              <div
                key={sub.id}
                className="d-flex flex-column flex-md-row justify-content-between align-items-md-center p-3"
                style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', gap: 12 }}
              >
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ fontWeight: 650, fontSize: 14 }}>{sub.name}</span>
                    <span className="badge-tag badge-info-subtle">{sub.category}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Current: {formatCurrency(sub.amount, sub.currency || currency)}/mo ({formatCurrency(annualIfMonthly, currency)}/yr) · 
                    <span style={{ color: 'var(--primary)', fontWeight: 600, marginLeft: 4 }}>
                      Annual Plan: ~{formatCurrency(annualDiscounted, currency)}/yr
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="text-end">
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                      Save {formatCurrency(potentialSaving, currency)}/yr
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>~17% discount</div>
                  </div>

                  {sub.cancelUrl && (
                    <a
                      href={sub.cancelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost d-flex align-items-center gap-1"
                      style={{ fontSize: 12 }}
                      title="Open account billing to switch to annual"
                    >
                      <ExternalLink size={13} />
                      <span>Switch on {sub.name}</span>
                    </a>
                  )}

                  <button
                    type="button"
                    className="btn-primary-action"
                    style={{ fontSize: 12, padding: '5px 12px' }}
                    onClick={() => handleApplyAnnualSwitch(sub, annualDiscounted)}
                    disabled={appliedUpgrades[sub.id]}
                  >
                    {appliedUpgrades[sub.id] ? (
                      <>
                        <Check size={13} />
                        <span>Updated</span>
                      </>
                    ) : (
                      <>
                        <Zap size={13} />
                        <span>Track as Annual</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Dormant Service Detector & Waste Minimizer */}
      <div className="section-panel mb-4" style={{ padding: '20px 22px' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} style={{ color: 'var(--warning)' }} />
              <span>Dormant Service Detector (Zero Waste Tracker)</span>
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Identifies subscriptions you haven't used in 30+ days. Pause or cancel with 1-click deep links.
            </p>
          </div>
        </div>

        {dormantServices.length === 0 ? (
          <div className="p-3 text-center" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <CheckCircle2 size={24} style={{ color: 'var(--primary)', marginBottom: 6 }} />
            <div style={{ fontWeight: 600, fontSize: 13 }}>No dormant subscriptions!</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>All tracked subscriptions have been actively used within the last 30 days.</div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2.5">
            {dormantServices.map(({ sub, daysSinceUsed, monthlyCost, wastedSpend }) => (
              <div
                key={sub.id}
                className="d-flex flex-column flex-md-row justify-content-between align-items-md-center p-3"
                style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', gap: 12 }}
              >
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ fontWeight: 650, fontSize: 14 }}>{sub.name}</span>
                    <span className="badge-tag badge-warning-subtle">
                      Inactive for {daysSinceUsed} days
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Cost: {formatCurrency(sub.amount, sub.currency || currency)}/{sub.billingCycle} · 
                    <span style={{ color: 'var(--warning-text)', fontWeight: 600, marginLeft: 4 }}>
                      ~{formatCurrency(wastedSpend, currency)} spent during inactivity
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn-subtle"
                    style={{ fontSize: 12, padding: '5px 10px' }}
                    onClick={() => handleMarkUsedToday(sub)}
                    title="Reset inactivity timer"
                  >
                    <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                    <span>Used today</span>
                  </button>

                  {sub.cancelUrl ? (
                    <a
                      href={sub.cancelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-danger-ghost d-flex align-items-center gap-1"
                      style={{ fontSize: 12, padding: '5px 10px' }}
                    >
                      <ExternalLink size={13} />
                      <span>1-Click Cancel / Pause</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="btn-subtle"
                      style={{ fontSize: 12 }}
                      onClick={() => openEditModal(sub)}
                    >
                      Manage Plan
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Active Free Trials & Countdown */}
      {trialSubs.length > 0 && (
        <div className="section-panel" style={{ padding: '20px 22px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldAlert size={16} style={{ color: 'var(--danger)' }} />
                <span>Active Free Trials (Auto-Charge Alerts)</span>
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Cancel before the trial deadline to avoid unwanted renewal charges.
              </p>
            </div>
          </div>

          <div className="d-flex flex-column gap-2.5">
            {trialSubs.map(({ sub, daysRemaining, targetDate }) => (
              <div
                key={sub.id}
                className="d-flex flex-column flex-md-row justify-content-between align-items-md-center p-3"
                style={{
                  background: daysRemaining <= 3 ? 'var(--danger-bg)' : 'var(--bg)',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${daysRemaining <= 3 ? 'var(--danger-border)' : 'var(--border)'}`,
                  gap: 12
                }}
              >
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ fontWeight: 650, fontSize: 14 }}>{sub.name}</span>
                    <span className={`badge-tag ${daysRemaining <= 3 ? 'badge-danger-subtle' : 'badge-warning-subtle'}`}>
                      {daysRemaining <= 0 ? 'Expires today' : `${daysRemaining} days left in trial`}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Will bill {formatCurrency(sub.amount, sub.currency || currency)} on {format(targetDate, 'MMMM d, yyyy')}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  {sub.cancelUrl && (
                    <a
                      href={sub.cancelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-danger-ghost d-flex align-items-center gap-1"
                      style={{ fontSize: 12 }}
                    >
                      <ExternalLink size={13} />
                      <span>1-Click Cancel Trial</span>
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn-subtle"
                    style={{ fontSize: 12 }}
                    onClick={() => updateSubscription(sub.id, { isTrial: false })}
                  >
                    Keep as Paid Sub
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
