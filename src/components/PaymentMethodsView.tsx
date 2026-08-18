import React, { useState } from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import {
  CreditCard,
  Plus,
  Trash2,
  Check,
  Star,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { formatCurrency, getNormalizedMonthlyCost } from '../utils/calculator';
import { CATEGORY_COLORS } from '../utils/catalog';

export const PaymentMethodsView: React.FC = () => {
  const {
    paymentMethods,
    subscriptions,
    currency,
    exchangeRates,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    openEditModal,
    setActiveTab
  } = useAppStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    brand: 'Visa',
    lastFour: '',
    name: '',
    expiryMonth: 12,
    expiryYear: 2027,
    isDefault: false
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.lastFour) return;

    addPaymentMethod(formData);
    setFormData({
      brand: 'Visa',
      lastFour: '',
      name: '',
      expiryMonth: 12,
      expiryYear: 2027,
      isDefault: false
    });
    setShowAddForm(false);
  };

  const getSpendingForCard = (pmId: string): number => {
    return subscriptions
      .filter(s => s.paymentMethodId === pmId && s.status === 'active')
      .reduce((sum, s) => sum + getNormalizedMonthlyCost(s.amount, s.billingCycle, s.currency || 'USD', currency, exchangeRates), 0);
  };

  const totalCardSpend = paymentMethods.reduce((acc, pm) => acc + getSpendingForCard(pm.id), 0);
  const activeCard = selectedCardId
    ? paymentMethods.find(p => p.id === selectedCardId) || paymentMethods[0]
    : paymentMethods[0];

  const linkedSubscriptions = activeCard
    ? subscriptions.filter(s => s.paymentMethodId === activeCard.id)
    : [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.01em' }}>Payment Methods & Cards</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Manage payment cards and view spending distribution across subscriptions.
          </p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={14} />
            <span>Add payment method</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={4}>
          <div className="metric-card">
            <div className="metric-label">Active payment methods</div>
            <div className="metric-value">{paymentMethods.length}</div>
            <div className="metric-subtext">Cards & accounts on file</div>
          </div>
        </Col>
        <Col xs={12} sm={4}>
          <div className="metric-card">
            <div className="metric-label">Total monthly via cards</div>
            <div className="metric-value">{formatCurrency(totalCardSpend, currency)}</div>
            <div className="metric-subtext">Converted to {currency}</div>
          </div>
        </Col>
        <Col xs={12} sm={4}>
          <div className="metric-card">
            <div className="metric-label">Linked active subs</div>
            <div className="metric-value">
              {subscriptions.filter(s => s.status === 'active' && s.paymentMethodId).length}
            </div>
            <div className="metric-subtext">Across all cards</div>
          </div>
        </Col>
      </Row>

      {/* Add Form */}
      {showAddForm && (
        <div className="section-panel" style={{ padding: 18, marginBottom: 20 }}>
          <div style={{ fontWeight: 650, fontSize: 14, marginBottom: 14 }}>Add new payment method</div>
          <Form onSubmit={handleAddSubmit}>
            <Row className="g-3">
              <Col xs={12} sm={6}>
                <Form.Group>
                  <Form.Label>Description / Nickname</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Chase Sapphire Reserve"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus
                  />
                </Form.Group>
              </Col>

              <Col xs={6} sm={3}>
                <Form.Group>
                  <Form.Label>Brand</Form.Label>
                  <Form.Select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Amex">American Express</option>
                    <option value="Apple Pay">Apple Pay</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Bank">Bank Account</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col xs={6} sm={3}>
                <Form.Group>
                  <Form.Label>Last 4 digits</Form.Label>
                  <Form.Control
                    type="text"
                    maxLength={4}
                    placeholder="4242"
                    value={formData.lastFour}
                    onChange={(e) => setFormData({ ...formData, lastFour: e.target.value.replace(/[^0-9]/g, '') })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top border-border">
              <button
                type="button"
                className="btn-subtle"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary-action">
                <Check size={14} /> Save payment method
              </button>
            </div>
          </Form>
        </div>
      )}

      {/* Main Grid: Card list on left, Linked subscriptions on right */}
      <Row className="g-3">
        <Col xs={12} lg={6}>
          <div className="section-panel" style={{ padding: 16 }}>
            <div className="section-heading" style={{ marginBottom: 12 }}>Saved cards & accounts</div>
            <div className="d-flex flex-column gap-2">
              {paymentMethods.map(pm => {
                const monthlySpent = getSpendingForCard(pm.id);
                const subCount = subscriptions.filter(s => s.paymentMethodId === pm.id && s.status === 'active').length;
                const isSelected = activeCard?.id === pm.id;

                return (
                  <div
                    key={pm.id}
                    onClick={() => setSelectedCardId(pm.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 'var(--radius)',
                      border: isSelected ? '1px solid var(--primary-border)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--primary-bg)' : 'var(--bg)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <CreditCard
                        size={20}
                        style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }}
                      />
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>
                            {pm.name}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                            ({pm.brand} •••• {pm.lastFour})
                          </span>
                          {pm.isDefault && (
                            <span className="badge-tag badge-success-subtle">Default</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {subCount} active subscription{subCount === 1 ? '' : 's'} linked
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3" onClick={e => e.stopPropagation()}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>
                          {formatCurrency(monthlySpent, currency)}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>/ month</div>
                      </div>

                      <div className="d-flex gap-1">
                        {!pm.isDefault && (
                          <button
                            type="button"
                            className="btn-ghost"
                            style={{ fontSize: 12, padding: '4px 8px', height: 'auto' }}
                            onClick={() => setDefaultPaymentMethod(pm.id)}
                            title="Set as default card"
                          >
                            <Star size={13} />
                            <span>Default</span>
                          </button>
                        )}
                        {paymentMethods.length > 1 && (
                          <button
                            type="button"
                            className="btn-danger-ghost"
                            style={{ padding: '4px 8px', height: 'auto' }}
                            onClick={() => {
                              deletePaymentMethod(pm.id);
                              if (selectedCardId === pm.id) setSelectedCardId(null);
                            }}
                            title="Delete card"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Col>

        {/* Linked Subscriptions Panel */}
        <Col xs={12} lg={6}>
          <div className="section-panel" style={{ padding: 16 }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="section-heading" style={{ margin: 0 }}>
                {activeCard ? `Subscriptions on ${activeCard.name}` : 'Linked subscriptions'}
              </div>
              <button
                className="btn-ghost d-flex align-items-center gap-1"
                style={{ fontSize: 12 }}
                onClick={() => setActiveTab('subscriptions')}
              >
                <span>View all</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {linkedSubscriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <Layers size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 500 }}>No subscriptions linked to this card</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Select or edit subscriptions to assign them to {activeCard?.name || 'this payment method'}.
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {linkedSubscriptions.map(sub => {
                  const catColor = CATEGORY_COLORS[sub.category] || '#64748b';
                  const monthlyConverted = getNormalizedMonthlyCost(
                    sub.amount,
                    sub.billingCycle,
                    sub.currency || 'USD',
                    currency,
                    exchangeRates
                  );

                  return (
                    <div
                      key={sub.id}
                      className="timeline-item"
                      style={{ padding: '10px 12px', cursor: 'pointer' }}
                      onClick={() => openEditModal(sub)}
                    >
                      <div className="d-flex align-items-center gap-2.5">
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: catColor,
                            flexShrink: 0
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{sub.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {sub.category} · {sub.billingCycle} · {sub.status}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {formatCurrency(sub.amount, sub.currency || 'USD')}
                        </div>
                        {sub.currency && sub.currency !== currency && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            ≈ {formatCurrency(monthlyConverted, currency)}/mo
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};
