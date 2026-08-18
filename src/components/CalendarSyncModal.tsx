import React, { useState } from 'react';
import { Modal, Form, Row, Col } from 'react-bootstrap';
import {
  Calendar,
  Download,
  ExternalLink,
  Bell,
  CheckCircle2,
  Smartphone,
  Laptop
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { downloadICalendarFile, getGoogleCalendarAddUrl } from '../utils/calendarSync';

export const CalendarSyncModal: React.FC = () => {
  const {
    isCalendarSyncModalOpen,
    setCalendarSyncModalOpen,
    subscriptions
  } = useAppStore();

  const [reminderDays, setReminderDays] = useState(3);
  const [includeAmounts, setIncludeAmounts] = useState(true);
  const [includeCancelLinks, setIncludeCancelLinks] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const activeCount = subscriptions.filter(s => !activeOnly || s.status === 'active').length;

  const handleDownload = () => {
    downloadICalendarFile(subscriptions, 'subtrax_renewals.ics', {
      reminderDays,
      includeAmounts,
      includeCancelLinks,
      activeOnly
    });
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <Modal
      show={isCalendarSyncModalOpen}
      onHide={() => setCalendarSyncModalOpen(false)}
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <Calendar size={18} style={{ color: 'var(--primary)' }} />
          <span>Native Calendar Sync (Apple / Google / Outlook)</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: '20px 24px' }}>
        <div className="mb-3">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Sync all your recurring subscription renewal dates and price amounts directly to your phone and computer's native calendar. Get automatic pop-up reminders before you get charged.
          </p>
        </div>

        <Row className="g-3 mb-4">
          <Col xs={12} md={6}>
            <div className="section-panel h-100 p-3" style={{ background: 'var(--bg-subtle)' }}>
              <div className="d-flex align-items-center gap-2 mb-2" style={{ fontWeight: 650, fontSize: 13.5 }}>
                <Laptop size={16} style={{ color: 'var(--primary)' }} />
                <span>Option 1: Universal .ICS File Export</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Compatible with <strong>Apple Calendar (iPhone & Mac)</strong>, <strong>Microsoft Outlook</strong>, <strong>Google Calendar</strong>, and <strong>Thunderbird</strong>.
              </p>

              <Form.Group className="mb-2">
                <Form.Label style={{ fontSize: 12 }}>Reminder notification</Form.Label>
                <Form.Select
                  size="sm"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(parseInt(e.target.value))}
                >
                  <option value="1">1 day before renewal</option>
                  <option value="2">2 days before renewal</option>
                  <option value="3">3 days before renewal (Recommended)</option>
                  <option value="7">1 week before renewal</option>
                </Form.Select>
              </Form.Group>

              <div className="d-flex flex-column gap-1.5 mb-3">
                <Form.Check
                  type="checkbox"
                  id="include-amounts"
                  label={<span style={{ fontSize: 12 }}>Include price in event title (e.g. Spotify - $11.99)</span>}
                  checked={includeAmounts}
                  onChange={(e) => setIncludeAmounts(e.target.checked)}
                />
                <Form.Check
                  type="checkbox"
                  id="include-cancel"
                  label={<span style={{ fontSize: 12 }}>Include 1-click cancel link in event notes</span>}
                  checked={includeCancelLinks}
                  onChange={(e) => setIncludeCancelLinks(e.target.checked)}
                />
                <Form.Check
                  type="checkbox"
                  id="active-only"
                  label={<span style={{ fontSize: 12 }}>Export active subscriptions only ({activeCount} items)</span>}
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                />
              </div>

              <button
                type="button"
                className="btn-primary-action w-100"
                onClick={handleDownload}
                style={{ justifyContent: 'center' }}
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Downloaded subtrax_renewals.ics</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Download .ICS Calendar File</span>
                  </>
                )}
              </button>
            </div>
          </Col>

          <Col xs={12} md={6}>
            <div className="section-panel h-100 p-3" style={{ background: 'var(--bg-subtle)' }}>
              <div className="d-flex align-items-center gap-2 mb-2" style={{ fontWeight: 650, fontSize: 13.5 }}>
                <Smartphone size={16} style={{ color: 'var(--primary)' }} />
                <span>Option 2: 1-Click Quick Add to Google Calendar</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Add individual high-value subscriptions directly to your Google Calendar web interface in 1 click.
              </p>

              <div className="d-flex flex-column gap-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
                {subscriptions.filter(s => s.status === 'active').slice(0, 6).map(sub => (
                  <div
                    key={sub.id}
                    className="d-flex justify-content-between align-items-center p-2"
                    style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{sub.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {sub.currency || 'USD'} {sub.amount} · Next: {sub.nextBillingDate || '—'}
                      </div>
                    </div>
                    <a
                      href={getGoogleCalendarAddUrl(sub)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost d-flex align-items-center gap-1"
                      style={{ fontSize: 11.5, padding: '3px 8px' }}
                    >
                      <ExternalLink size={12} />
                      <span>Google Cal</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        <div className="d-flex justify-content-end pt-2 border-top border-border">
          <button
            type="button"
            className="btn-subtle"
            onClick={() => setCalendarSyncModalOpen(false)}
          >
            Done
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
