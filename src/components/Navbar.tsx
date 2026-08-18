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
  CheckCircle2
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
    user,
    syncStatus
  } = useAppStore();

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'subscriptions', label: 'Subscriptions', icon: <Layers size={15} /> },
    { id: 'analytics', label: 'Analytics', icon: <PieChart size={15} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={15} /> },
    { id: 'payments', label: 'Cards', icon: <CreditCard size={15} /> }
  ];

  return (
    <nav className="app-nav">
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

      <div className="app-nav-actions">
        {/* Real Profiles / Datasets Dropdown */}
        <Dropdown>
          <Dropdown.Toggle as="button" className="btn-ghost d-flex align-items-center gap-1" id="presets-dropdown">
            <Sparkles size={13} style={{ color: 'var(--text-secondary)' }} />
            <span>Profiles</span>
          </Dropdown.Toggle>
          <Dropdown.Menu align="end" style={{ minWidth: 220 }}>
            <Dropdown.Header style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Real-World Datasets
            </Dropdown.Header>
            {REAL_DATA_PRESETS.map(preset => (
              <Dropdown.Item
                key={preset.id}
                onClick={() => loadPreset(preset.id)}
                style={{ fontSize: 12.5, padding: '6px 14px' }}
              >
                <div style={{ fontWeight: 600 }}>{preset.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {preset.subscriptions.length} subs · {preset.badge}
                </div>
              </Dropdown.Item>
            ))}
            <Dropdown.Divider />
            <Dropdown.Item
              onClick={() => setImportExportModalOpen(true)}
              style={{ fontSize: 12.5, padding: '6px 14px', color: 'var(--primary)' }}
            >
              <FileSpreadsheet size={13} style={{ marginRight: 6 }} />
              <span>Import bank statement / CSV...</span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {/* Currency Switcher with live rate status */}
        <Dropdown>
          <Dropdown.Toggle as="button" className="btn-ghost d-flex align-items-center gap-1" id="currency-dropdown" title="Live exchange rates active">
            <span>{currency}</span>
            {isRatesLoading && <RefreshCw size={11} className="spin" />}
          </Dropdown.Toggle>
          <Dropdown.Menu align="end">
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
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Cloud Sync & Account */}
        <button
          className={user ? "btn-ghost d-flex align-items-center gap-1.5" : "btn-subtle d-flex align-items-center gap-1.5"}
          onClick={() => setAuthModalOpen(true)}
          title={user ? `Signed in as ${user.email} (Click for multi-device sync)` : "Sign in to sync across laptop & phone"}
          style={user ? { padding: '4px 8px' } : {}}
        >
          {user ? (
            <>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
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
              <Cloud size={14} style={{ color: 'var(--primary)' }} />
              <span>Cloud Sync</span>
            </>
          )}
        </button>

        {/* Data & Imports */}
        <button className="btn-subtle" onClick={() => setImportExportModalOpen(true)} title="Import bank statements, CSV, or manage backup">
          <FileSpreadsheet size={14} />
          <span>Data</span>
        </button>

        {/* Receipt Parser */}
        <button className="btn-subtle" onClick={() => setEmailScanModalOpen(true)} title="Parse email confirmation or paste receipt">
          <Mail size={14} />
          <span>Receipt scan</span>
        </button>

        {/* Add subscription */}
        <button className="btn-primary-action" onClick={openAddModal}>
          <Plus size={15} />
          <span>Add</span>
        </button>
      </div>
    </nav>
  );
};
