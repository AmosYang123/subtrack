import React from 'react';
import { Row, Col, Dropdown } from 'react-bootstrap';
import {
  MoreVertical,
  Edit2,
  Trash2,
  PauseCircle,
  PlayCircle,
  ExternalLink
} from 'lucide-react';
import { useAppStore } from '../services/store';
import {
  formatCurrency,
  getDaysUntilRenewal,
  getNormalizedMonthlyCost
} from '../utils/calculator';
import { CATEGORY_COLORS } from '../utils/catalog';

export const SubscriptionGrid: React.FC = () => {
  const {
    subscriptions,
    paymentMethods,
    filters,
    currency,
    exchangeRates,
    openEditModal,
    deleteSubscription,
    toggleSubscriptionStatus
  } = useAppStore();

  const filtered = subscriptions.filter(sub => {
    if (filters.searchTerm) {
      const q = filters.searchTerm.toLowerCase();
      if (!sub.name.toLowerCase().includes(q) && !(sub.notes || '').toLowerCase().includes(q) && !sub.category.toLowerCase().includes(q)) return false;
    }
    if (filters.category !== 'all' && sub.category !== filters.category) return false;
    if (filters.status !== 'all' && sub.status !== filters.status) return false;
    if (filters.billingCycle !== 'all' && sub.billingCycle !== filters.billingCycle) return false;
    if (filters.paymentMethodId !== 'all' && sub.paymentMethodId !== filters.paymentMethodId) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comp = 0;
    if (filters.sortBy === 'name') comp = a.name.localeCompare(b.name);
    else if (filters.sortBy === 'amount') {
      comp = getNormalizedMonthlyCost(a.amount, a.billingCycle, a.currency || 'USD', currency, exchangeRates) -
             getNormalizedMonthlyCost(b.amount, b.billingCycle, b.currency || 'USD', currency, exchangeRates);
    }
    else if (filters.sortBy === 'status') comp = a.status.localeCompare(b.status);
    else if (filters.sortBy === 'nextBilling') comp = (a.nextBillingDate || '').localeCompare(b.nextBillingDate || '');
    return filters.sortOrder === 'asc' ? comp : -comp;
  });

  const getPaymentMethodLabel = (pmId?: string): string => {
    const pm = paymentMethods.find(m => m.id === pmId);
    if (!pm) return '•••• 4242';
    return `${pm.brand} •••• ${pm.lastFour}`;
  };

  return (
    <Row className="g-3">
      {sorted.map(sub => {
        const daysLeft = getDaysUntilRenewal(sub.nextBillingDate);
        const categoryColor = CATEGORY_COLORS[sub.category] || '#64748b';
        const renewalLabel = daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`;
        const renewalClass = daysLeft <= 1 ? 'renewal-urgent' : daysLeft <= 7 ? 'renewal-soon' : 'renewal-normal';

        return (
          <Col key={sub.id} xs={12} sm={6} lg={4} xl={3}>
            <div className="sub-grid-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{sub.name}</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    <span className="cat-dot" style={{ background: categoryColor }} />
                    {sub.category}
                  </span>
                </div>
                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" className="p-0 border-0 shadow-none" style={{ color: 'var(--text-muted)' }}>
                    <MoreVertical size={16} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => openEditModal(sub)}>
                      <Edit2 size={13} className="me-2" /> Edit
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => toggleSubscriptionStatus(sub.id)}>
                      {sub.status === 'active'
                        ? <><PauseCircle size={13} className="me-2" /> Pause</>
                        : <><PlayCircle size={13} className="me-2" /> Resume</>
                      }
                    </Dropdown.Item>
                    {sub.websiteUrl && (
                      <Dropdown.Item href={sub.websiteUrl} target="_blank">
                        <ExternalLink size={13} className="me-2" /> Manage plan
                      </Dropdown.Item>
                    )}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => deleteSubscription(sub.id)} style={{ color: 'var(--danger)' }}>
                      <Trash2 size={13} className="me-2" /> Delete
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 12, flex: 1 }}>
                <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  {formatCurrency(sub.amount, sub.currency || currency)}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 4 }}>
                  /{sub.billingCycle === 'monthly' ? 'mo' : sub.billingCycle === 'yearly' ? 'yr' : sub.billingCycle === 'weekly' ? 'wk' : 'qtr'}
                </span>
                {sub.notes && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sub.notes}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                  </span>
                  {sub.status === 'active' && (
                    <span className={renewalClass} style={{ marginLeft: 6 }}>{renewalLabel}</span>
                  )}
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span className={`status-dot status-dot-${sub.status}`} />
                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </span>
              </div>
            </div>
          </Col>
        );
      })}
    </Row>
  );
};
