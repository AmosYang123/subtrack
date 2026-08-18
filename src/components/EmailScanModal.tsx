import React, { useState, useEffect } from 'react';
import { Modal, Form, ProgressBar, Spinner, Alert } from 'react-bootstrap';
import { Mail, Check, AlertCircle, FileText, Upload, Sparkles, Plus } from 'lucide-react';
import { useAppStore } from '../services/store';
import { EmailScanItem, Subscription } from '../types';
import { scanEmails } from '../services/tauri';
import { convertScanItemToSubscription, parseReceiptText, SAMPLE_REAL_RECEIPTS } from '../utils/emailParser';
import { formatCurrency } from '../utils/calculator';
import { validateFileSize } from '../utils/security';

type ScanTab = 'paste' | 'inbox' | 'samples';

export const EmailScanModal: React.FC = () => {
  const {
    isEmailScanModalOpen,
    setEmailScanModalOpen,
    subscriptions,
    importSubscriptions,
    currency,
    paymentMethods
  } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<ScanTab>('paste');
  const [pastedText, setPastedText] = useState('');
  const [parsedPastedItem, setParsedPastedItem] = useState<EmailScanItem | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState<EmailScanItem[]>([]);

  useEffect(() => {
    if (isEmailScanModalOpen && activeSubTab === 'inbox') {
      runInboxScan();
    }
  }, [isEmailScanModalOpen, activeSubTab]);

  const runInboxScan = async () => {
    setIsScanning(true);
    setScanProgress(25);

    setTimeout(() => setScanProgress(60), 400);
    setTimeout(() => setScanProgress(85), 700);

    setTimeout(async () => {
      const results = await scanEmails(subscriptions);
      setScanResults(results);
      setScanProgress(100);
      setIsScanning(false);
    }, 1000);
  };

  const handlePasteChange = (text: string) => {
    setPastedText(text);
    if (text.trim().length > 10) {
      const item = parseReceiptText(text, subscriptions);
      setParsedPastedItem(item);
    } else {
      setParsedPastedItem(null);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_REAL_RECEIPTS[0]) => {
    const fullText = `Subject: ${sample.subject}\nFrom: ${sample.from}\n\n${sample.body}`;
    setPastedText(fullText);
    const item = parseReceiptText(fullText, subscriptions);
    setParsedPastedItem(item);
    setActiveSubTab('paste');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFileSize(file, 5)) {
      setFileError('File size exceeds the 5MB maximum limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handlePasteChange(content);
    };
    reader.readAsText(file);
  };

  const handleToggleSelect = (id: string) => {
    setScanResults(prev =>
      prev.map(item => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setScanResults(prev =>
      prev.map(item => (item.alreadyTracked ? item : { ...item, selected: select }))
    );
  };

  const handleImportPasted = () => {
    if (!parsedPastedItem) return;
    const defaultPmId = paymentMethods[0]?.id || 'pm_1';
    const sub = convertScanItemToSubscription(parsedPastedItem, defaultPmId);
    importSubscriptions([sub]);
    setPastedText('');
    setParsedPastedItem(null);
    setEmailScanModalOpen(false);
  };

  const handleImportInbox = () => {
    const selectedItems = scanResults.filter(item => item.selected);
    const defaultPmId = paymentMethods[0]?.id || 'pm_1';

    const newSubs: Subscription[] = selectedItems.map(item =>
      convertScanItemToSubscription(item, defaultPmId)
    );

    importSubscriptions(newSubs);
    setEmailScanModalOpen(false);
  };

  const selectedCount = scanResults.filter(item => item.selected).length;

  return (
    <Modal
      show={isEmailScanModalOpen}
      onHide={() => setEmailScanModalOpen(false)}
      centered
      size="lg"
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
          <span>Receipt & email parser</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '16px 20px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
          <button
            type="button"
            className={`btn-ghost ${activeSubTab === 'paste' ? 'btn-subtle' : ''}`}
            style={{ fontWeight: activeSubTab === 'paste' ? 600 : 400, fontSize: 13 }}
            onClick={() => setActiveSubTab('paste')}
          >
            <FileText size={14} style={{ marginRight: 6 }} />
            <span>Paste receipt or invoice</span>
          </button>
          <button
            type="button"
            className={`btn-ghost ${activeSubTab === 'samples' ? 'btn-subtle' : ''}`}
            style={{ fontWeight: activeSubTab === 'samples' ? 600 : 400, fontSize: 13 }}
            onClick={() => setActiveSubTab('samples')}
          >
            <Sparkles size={14} style={{ marginRight: 6 }} />
            <span>Sample real receipts</span>
          </button>
          <button
            type="button"
            className={`btn-ghost ${activeSubTab === 'inbox' ? 'btn-subtle' : ''}`}
            style={{ fontWeight: activeSubTab === 'inbox' ? 600 : 400, fontSize: 13 }}
            onClick={() => setActiveSubTab('inbox')}
          >
            <Mail size={14} style={{ marginRight: 6 }} />
            <span>Simulated inbox scan</span>
          </button>
        </div>

        {/* TAB 1: PASTE RECEIPT TEXT */}
        {activeSubTab === 'paste' && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2 }}>
                Paste any subscription confirmation or invoice
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: 0 }}>
                Copy text from your Apple, Google Play, Stripe, PayPal, Netflix, OpenAI or GitHub email receipt and paste it below.
              </p>
            </div>

            <Form.Group style={{ marginBottom: 12 }}>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Paste receipt email body here... (e.g. 'Apple Invoice: Apple One Premier renewed for $37.95/month on Aug 15')"
                value={pastedText}
                onChange={(e) => handlePasteChange(e.target.value)}
                style={{ fontSize: 12.5, fontFamily: 'var(--font-mono, monospace)' }}
              />
            </Form.Group>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <label className="btn-ghost" style={{ cursor: 'pointer', fontSize: 12, padding: '4px 8px' }}>
                <Upload size={13} style={{ marginRight: 5 }} />
                <span>Upload .eml or .txt file</span>
                <input type="file" accept=".eml,.txt,.json" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              {pastedText && (
                <button type="button" className="btn-ghost" style={{ fontSize: 12 }} onClick={() => handlePasteChange('')}>
                  Clear text
                </button>
              )}
            </div>

            {fileError && (
              <Alert variant="danger" style={{ fontSize: 12, padding: '6px 12px', marginBottom: 12 }}>
                {fileError}
              </Alert>
            )}

            {/* Parsed Result Preview */}
            {parsedPastedItem && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--primary)',
                  backgroundColor: 'var(--bg-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                        {parsedPastedItem.detectedService}
                      </span>
                      <span className="badge-tag">{parsedPastedItem.detectedCategory}</span>
                      <span className="badge-tag badge-success-subtle">{parsedPastedItem.confidence}% match</span>
                      {parsedPastedItem.alreadyTracked && (
                        <span className="badge-tag badge-info-subtle">Already in SubTrax</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      Detected charge: <strong>{formatCurrency(parsedPastedItem.detectedAmount, parsedPastedItem.detectedCurrency)}</strong> / {parsedPastedItem.detectedCycle}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={handleImportPasted}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <Plus size={14} />
                    <span>Track this subscription</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAMPLE REAL RECEIPTS */}
        {activeSubTab === 'samples' && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2 }}>
                Try real receipt templates
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: 0 }}>
                Click on any sample receipt below to instantly test the parser and import it.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
              {SAMPLE_REAL_RECEIPTS.map((sample, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => handleSelectSample(sample)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                      {sample.title}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      From: {sample.from}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {sample.subject}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)', whiteSpace: 'pre-line', maxHeight: 48, overflow: 'hidden' }}>
                    {sample.body.slice(0, 140)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: INBOX SCAN */}
        {activeSubTab === 'inbox' && (
          <div>
            {isScanning ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <Spinner animation="border" size="sm" style={{ color: 'var(--primary)' }} />
                </div>
                <h6 style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  Analyzing connected inbox receipts...
                </h6>
                <p style={{ color: 'var(--text-muted)', fontSize: 12.5, marginBottom: 16 }}>
                  Scanning statements and recurring notices.
                </p>
                <div style={{ maxWidth: 360, margin: '0 auto' }}>
                  <ProgressBar
                    now={scanProgress}
                    style={{ height: 4, borderRadius: 2, backgroundColor: 'var(--bg-inset)' }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                      Found {scanResults.length} recurring charges in inbox
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      Select the services you want to track in SubTrax.
                    </div>
                  </div>
                  <div className="d-flex gap-1">
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ fontSize: 12, padding: '4px 8px', height: 'auto' }}
                      onClick={() => handleSelectAll(true)}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ fontSize: 12, padding: '4px 8px', height: 'auto', color: 'var(--text-muted)' }}
                      onClick={() => handleSelectAll(false)}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {scanResults.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius)',
                        border: item.selected ? '1px solid var(--primary)' : '1px solid var(--border)',
                        backgroundColor: item.selected ? 'var(--primary-bg)' : 'var(--bg)',
                        cursor: item.alreadyTracked ? 'default' : 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => !item.alreadyTracked && handleToggleSelect(item.id)}
                    >
                      <Form.Check
                        type="checkbox"
                        checked={!!item.selected}
                        disabled={item.alreadyTracked}
                        onChange={() => handleToggleSelect(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginTop: 2 }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="d-flex justify-content-between align-items-baseline">
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>
                              {item.detectedService}
                            </span>
                            <span className="badge-tag">{item.detectedCategory}</span>
                            {item.alreadyTracked && (
                              <span className="badge-tag badge-info-subtle">Already tracked</span>
                            )}
                            {!item.alreadyTracked && (
                              <span className="badge-tag badge-success-subtle">{item.confidence}% match</span>
                            )}
                          </div>

                          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>
                              {formatCurrency(item.detectedAmount, item.detectedCurrency || currency)}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 3 }}>
                              /{item.detectedCycle === 'monthly' ? 'mo' : item.detectedCycle === 'yearly' ? 'yr' : item.detectedCycle}
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          From: {item.from}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn-subtle" onClick={() => setEmailScanModalOpen(false)}>
          Close
        </button>
        {activeSubTab === 'inbox' && (
          <button
            type="button"
            className="btn-primary-action"
            disabled={selectedCount === 0 || isScanning}
            onClick={handleImportInbox}
          >
            <Check size={14} />
            <span>Import selected ({selectedCount})</span>
          </button>
        )}
      </Modal.Footer>
    </Modal>
  );
};
