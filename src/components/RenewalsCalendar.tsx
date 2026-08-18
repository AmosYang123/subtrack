import React, { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../services/store';
import {
  formatCurrency,
  getDaysUntilRenewal
} from '../utils/calculator';
import { CATEGORY_COLORS } from '../utils/catalog';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO
} from 'date-fns';

export const RenewalsCalendar: React.FC = () => {
  const { subscriptions, currency, openEditModal } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const upcomingTimeline = [...activeSubs].sort((a, b) =>
    (a.nextBillingDate || '').localeCompare(b.nextBillingDate || '')
  );

  return (
    <div>
      {/* Month nav — simple text heading with arrow buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn-icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn-subtle" onClick={() => setCurrentMonth(new Date())}>Today</button>
          <button className="btn-icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <Row className="g-3">
        {/* Calendar grid */}
        <Col xs={12} lg={8}>
          <div className="cal-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="cal-header-cell">{d}</div>
            ))}

            {/* Pad start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`pad-${i}`} className="cal-cell cal-empty" />
            ))}

            {daysInMonth.map(day => {
              const isToday = isSameDay(day, new Date());
              const subsForDay = activeSubs.filter(sub => {
                if (!sub.nextBillingDate) return false;
                try { return isSameDay(parseISO(sub.nextBillingDate), day); }
                catch { return false; }
              });

              return (
                <div
                  key={day.toISOString()}
                  className={`cal-cell ${isToday ? 'cal-cell-today' : ''}`}
                >
                  <div className="cal-cell-date">
                    {format(day, 'd')}
                    {subsForDay.length > 0 && (
                      <span style={{ float: 'right', fontSize: 10, fontWeight: 600, color: 'var(--primary)' }}>
                        {formatCurrency(subsForDay.reduce((s, x) => s + x.amount, 0), currency)}
                      </span>
                    )}
                  </div>
                  {subsForDay.map(sub => {
                    const catColor = CATEGORY_COLORS[sub.category] || '#64748b';
                    return (
                      <div
                        key={sub.id}
                        className="cal-cell-event"
                        style={{
                          background: `${catColor}18`,
                          color: catColor,
                          fontWeight: 600,
                          borderLeft: `2px solid ${catColor}`
                        }}
                        onClick={() => openEditModal(sub)}
                        title={`${sub.name}: ${formatCurrency(sub.amount, sub.currency || currency)}`}
                      >
                        {sub.name}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Pad end */}
            {Array.from({ length: (7 - ((monthStart.getDay() + daysInMonth.length) % 7)) % 7 }).map((_, i) => (
              <div key={`pad-end-${i}`} className="cal-cell cal-empty" />
            ))}
          </div>
        </Col>

        {/* Timeline sidebar */}
        <Col xs={12} lg={4}>
          <div className="section-panel" style={{ padding: 16 }}>
            <div className="section-heading" style={{ marginBottom: 8 }}>Upcoming renewals</div>
            {upcomingTimeline.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24, fontSize: 13 }}>No upcoming renewals.</p>
            ) : (
              <div>
                {upcomingTimeline.map(sub => {
                  const daysLeft = getDaysUntilRenewal(sub.nextBillingDate);
                  const renewalLabel = daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`;
                  const renewalClass = daysLeft <= 1 ? 'renewal-urgent' : daysLeft <= 7 ? 'renewal-soon' : 'renewal-normal';

                  return (
                    <div
                      key={sub.id}
                      className="timeline-item"
                      onClick={() => openEditModal(sub)}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{sub.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 2 }}>
                          <span>
                            {sub.nextBillingDate
                              ? format(parseISO(sub.nextBillingDate), 'MMM d, yyyy')
                              : '—'}
                          </span>
                          <span className={renewalClass}>{renewalLabel}</span>
                        </div>
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>
                        {formatCurrency(sub.amount, sub.currency || currency)}
                      </span>
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
