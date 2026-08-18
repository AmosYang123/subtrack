import React, { useState } from 'react';
import { Modal, Alert } from 'react-bootstrap';
import {
  Zap,
  Bookmark,
  ClipboardCheck,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { getSubtraxBookmarkletCode, checkClipboardForReceipt } from '../utils/autoSyncConnector';

export const AutoSyncModal: React.FC = () => {
  const {
    isAutoSyncModalOpen,
    setAutoSyncModalOpen,
    subscriptions,
    addSubscription
  } = useAppStore();

  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [clipboardStatus, setClipboardStatus] = useState<string | null>(null);
  const [detectedItem, setDetectedItem] = useState<any | null>(null);

  const bookmarkletCode = getSubtraxBookmarkletCode();

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  const handleScanClipboard = async () => {
    setClipboardStatus('scanning');
    try {
      const result = await checkClipboardForReceipt(subscriptions);
      if (result) {
        setDetectedItem(result);
        setClipboardStatus('found');
      } else {
        setClipboardStatus('empty');
        setTimeout(() => setClipboardStatus(null), 3000);
      }
    } catch {
      setClipboardStatus('error');
    }
  };

  const handleAcceptDetected = () => {
    if (!detectedItem) return;
    addSubscription({
      name: detectedItem.serviceName,
      amount: detectedItem.amount || 9.99,
      currency: detectedItem.currency || 'USD',
      billingCycle: detectedItem.billingCycle || 'monthly',
      nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      category: detectedItem.category || 'Software',
      cancelUrl: detectedItem.cancelUrl,
      websiteUrl: detectedItem.url,
      notes: 'Auto-captured via Zero-Touch background sync',
      status: 'active'
    });
    setDetectedItem(null);
    setClipboardStatus('added');
    setTimeout(() => {
      setClipboardStatus(null);
      setAutoSyncModalOpen(false);
    }, 1500);
  };

  return (
    <Modal
      show={isAutoSyncModalOpen}
      onHide={() => setAutoSyncModalOpen(false)}
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <Zap size={18} style={{ color: 'var(--primary)' }} />
          <span>Zero-Touch Autonomous Subscription Ingestion</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: '20px 24px' }}>
        <div className="mb-3">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Never log a subscription manually again. Subtrax can automatically capture and register new services directly when you checkout on Spotify, OpenAI, Netflix, or any site.
          </p>
        </div>

        {/* Option A: Quick Clipboard Scan */}
        <div className="section-panel p-3 mb-3" style={{ background: 'var(--bg-subtle)' }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-2" style={{ fontWeight: 650, fontSize: 13.5 }}>
              <ClipboardCheck size={16} style={{ color: 'var(--primary)' }} />
              <span>1. Clipboard Auto-Detector</span>
            </div>
            <button
              type="button"
              className="btn-primary-action"
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={handleScanClipboard}
            >
              <span>Scan Clipboard for Receipt</span>
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Copy any receipt text, Stripe confirmation, or billing email, then click Scan to auto-populate.
          </p>

          {clipboardStatus === 'scanning' && (
            <Alert variant="info" className="mt-2 mb-0" style={{ fontSize: 12, padding: '6px 12px' }}>
              Scanning clipboard text...
            </Alert>
          )}

          {clipboardStatus === 'empty' && (
            <Alert variant="secondary" className="mt-2 mb-0" style={{ fontSize: 12, padding: '6px 12px' }}>
              No new subscription receipt detected in your clipboard.
            </Alert>
          )}

          {clipboardStatus === 'added' && (
            <Alert variant="success" className="mt-2 mb-0" style={{ fontSize: 12, padding: '6px 12px' }}>
              ✓ Subscription successfully added to Subtrax!
            </Alert>
          )}

          {detectedItem && (
            <div className="p-3 mt-2" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-border)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{detectedItem.serviceName}</div>
                  <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                    {detectedItem.currency} {detectedItem.amount} / {detectedItem.billingCycle}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary-action"
                  onClick={handleAcceptDetected}
                  style={{ fontSize: 12 }}
                >
                  <Check size={13} />
                  <span>Accept & Track</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Option B: 1-Click Browser Bookmarklet */}
        <div className="section-panel p-3 mb-3" style={{ background: 'var(--bg-subtle)' }}>
          <div className="d-flex align-items-center gap-2 mb-2" style={{ fontWeight: 650, fontSize: 13.5 }}>
            <Bookmark size={16} style={{ color: 'var(--primary)' }} />
            <span>2. Subtrax 1-Click Checkout Bookmarklet</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Drag this button to your browser's Bookmarks bar. Whenever you finish subscribing on any website, click the bookmark to instantly sync it to Subtrax!
          </p>

          <div className="d-flex align-items-center gap-3 mt-2">
            <a
              href={bookmarkletCode}
              className="btn-primary-action"
              style={{ fontSize: 12.5, padding: '6px 14px', textDecoration: 'none', cursor: 'grab' }}
              onClick={(e) => { e.preventDefault(); handleCopyBookmarklet(); }}
              title="Drag me to your browser bookmarks bar"
            >
              <Sparkles size={14} />
              <span>+ Add to Subtrax</span>
            </a>

            <button
              type="button"
              className="btn-subtle"
              style={{ fontSize: 12 }}
              onClick={handleCopyBookmarklet}
            >
              {copiedBookmarklet ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedBookmarklet ? 'Copied code!' : 'Copy bookmarklet URL'}</span>
            </button>
          </div>
        </div>

        <div className="d-flex justify-content-end pt-2 border-top border-border">
          <button
            type="button"
            className="btn-subtle"
            onClick={() => setAutoSyncModalOpen(false)}
          >
            Done
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
