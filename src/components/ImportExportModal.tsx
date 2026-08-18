import React, { useState } from 'react';
import { Modal, Row, Col, Alert, Form } from 'react-bootstrap';
import {
  FileSpreadsheet,
  Download,
  Upload,
  FileJson,
  Check,
  AlertCircle,
  CreditCard,
  Layers,
  Trash2,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../services/store';
import {
  exportSubscriptionsToCSV,
  exportSubscriptionsToJSON,
  parseSubscriptionsFromCSV,
  downloadFile
} from '../utils/exportImport';
import { parseBankStatementCSV } from '../utils/statementParser';
import { REAL_DATA_PRESETS } from '../utils/presets';
import { Subscription, StatementParsedItem } from '../types';
import { formatCurrency } from '../utils/calculator';
import { format, addMonths } from 'date-fns';

type ModalTab = 'presets' | 'statement' | 'backup';

export const ImportExportModal: React.FC = () => {
  const {
    isImportExportModalOpen,
    setImportExportModalOpen,
    subscriptions,
    importSubscriptions,
    clearAllSubscriptions,
    loadPreset,
    currency,
    paymentMethods
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<ModalTab>('presets');
  const [statementItems, setStatementItems] = useState<StatementParsedItem[]>([]);
  const [backupPreview, setBackupPreview] = useState<Partial<Subscription>[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [presetSuccess, setPresetSuccess] = useState<string | null>(null);

  const handleExportCSV = () => {
    const csvData = exportSubscriptionsToCSV(subscriptions);
    downloadFile(csvData, `subtrax_subscriptions_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const jsonData = exportSubscriptionsToJSON(subscriptions);
    downloadFile(jsonData, `subtrax_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleStatementUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseBankStatementCSV(text, subscriptions);
        if (parsed.length === 0) {
          setImportError('Could not detect any recurring subscription charges in this statement CSV.');
        } else {
          setStatementItems(parsed);
        }
      } catch (err: any) {
        setImportError(`Failed to parse bank statement: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.subscriptions)) {
            setBackupPreview(parsed.subscriptions);
          } else if (Array.isArray(parsed)) {
            setBackupPreview(parsed);
          } else {
            setImportError('Invalid JSON format: Expected array of subscriptions');
          }
        } else {
          const parsed = parseSubscriptionsFromCSV(text);
          if (parsed.length === 0) {
            setImportError('Could not parse any subscriptions from this CSV file.');
          } else {
            setBackupPreview(parsed);
          }
        }
      } catch (err: any) {
        setImportError(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleToggleStatementItem = (id: string) => {
    setStatementItems(prev =>
      prev.map(item => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleConfirmStatementImport = () => {
    const selected = statementItems.filter(i => i.selected);
    if (selected.length === 0) return;

    const defaultPmId = paymentMethods[0]?.id || 'pm_1';
    const newSubs: Subscription[] = selected.map(item => ({
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: item.matchedService,
      amount: item.amount,
      currency: item.currency || currency,
      billingCycle: item.billingCycle,
      nextBillingDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
      category: item.category || 'Other',
      paymentMethodId: defaultPmId,
      cancelUrl: item.cancelUrl,
      websiteUrl: item.websiteUrl,
      notes: `Imported from statement charge: "${item.rawMerchant}"`,
      status: 'active',
      createdAt: new Date().toISOString()
    }));

    importSubscriptions(newSubs);
    setStatementItems([]);
    setImportExportModalOpen(false);
  };

  const handleConfirmBackupImport = () => {
    if (backupPreview.length === 0) return;
    const readySubs = backupPreview.map((sub, idx) => ({
      id: sub.id || `imp_${Date.now()}_${idx}`,
      name: sub.name || 'Imported Subscription',
      amount: sub.amount || 9.99,
      currency: sub.currency || 'USD',
      billingCycle: sub.billingCycle || 'monthly',
      nextBillingDate: sub.nextBillingDate || new Date().toISOString().split('T')[0],
      category: sub.category || 'Other',
      paymentMethodId: sub.paymentMethodId || 'pm_1',
      notes: sub.notes || 'Imported from backup',
      status: sub.status || 'active',
      createdAt: new Date().toISOString()
    })) as Subscription[];

    importSubscriptions(readySubs);
    setBackupPreview([]);
    setImportExportModalOpen(false);
  };

  const handleApplyPreset = (presetId: string) => {
    loadPreset(presetId);
    const preset = REAL_DATA_PRESETS.find(p => p.id === presetId);
    setPresetSuccess(`Loaded dataset: "${preset?.title}" (${preset?.subscriptions.length || 0} subscriptions)`);
    setTimeout(() => setPresetSuccess(null), 3000);
  };

  const selectedStatementCount = statementItems.filter(i => i.selected).length;

  return (
    <Modal
      show={isImportExportModalOpen}
      onHide={() => {
        setImportExportModalOpen(false);
        setStatementItems([]);
        setBackupPreview([]);
        setImportError(null);
      }}
      centered
      size="lg"
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <FileSpreadsheet size={16} style={{ color: 'var(--text-secondary)' }} />
          <span>Real data & imports</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '16px 20px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
          <button
            type="button"
            className={`btn-ghost ${activeTab === 'presets' ? 'btn-subtle' : ''}`}
            style={{ fontWeight: activeTab === 'presets' ? 600 : 400, fontSize: 13 }}
            onClick={() => setActiveTab('presets')}
          >
            <Sparkles size={14} style={{ marginRight: 6 }} />
            <span>Real-world profiles</span>
          </button>
          <button
            type="button"
            className={`btn-ghost ${activeTab === 'statement' ? 'btn-subtle' : ''}`}
            style={{ fontWeight: activeTab === 'statement' ? 600 : 400, fontSize: 13 }}
            onClick={() => setActiveTab('statement')}
          >
            <CreditCard size={14} style={{ marginRight: 6 }} />
            <span>Bank statement CSV</span>
          </button>
          <button
            type="button"
            className={`btn-ghost ${activeTab === 'backup' ? 'btn-subtle' : ''}`}
            style={{ fontWeight: activeTab === 'backup' ? 600 : 400, fontSize: 13 }}
            onClick={() => setActiveTab('backup')}
          >
            <Layers size={14} style={{ marginRight: 6 }} />
            <span>Backup & restore</span>
          </button>
        </div>

        {presetSuccess && (
          <Alert variant="success" className="d-flex align-items-center gap-2 small py-2 px-3 mb-3">
            <Check size={14} />
            <span>{presetSuccess}</span>
          </Alert>
        )}

        {importError && (
          <Alert variant="danger" className="d-flex align-items-center gap-2 small py-2 px-3 mb-3">
            <AlertCircle size={14} />
            <span>{importError}</span>
          </Alert>
        )}

        {/* TAB 1: PRESETS */}
        {activeTab === 'presets' && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2 }}>
                Load curated real-world subscription datasets
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: 0 }}>
                Populate your workspace with real subscriptions, current pricing, plans and cards with 1 click.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              {REAL_DATA_PRESETS.map(preset => (
                <div
                  key={preset.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>
                        {preset.title}
                      </span>
                      <span className="badge-tag">{preset.badge}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10, lineHeight: 1.4 }}>
                      {preset.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      {preset.subscriptions.length} subs · {preset.paymentMethods.length} cards
                    </span>
                    <button
                      type="button"
                      className="btn-subtle"
                      style={{ fontSize: 12, padding: '3px 8px' }}
                      onClick={() => handleApplyPreset(preset.id)}
                    >
                      Load dataset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: BANK STATEMENT CSV */}
        {activeTab === 'statement' && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2 }}>
                Import from bank / card export statement
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: 0 }}>
                Upload an exported CSV from Chase, Amex, Bank of America, Apple Card, Revolut, Monzo, PayPal, or Stripe. Subtrax will automatically identify recurring subscriptions.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2 p-2 mb-3" style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--primary-text)' }}>
              <span>🔒 <strong>100% Client-Side Privacy Guarantee:</strong> Your statement is parsed entirely inside your browser memory. No financial numbers, account balances, or statements are ever uploaded or transmitted to any server.</span>
            </div>

            <div style={{ padding: '16px', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', textAlign: 'center', marginBottom: 14 }}>
              <Upload size={20} style={{ color: 'var(--text-secondary)', marginBottom: 6 }} />
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>
                Select a bank statement CSV file
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 11.5, marginBottom: 10 }}>
                Supports standard statement CSV formats
              </p>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleStatementUpload}
                className="form-control form-control-sm"
                style={{ maxWidth: 300, margin: '0 auto' }}
              />
            </div>

            {/* Statement Preview Table */}
            {statementItems.length > 0 && (
              <div className="section-panel" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary)' }}>
                    Detected {statementItems.length} recurring charges
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {selectedStatementCount} selected
                  </span>
                </div>

                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  <table className="sub-table" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 30 }}></th>
                        <th>Detected Service</th>
                        <th>Statement Text</th>
                        <th>Amount</th>
                        <th>Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementItems.map(item => (
                        <tr
                          key={item.id}
                          onClick={() => handleToggleStatementItem(item.id)}
                          style={{ cursor: 'pointer', backgroundColor: item.selected ? 'var(--primary-bg)' : undefined }}
                        >
                          <td>
                            <Form.Check
                              type="checkbox"
                              checked={!!item.selected}
                              onChange={() => handleToggleStatementItem(item.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td style={{ fontWeight: 600 }}>{item.matchedService}</td>
                          <td style={{ color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.rawMerchant}
                          </td>
                          <td style={{ fontWeight: 600 }}>{formatCurrency(item.amount, item.currency)}</td>
                          <td>{item.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn-primary-action"
                    disabled={selectedStatementCount === 0}
                    onClick={handleConfirmStatementImport}
                  >
                    <Check size={14} />
                    <span>Import {selectedStatementCount} subscriptions</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BACKUP & RESTORE */}
        {activeTab === 'backup' && (
          <div>
            <Row className="g-3 mb-3">
              <Col xs={12} md={6}>
                <div className="section-panel" style={{ padding: 14, height: '100%' }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download size={15} style={{ color: 'var(--text-secondary)' }} />
                    <span>Export data</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>
                    Save a full backup of your tracked subscriptions.
                  </p>
                  <div className="d-flex flex-column gap-2">
                    <button
                      type="button"
                      className="btn-subtle"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={handleExportCSV}
                    >
                      <FileSpreadsheet size={14} />
                      <span>Download CSV (.csv)</span>
                    </button>
                    <button
                      type="button"
                      className="btn-subtle"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={handleExportJSON}
                    >
                      <FileJson size={14} />
                      <span>Download JSON (.json)</span>
                    </button>
                  </div>
                </div>
              </Col>

              <Col xs={12} md={6}>
                <div className="section-panel" style={{ padding: 14, height: '100%' }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={15} style={{ color: 'var(--text-secondary)' }} />
                    <span>Restore from backup</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>
                    Upload a previously exported CSV or JSON file.
                  </p>
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleBackupUpload}
                    className="form-control form-control-sm"
                  />
                </div>
              </Col>
            </Row>

            {backupPreview.length > 0 && (
              <div className="section-panel" style={{ padding: 12, marginTop: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary)', marginBottom: 6 }}>
                  Preview subscriptions to restore ({backupPreview.length})
                </div>
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                  <table className="sub-table" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Amount</th>
                        <th>Cycle</th>
                        <th>Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backupPreview.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 550 }}>{item.name}</td>
                          <td>${item.amount?.toFixed(2)}</td>
                          <td style={{ textTransform: 'capitalize' }}>{item.billingCycle}</td>
                          <td>{item.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end mt-2">
                  <button type="button" className="btn-primary-action" onClick={handleConfirmBackupImport}>
                    <Check size={14} />
                    <span>Import all {backupPreview.length} items</span>
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Currently tracking {subscriptions.length} subscription(s)
              </span>
              <button
                type="button"
                className="btn-ghost"
                style={{ color: '#ef4444', fontSize: 12 }}
                onClick={() => {
                  if (window.confirm('Clear all subscriptions from this workspace? You can reload sample presets anytime.')) {
                    clearAllSubscriptions();
                  }
                }}
              >
                <Trash2 size={13} style={{ marginRight: 4 }} />
                <span>Clear all data</span>
              </button>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="btn-subtle"
          onClick={() => {
            setImportExportModalOpen(false);
            setStatementItems([]);
            setBackupPreview([]);
            setImportError(null);
          }}
        >
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};
