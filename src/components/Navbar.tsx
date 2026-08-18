import React from 'react';
import { Dropdown } from 'react-bootstrap';
import {
  Layers,
  PieChart,
  Calendar,
  CreditCard,
  Sun,
  Moon,
  Plus,
  Mail,
  FileSpreadsheet,
  Sparkles,
  RefreshCw,
  Cloud,
  CheckCircle2,
  Zap,
  CalendarDays,
  Camera
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { CURRENCIES } from '../utils/catalog';
import { REAL_DATA_PRESETS } from '../utils/presets';
import { ActiveTab } from '../types';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    theme,
    setTheme,
    currency,
    setCurrency,
    loadPreset,
    isRatesLoading,
    openAddModal,
    setEmailScanModalOpen,
    setImportExportModalOpen,
    setAuthModalOpen,
    setCalendarSyncModalOpen,
    setAutoSyncModalOpen,
    setOnboardingModalOpen,
    user,
    syncStatus
  } = useAppStore();

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'subscriptions', label: 'Subscriptions', icon: <Layers size={15} /> },
    { id: 'optimizer', label: 'Savings', icon: <Sparkles size={15} style={{ color: 'var(--primary)' }} /> },
    { id: 'analytics', label: 'Analytics', icon: <PieChart size={15} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={15} /> },
    { id: 'payments', label: 'Cards', icon: <CreditCard size={15} /> }
  ];

  return (
    <nav className="app-nav">
      <div className="app-nav-inner">
        {/* Left: Brand + Navigation Tabs */}
        <div className="app-nav-left">
          <span className="app-nav-brand" onClick={() => setActiveTab('subscriptions')}>
            Subtrax
          </span>

          <div className="app-nav-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`app-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions & Tools */}
        <div className="app-nav-actions">
          {/* Data & Imports Dropdown */}
          <Dropdown>
            <Dropdown.Toggle as="button" className="btn-subtle d-flex align-items-center gap-1.5" id="data-dropdown">
              <FileSpreadsheet size={13.5} />
              <span>Data</span>
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" style={{ minWidth: 240 }}>
              <Dropdown.Header style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Import & Ingestion
              </Dropdown.Header>
              <Dropdown.Item
                onClick={() => setOnboardingModalOpen(true)}
                style={{ fontSize: 12.5, padding: '7px 14px', color: 'var(--primary)', fontWeight: 600 }}
              >
                <Camera size={14} style={{ marginRight: 8, verticalAlign: -2 }} />
                <span>Fast Setup / Screenshot Scan</span>
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => setEmailScanModalOpen(true)}
                style={{ fontSize: 12.5, padding: '7px 14px' }}
              >
                <Mail size={14} style={{ marginRight: 8, verticalAlign: -2 }} />
                <span>Receipt & Email Parser</span>
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => setImportExportModalOpen(true)}
                style={{ fontSize: 12.5, padding: '7px 14px' }}
              >
                <FileSpreadsheet size={14} style={{ marginRight: 8, verticalAlign: -2 }} />
                <span>Bank Statement CSV & Backups</span>
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Header style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Demo Profiles
              </Dropdown.Header>
              {REAL_DATA_PRESETS.map(preset => (
                <Dropdown.Item
                  key={preset.id}
                  onClick={() => loadPreset(preset.id)}
                  style={{ fontSize: 12, padding: '5px 14px' }}
                >
                  <div style={{ fontWeight: 600 }}>{preset.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {preset.subscriptions.length} subs · {preset.badge}
                  </div>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          {/* Sync & Integrations Dropdown */}
          <Dropdown>
            <Dropdown.Toggle as="button" className="btn-subtle d-flex align-items-center gap-1.5" id="sync-dropdown">
              <Zap size={13.5} style={{ color: 'var(--primary)' }} />
              <span>Sync</span>
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" style={{ minWidth: 230 }}>
              <Dropdown.Header style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Integrations
              </Dropdown.Header>
              <Dropdown.Item
                onClick={() => setAutoSyncModalOpen(true)}
                style={{ fontSize: 12.5, padding: '7px 14px' }}
              >
                <Zap size={14} style={{ marginRight: 8, color: 'var(--primary)', verticalAlign: -2 }} />
                <span>Zero-Touch Auto-Sync</span>
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => setCalendarSyncModalOpen(true)}
                style={{ fontSize: 12.5, padding: '7px 14px' }}
              >
                <CalendarDays size={14} style={{ marginRight: 8, verticalAlign: -2 }} />
                <span>Apple / Google Calendar Alarms</span>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* Cloud Sync & Account */}
          <button
            className={user ? "btn-ghost d-flex align-items-center gap-1.5" : "btn-subtle d-flex align-items-center gap-1.5"}
            onClick={() => setAuthModalOpen(true)}
            title={user ? `Signed in as ${user.email} (Multi-device cloud sync)` : "Sign in to sync across devices"}
            style={user ? { padding: '4px 8px' } : {}}
          >
            {user ? (
              <>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-bg)',
                    color: 'var(--primary-text)',
                    border: '1px solid var(--primary-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 12.5, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name || user.email.split('@')[0]}
                </span>
                {syncStatus === 'syncing' ? (
                  <RefreshCw size={11} className="spin text-primary" />
                ) : (
                  <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                )}
              </>
            ) : (
              <>
                <Cloud size={13.5} style={{ color: 'var(--primary)' }} />
                <span>Cloud</span>
              </>
            )}
          </button>

          {/* Currency Switcher */}
          <Dropdown>
            <Dropdown.Toggle as="button" className="btn-ghost d-flex align-items-center gap-1" id="currency-dropdown" title="Live exchange rates">
              <span style={{ fontSize: 12.5, fontWeight: 550 }}>{currency}</span>
              {isRatesLoading && <RefreshCw size={10} className="spin" />}
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" style={{ maxHeight: 280, overflowY: 'auto' }}>
              <Dropdown.Header style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Display Currency (Live Rates)
              </Dropdown.Header>
              {CURRENCIES.map(c => (
                <Dropdown.Item key={c.code} active={c.code === currency} onClick={() => setCurrency(c.code)}>
                  {c.symbol} {c.name} ({c.code})
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          {/* Dark/Light toggle */}
          <button
            className="btn-icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Add subscription CTA */}
          <button className="btn-primary-action" onClick={openAddModal}>
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
