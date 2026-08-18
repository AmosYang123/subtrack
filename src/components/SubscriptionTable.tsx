import React from 'react';
import { Dropdown } from 'react-bootstrap';
import {
  MoreVertical,
  Edit2,
  Trash2,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  Plus,
  Mail
} from 'lucide-react';
import { useAppStore } from '../services/store';
import {
  formatCurrency,
  getDaysUntilRenewal,
  getNormalizedMonthlyCost
} from '../utils/calculator';
import { CATEGORY_COLORS } from '../utils/catalog';
import { getSafeExternalUrl } from '../utils/security';

export const SubscriptionTable: React.FC = () => {
  const {
    subscriptions,
    paymentMethods,
    filters,
    currency,
    exchangeRates,
    openAddModal,
    openEditModal,
    deleteSubscription,
    toggleSubscriptionStatus,
    setEmailScanModalOpen
  } = useAppStore();

  // Filter
  const filtered = subscriptions.filter(sub => {
    if (filters.searchTerm) {
      const q = filters.searchTerm.toLowerCase();
      const matchName = sub.name.toLowerCase().includes(q);
      const matchNotes = (sub.notes || '').toLowerCase().includes(q);
      const matchCat = sub.category.toLowerCase().includes(q);
      if (!matchName && !matchNotes && !matchCat) return false;
    }
    if (filters.category !== 'all' && sub.category !== filters.category) return false;
    if (filters.status !== 'all' && sub.status !== filters.status) return false;
    if (filters.billingCycle !== 'all' && sub.billingCycle !== filters.billingCycle) return false;
    if (filters.paymentMethodId !== 'all' && sub.paymentMethodId !== filters.paymentMethodId) return false;
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let comp = 0;
    if (filters.sortBy === 'name') {
      comp = a.name.localeCompare(b.name);
    } else if (filters.sortBy === 'amount') {
      comp = getNormalizedMonthlyCost(a.amount, a.billingCycle, a.currency || 'USD', currency, exchangeRates) -
             getNormalizedMonthlyCost(b.amount, b.billingCycle, b.currency || 'USD', currency, exchangeRates);
    } else if (filters.sortBy === 'status') {
      comp = a.status.localeCompare(b.status);
    } else if (filters.sortBy === 'nextBilling') {
      comp = (a.nextBillingDate || '').localeCompare(b.nextBillingDate || '');
    }
    return filters.sortOrder === 'asc' ? comp : -comp;
  });

  const getPaymentMethodLabel = (pmId?: string): string => {
    const pm = paymentMethods.find(m => m.id === pmId);
    if (!pm) return '•••• 4242';
    return `${pm.brand} •••• ${pm.lastFour}`;
  };

  const formatRenewal = (days: number): { text: string; className: string } => {
    if (days < 0) return { text: 'Overdue', className: 'renewal-urgent' };
    if (days === 0) return { text: 'Today', className: 'renewal-urgent' };
    if (days === 1) return { text: 'Tomorrow', className: 'renewal-urgent' };
    if (days <= 7) return { text: `${days} days`, className: 'renewal-soon' };
    if (days <= 30) return { text: `${days} days`, className: 'renewal-normal' };
    return { text: `${days} days`, className: 'renewal-normal' };
  };

  if (sorted.length === 0) {
    return (
      <div className="empty-state">
        <h3>No subscriptions found</h3>
        <p>
          {subscriptions.length === 0
            ? 'Add your first subscription or scan a receipt / load a dataset profile to get started.'
            : 'No subscriptions match your current filters.'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button className="btn-primary-action" onClick={openAddModal}>
            <Plus size={15} /> Add subscription
          </button>
          <button className="btn-subtle" onClick={() => setEmailScanModalOpen(true)}>
            <Mail size={14} /> Scan receipt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <table className="sub-table">
        <thead>
          <tr>
            <th style={{ width: '26%' }}>Service</th>
            <th style={{ width: '14%' }}>Cost</th>
            <th style={{ width: '14%' }}>Renewal</th>
            <th style={{ width: '12%' }}>Category</th>
            <th style={{ width: '14%' }}>Payment</th>
            <th style={{ width: '10%' }}>Status</th>
            <th style={{ width: '10%', textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(sub => {
            const daysLeft = getDaysUntilRenewal(sub.nextBillingDate);
            const renewal = formatRenewal(daysLeft);
            const monthlyRate = getNormalizedMonthlyCost(sub.amount, sub.billingCycle, sub.currency || 'USD', currency, exchangeRates);
            const categoryColor = CATEGORY_COLORS[sub.category] || '#64748b';
            const safeDirectUrl = getSafeExternalUrl(sub.cancelUrl || sub.websiteUrl);

            return (
              <tr key={sub.id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{sub.name}</span>
                      {sub.isTrial && (
                        <span className="badge-tag badge-danger-subtle" style={{ fontSize: 10 }}>
                          Trial
                        </span>
                      )}
                      {sub.usageFrequency === 'dormant' && (
                        <span className="badge-tag badge-warning-subtle" style={{ fontSize: 10 }}>
                          Dormant
                        </span>
                      )}
                      {safeDirectUrl && (
                        <a href={safeDirectUrl} target="_blank" rel="noopener noreferrer"
                           style={{ color: 'var(--text-muted)' }}
                           title="1-Click Manage / Cancel Plan">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    {sub.accountEmail && (
                      <span style={{
                        fontSize: 11,
                        color: 'var(--primary)',
                        fontWeight: 500,
                        marginTop: 1
                      }}>
                        {sub.accountEmail}
                      </span>
                    )}
                    {sub.notes && (
                      <span style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        maxWidth: 240,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {sub.notes}
                      </span>
                    )}
                  </div>
                </td>

                <td>
                  <span style={{ fontWeight: 600 }}>
                    {formatCurrency(sub.amount, sub.currency || currency)}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 4 }}>
                    /{sub.billingCycle === 'monthly' ? 'mo' : sub.billingCycle === 'yearly' ? 'yr' : sub.billingCycle === 'weekly' ? 'wk' : 'qtr'}
                  </span>
                  {sub.billingCycle !== 'monthly' && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      ~{formatCurrency(monthlyRate, currency)}/mo
                    </div>
                  )}
                </td>

                <td>
                  <div style={{ fontSize: 13 }}>
                    {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric'
                    }) : '—'}
                  </div>
                  {sub.status === 'active' && (
                    <span className={renewal.className} style={{ fontSize: 12 }}>
                      {renewal.text}
                    </span>
                  )}
                </td>

                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                    <span className="cat-dot" style={{ background: categoryColor }} />
                    {sub.category}
                  </span>
                </td>

                <td>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {getPaymentMethodLabel(sub.paymentMethodId)}
                  </span>
                </td>

                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                    <span className={`status-dot status-dot-${sub.status}`} />
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </span>
                </td>

                <td style={{ textAlign: 'right' }}>
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="link"
                      className="p-1 border-0 shadow-none"
                      style={{ color: 'var(--text-muted)' }}
                      id={`dropdown-${sub.id}`}
                    >
                      <MoreVertical size={16} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => openEditModal(sub)}>
                        <Edit2 size={13} className="me-2" /> Edit
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => toggleSubscriptionStatus(sub.id)}>
                        {sub.status === 'active' ? (
                          <><PauseCircle size={13} className="me-2" /> Pause</>
                        ) : (
                          <><PlayCircle size={13} className="me-2" /> Resume</>
                        )}
                      </Dropdown.Item>
                      {safeDirectUrl && (
                        <Dropdown.Item href={safeDirectUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={13} className="me-2" />
                          <span>{sub.cancelUrl ? '1-Click Cancel / Manage' : 'Manage plan'}</span>
                        </Dropdown.Item>
                      )}
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => deleteSubscription(sub.id)} style={{ color: 'var(--danger)' }}>
                        <Trash2 size={13} className="me-2" /> Delete
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
