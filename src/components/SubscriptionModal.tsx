import React, { useState, useEffect } from 'react';
import { Modal, Form, Row, Col } from 'react-bootstrap';
import {
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Mail,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  Zap,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { Subscription, BillingCycle, SubscriptionStatus } from '../types';
import {
  POPULAR_SERVICES,
  CATEGORIES,
  CURRENCIES,
  CATEGORY_COLORS,
  CatalogService,
  findCatalogService,
  searchCatalog
} from '../utils/catalog';
import { getNextRenewalDate } from '../utils/calculator';
import { generateStrongPassword, evaluatePasswordStrength } from '../utils/passwordGenerator';
import { format } from 'date-fns';
import { getSafeExternalUrl } from '../utils/security';

export const SubscriptionModal: React.FC = () => {
  const {
    isAddEditModalOpen,
    editingSubscription,
    closeAddEditModal,
    addSubscription,
    updateSubscription,
    paymentMethods,
    suggestedAccountEmails,
    user,
    currency: defaultCurrency
  } = useAppStore();

  const [formData, setFormData] = useState<Partial<Subscription>>({
    name: '',
    amount: 0,
    currency: defaultCurrency,
    billingCycle: 'monthly',
    nextBillingDate: format(new Date(), 'yyyy-MM-dd'),
    category: 'Streaming',
    paymentMethodId: paymentMethods[0]?.id || 'pm_1',
    accountEmail: '',
    accountPassword: '',
    passwordHint: '',
    cancelUrl: '',
    isTrial: false,
    trialEndDate: '',
    lastUsedDate: format(new Date(), 'yyyy-MM-dd'),
    usageFrequency: 'daily',
    annualPrice: undefined,
    status: 'active',
    websiteUrl: '',
    notes: '',
    color: '#64748b'
  });

  const [serviceSearch, setServiceSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [autofillSuggestions, setAutofillSuggestions] = useState<CatalogService[]>([]);

  useEffect(() => {
    if (editingSubscription) {
      setFormData({ ...editingSubscription });
      setServiceSearch('');
      setShowPasswordSection(Boolean(editingSubscription.accountPassword || editingSubscription.passwordHint));
    } else {
      setFormData({
        name: '',
        amount: 0,
        currency: defaultCurrency,
        billingCycle: 'monthly',
        nextBillingDate: format(new Date(), 'yyyy-MM-dd'),
        category: 'Streaming',
        paymentMethodId: paymentMethods[0]?.id || 'pm_1',
        accountEmail: user?.email || (suggestedAccountEmails[0] || ''),
        accountPassword: '',
        passwordHint: '',
        cancelUrl: '',
        isTrial: false,
        trialEndDate: '',
        lastUsedDate: format(new Date(), 'yyyy-MM-dd'),
        usageFrequency: 'daily',
        annualPrice: undefined,
        status: 'active',
        websiteUrl: '',
        notes: '',
        color: '#64748b'
      });
      setServiceSearch('');
      setShowPasswordSection(false);
    }
  }, [editingSubscription, isAddEditModalOpen, defaultCurrency, paymentMethods, user, suggestedAccountEmails]);

  // Handle Name input change with smart autofill suggestions without greedy prefix mutation
  const handleNameChange = (newName: string) => {
    setFormData(prev => ({ ...prev, name: newName }));

    if (newName.trim().length >= 2) {
      const suggestions = searchCatalog(newName, 4);
      setAutofillSuggestions(suggestions);

      // Only auto-populate metadata on exact name or exact alias match (e.g. pasted URL or completed name)
      if (!editingSubscription) {
        const exact = POPULAR_SERVICES.find(
          s => s.name.toLowerCase() === newName.trim().toLowerCase() ||
               s.aliases.some(a => a.toLowerCase() === newName.trim().toLowerCase())
        );
        if (exact) {
          setFormData(prev => ({
            ...prev,
            name: exact.name,
            category: exact.category,
            amount: prev.amount && prev.amount > 0 ? prev.amount : exact.defaultAmount,
            currency: exact.currency || prev.currency || defaultCurrency,
            billingCycle: exact.billingCycle,
            cancelUrl: exact.cancelUrl || prev.cancelUrl,
            websiteUrl: exact.websiteUrl || prev.websiteUrl,
            color: exact.color,
            notes: exact.description || prev.notes,
            annualPrice: exact.annualPrice
          }));
        }
      }
    } else {
      setAutofillSuggestions([]);
    }
  };

  const handleSelectPreset = (preset: CatalogService) => {
    setFormData(prev => ({
      ...prev,
      name: preset.name,
      amount: preset.defaultAmount,
      currency: preset.currency || defaultCurrency,
      billingCycle: preset.billingCycle,
      category: preset.category,
      color: preset.color,
      websiteUrl: preset.websiteUrl,
      cancelUrl: preset.cancelUrl || prev.cancelUrl,
      annualPrice: preset.annualPrice,
      notes: preset.description || prev.notes,
      nextBillingDate: getNextRenewalDate(new Date().toISOString(), preset.billingCycle)
    }));
    setServiceSearch('');
    setAutofillSuggestions([]);
  };

  const handleGeneratePassword = () => {
    const newPass = generateStrongPassword({ length: 16, includeSymbols: true });
    setFormData(prev => ({ ...prev, accountPassword: newPass }));
    setShowPassword(true);
    setShowPasswordSection(true);
  };

  const handleCopyPassword = () => {
    if (!formData.accountPassword) return;
    navigator.clipboard.writeText(formData.accountPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || (formData.amount ?? 0) <= 0) return;
    if (editingSubscription) {
      updateSubscription(editingSubscription.id, formData);
    } else {
      addSubscription(formData as Omit<Subscription, 'id' | 'createdAt'>);
    }
  };

  const filteredCatalog = serviceSearch.trim()
    ? POPULAR_SERVICES.filter(s =>
        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.category.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.aliases.some(a => a.toLowerCase().includes(serviceSearch.toLowerCase()))
      ).slice(0, 10)
    : POPULAR_SERVICES.slice(0, 10);

  const passwordStrength = evaluatePasswordStrength(formData.accountPassword || '');

  return (
    <Modal show={isAddEditModalOpen} onHide={closeAddEditModal} centered size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {editingSubscription ? `Edit ${editingSubscription.name}` : 'Add subscription'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '16px 20px' }}>
        {/* Quick Catalog Search & Suggestions */}
        {!editingSubscription && (
          <div style={{ marginBottom: 16, padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                Popular services catalogue ({POPULAR_SERVICES.length}+ real rates)
              </span>
              <input
                type="text"
                placeholder="Search presets..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                style={{
                  fontSize: 11.5,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  width: 140
                }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {filteredCatalog.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: 11.5, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => handleSelectPreset(preset)}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: preset.color, display: 'inline-block' }} />
                  <span>{preset.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>${preset.defaultAmount}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            {/* Service Name with Instant Autofill */}
            <Col xs={12} md={7}>
              <Form.Group>
                <Form.Label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Service name or website URL</span>
                  <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 500 }}>
                    ⚡ Instant Autofill active
                  </span>
                </Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type="text"
                    placeholder="e.g. Netflix, Spotify, or paste chatgpt.com"
                    value={formData.name || ''}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    autoFocus
                  />
                  {autofillSuggestions.length > 0 && !editingSubscription && (
                    <div
                      className="position-absolute w-100 shadow-dropdown p-1.5"
                      style={{
                        top: '100%',
                        left: 0,
                        zIndex: 10,
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        marginTop: 2
                      }}
                    >
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', padding: '2px 8px', fontWeight: 600 }}>
                        Autofill Suggestions:
                      </div>
                      {autofillSuggestions.map(s => (
                        <div
                          key={s.name}
                          className="d-flex justify-content-between align-items-center p-2 rounded cursor-pointer"
                          style={{ cursor: 'pointer', fontSize: 12.5 }}
                          onClick={() => handleSelectPreset(s)}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                            <strong>{s.name}</strong>
                            <span className="badge-tag badge-info-subtle" style={{ fontSize: 10.5 }}>{s.category}</span>
                          </div>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                            ${s.defaultAmount}/{s.billingCycle === 'monthly' ? 'mo' : 'yr'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Form.Group>
            </Col>

            <Col xs={12} md={5}>
              <Form.Group>
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={formData.category || 'Streaming'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, color: CATEGORY_COLORS[e.target.value] || '#64748b' })}
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={6} md={3}>
              <Form.Group>
                <Form.Label>Amount</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="14.99"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group>
                <Form.Label>Currency</Form.Label>
                <Form.Select
                  value={formData.currency || defaultCurrency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group>
                <Form.Label>Cycle</Form.Label>
                <Form.Select
                  value={formData.billingCycle || 'monthly'}
                  onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as BillingCycle })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="weekly">Weekly</option>
                  <option value="quarterly">Quarterly</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as SubscriptionStatus })}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Next renewal</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.nextBillingDate || ''}
                  onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Payment method</Form.Label>
                <Form.Select
                  value={formData.paymentMethodId || ''}
                  onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
                >
                  {paymentMethods.map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.name} ({pm.brand} •••• {pm.lastFour})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Free Trial & Usage Health Section */}
            <Col xs={12}>
              <div className="section-panel p-3" style={{ background: 'var(--bg-subtle)' }}>
                <Row className="g-3">
                  <Col xs={12} sm={6}>
                    <Form.Group>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <Form.Label className="mb-0" style={{ fontSize: 12, fontWeight: 600 }}>
                          Free Trial Status
                        </Form.Label>
                        <Form.Check
                          type="switch"
                          id="trial-switch"
                          label={<span style={{ fontSize: 11.5 }}>On Trial</span>}
                          checked={Boolean(formData.isTrial)}
                          onChange={(e) => setFormData({ ...formData, isTrial: e.target.checked })}
                        />
                      </div>
                      {formData.isTrial && (
                        <div className="mt-2">
                          <Form.Label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Trial End Date</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={formData.trialEndDate || formData.nextBillingDate || ''}
                            onChange={(e) => setFormData({ ...formData, trialEndDate: e.target.value })}
                          />
                        </div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={12} sm={6}>
                    <Form.Group>
                      <Form.Label style={{ fontSize: 12, fontWeight: 600 }}>Usage Frequency (Dormant Detector)</Form.Label>
                      <Form.Select
                        size="sm"
                        value={formData.usageFrequency || 'daily'}
                        onChange={(e) => setFormData({ ...formData, usageFrequency: e.target.value as any })}
                      >
                        <option value="daily">Daily / High active</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="dormant">Rarely / Dormant (Flags savings)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Direct 1-Click Cancellation Deep Link */}
            <Col xs={12}>
              <Form.Group>
                <Form.Label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span>Direct 1-Click Cancellation / Billing Link</span>
                  {(() => {
                    const safeCancelUrl = getSafeExternalUrl(formData.cancelUrl);
                    return safeCancelUrl ? (
                      <a
                        href={safeCancelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="d-inline-flex align-items-center gap-1"
                        style={{ fontSize: 11.5, color: 'var(--primary)', textDecoration: 'none', fontWeight: 550 }}
                      >
                        <ExternalLink size={11} />
                        <span>Test link</span>
                      </a>
                    ) : null;
                  })()}
                </Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://.../account/cancel or billing settings"
                  value={formData.cancelUrl || ''}
                  onChange={(e) => setFormData({ ...formData, cancelUrl: e.target.value })}
                  style={{ fontSize: 12.5 }}
                />
              </Form.Group>
            </Col>

            {/* Account Credentials & Suggestions Section */}
            <Col xs={12}>
              <div className="section-panel" style={{ padding: '14px 16px', background: 'var(--bg-subtle)' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-1.5" style={{ fontSize: 13, fontWeight: 650 }}>
                    <ShieldCheck size={15} style={{ color: 'var(--primary)' }} />
                    <span>Account Credentials & Autofill</span>
                  </div>
                  {!showPasswordSection && (
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ fontSize: 11.5, padding: '2px 8px', height: 'auto' }}
                      onClick={() => setShowPasswordSection(true)}
                    >
                      <KeyRound size={12} />
                      <span>Add password & security</span>
                    </button>
                  )}
                </div>

                {/* Account Email with Suggestions */}
                <Form.Group className="mb-2">
                  <Form.Label style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Account Email / Login identifier</span>
                    {suggestedAccountEmails.length > 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {suggestedAccountEmails.length} saved email{suggestedAccountEmails.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </Form.Label>
                  <div className="input-with-icon">
                    <span className="input-icon-lead">
                      <Mail size={14} />
                    </span>
                    <Form.Control
                      type="email"
                      list="account-email-suggestions"
                      placeholder="e.g. user@gmail.com, work@company.com"
                      value={formData.accountEmail || ''}
                      onChange={(e) => setFormData({ ...formData, accountEmail: e.target.value })}
                    />
                    <datalist id="account-email-suggestions">
                      {suggestedAccountEmails.map(em => (
                        <option key={em} value={em} />
                      ))}
                    </datalist>
                  </div>

                  {/* Email quick-select chips */}
                  {suggestedAccountEmails.length > 0 && (
                    <div className="d-flex flex-wrap gap-1.5 mt-1.5">
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>Suggested:</span>
                      {suggestedAccountEmails.slice(0, 4).map(em => (
                        <button
                          key={em}
                          type="button"
                          className="btn-ghost"
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            height: 'auto',
                            background: formData.accountEmail === em ? 'var(--primary-bg)' : 'var(--bg)',
                            color: formData.accountEmail === em ? 'var(--primary-text)' : 'var(--text-secondary)',
                            border: `1px solid ${formData.accountEmail === em ? 'var(--primary-border)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius-sm)'
                          }}
                          onClick={() => setFormData({ ...formData, accountEmail: em })}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  )}
                </Form.Group>

                {/* Password Generator & Storage */}
                {showPasswordSection && (
                  <div className="mt-3 pt-2.5 border-top border-border">
                    <Row className="g-2">
                      <Col xs={12} sm={8}>
                        <Form.Group>
                          <Form.Label style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                            <span>Password / Key</span>
                            {formData.accountPassword && (
                              <span style={{ fontSize: 11, color: passwordStrength.color, fontWeight: 600 }}>
                                Strength: {passwordStrength.label} ({passwordStrength.score}%)
                              </span>
                            )}
                          </Form.Label>
                          <div className="input-with-icon">
                            <span className="input-icon-lead">
                              <KeyRound size={14} />
                            </span>
                            <Form.Control
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter or generate strong password"
                              value={formData.accountPassword || ''}
                              onChange={(e) => setFormData({ ...formData, accountPassword: e.target.value })}
                              style={{ paddingRight: 65, fontFamily: showPassword ? 'monospace' : 'inherit' }}
                            />
                            <span className="input-icon-trail" style={{ gap: 2 }}>
                              <button
                                type="button"
                                className="btn-ghost p-1"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? 'Hide password' : 'Show password'}
                              >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              {formData.accountPassword && (
                                <button
                                  type="button"
                                  className="btn-ghost p-1"
                                  onClick={handleCopyPassword}
                                  title="Copy password to clipboard"
                                >
                                  {copiedPassword ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                                </button>
                              )}
                            </span>
                          </div>

                          {/* Password Strength Indicator Bar */}
                          {formData.accountPassword && (
                            <div style={{ height: 3, width: '100%', background: 'var(--border)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${passwordStrength.score}%`,
                                  background: passwordStrength.color,
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </div>
                          )}
                        </Form.Group>
                      </Col>

                      <Col xs={12} sm={4} className="d-flex flex-column justify-content-end">
                        <Form.Group>
                          <Form.Label style={{ fontSize: 12, visibility: 'hidden' }}>Action</Form.Label>
                          <button
                            type="button"
                            className="btn-subtle w-100"
                            style={{ fontSize: 12, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                            onClick={handleGeneratePassword}
                          >
                            <Sparkles size={13} style={{ color: 'var(--primary)' }} />
                            <span>Generate 16-char</span>
                          </button>
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Password hint / Recovery info (optional)</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. 2FA via Authy, backup code in 1Password"
                            value={formData.passwordHint || ''}
                            onChange={(e) => setFormData({ ...formData, passwordHint: e.target.value })}
                            style={{ fontSize: 12 }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}
              </div>
            </Col>

            <Col xs={12}>
              <Form.Group>
                <Form.Label>Website URL</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://..."
                  value={formData.websiteUrl || ''}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group>
                <Form.Label>Notes & Plan tier</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Optional details, tier description, renewal reminders..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn-subtle" onClick={closeAddEditModal}>Cancel</button>
            <button type="submit" className="btn-primary-action">
              {editingSubscription ? 'Save changes' : 'Add subscription'}
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};
