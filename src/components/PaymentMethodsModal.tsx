import React, { useState } from 'react';
import { Modal, Form, Row, Col } from 'react-bootstrap';
import {
  CreditCard,
  Plus,
  Trash2,
  Check,
  Star
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { formatCurrency, getNormalizedMonthlyCost } from '../utils/calculator';

export const PaymentMethodsModal: React.FC = () => {
  const {
    isPaymentMethodsModalOpen,
    setPaymentMethodsModalOpen,
    paymentMethods,
    subscriptions,
    currency,
    exchangeRates,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod
  } = useAppStore();

  const [showAddForm, setShowAddForm] = useState(false);
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

  return (
    <Modal
      show={isPaymentMethodsModalOpen}
      onHide={() => setPaymentMethodsModalOpen(false)}
      centered
      size="lg"
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <CreditCard size={16} style={{ color: 'var(--text-secondary)' }} />
          <span>Payment methods</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '16px 20px' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>Saved cards & accounts</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Manage which payment method is used for each subscription.
            </div>
          </div>
          {!showAddForm && (
            <button
              type="button"
              className="btn-primary-action"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={14} />
              <span>Add card</span>
            </button>
          )}
        </div>

        {/* Add Payment Method Form */}
        {showAddForm && (
          <div className="section-panel" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 650, fontSize: 13.5, marginBottom: 12 }}>New payment method</div>
            <Form onSubmit={handleAddSubmit}>
              <Row className="g-2">
                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label>Description / nickname</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Chase Sapphire"
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

              <div className="d-flex justify-content-end gap-2 mt-3 pt-2 border-top border-border">
                <button
                  type="button"
                  className="btn-subtle"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action">
                  <Check size={14} /> Save card
                </button>
              </div>
            </Form>
          </div>
        )}

        {/* Existing Cards List */}
        <div className="d-flex flex-column gap-2">
          {paymentMethods.map(pm => {
            const monthlySpent = getSpendingForCard(pm.id);
            const subCount = subscriptions.filter(s => s.paymentMethodId === pm.id && s.status === 'active').length;

            return (
              <div
                key={pm.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)'
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <CreditCard size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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

                <div className="d-flex align-items-center gap-3">
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
                        style={{ fontSize: 12, padding: '3px 7px', height: 'auto' }}
                        onClick={() => setDefaultPaymentMethod(pm.id)}
                        title="Set as default"
                      >
                        <Star size={13} />
                        <span>Set default</span>
                      </button>
                    )}
                    {paymentMethods.length > 1 && (
                      <button
                        type="button"
                        className="btn-danger-ghost"
                        style={{ padding: '3px 6px', height: 'auto' }}
                        onClick={() => deletePaymentMethod(pm.id)}
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
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn-subtle" onClick={() => setPaymentMethodsModalOpen(false)}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};
