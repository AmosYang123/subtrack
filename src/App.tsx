import React, { useEffect } from 'react';
import { useAppStore } from './services/store';
import { Navbar } from './components/Navbar';
import { DashboardMetrics } from './components/DashboardMetrics';
import { UpcomingAlertBanner } from './components/UpcomingAlertBanner';
import { SubscriptionFilters } from './components/SubscriptionFilters';
import { SubscriptionTable } from './components/SubscriptionTable';
import { SubscriptionGrid } from './components/SubscriptionGrid';
import { MoneySaverView } from './components/MoneySaverView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { RenewalsCalendar } from './components/RenewalsCalendar';
import { SubscriptionModal } from './components/SubscriptionModal';
import { EmailScanModal } from './components/EmailScanModal';
import { ImportExportModal } from './components/ImportExportModal';
import { PaymentMethodsModal } from './components/PaymentMethodsModal';
import { PaymentMethodsView } from './components/PaymentMethodsView';
import { AuthModal } from './components/AuthModal';
import { CalendarSyncModal } from './components/CalendarSyncModal';
import { AutoSyncModal } from './components/AutoSyncModal';
import { listenForAutoSyncCaptures, parseAutoAddUrlQuery } from './utils/autoSyncConnector';

const App: React.FC = () => {
  const { activeTab, filters, theme, addSubscription } = useAppStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme === 'dark' ? 'dark' : 'light');
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
  }, [theme]);

  // Handle 1-click Auto-Sync url query or background capture
  useEffect(() => {
    const handleAdd = (payload: any) => {
      addSubscription({
        name: payload.serviceName,
        amount: payload.amount || 9.99,
        currency: payload.currency || 'USD',
        billingCycle: payload.billingCycle || 'monthly',
        nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        category: payload.category || 'Software',
        cancelUrl: payload.cancelUrl,
        websiteUrl: payload.url,
        notes: `Auto-captured via Zero-Touch background sync (${payload.source})`,
        status: 'active'
      });
    };

    // 1. Check URL query (?auto_add=...)
    const urlPayload = parseAutoAddUrlQuery();
    if (urlPayload) {
      handleAdd(urlPayload);
    }

    // 2. Listen for same-window / local captures
    const cleanup = listenForAutoSyncCaptures(handleAdd);
    return () => cleanup();
  }, [addSubscription]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '24px 28px', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
        {/* Metrics + alert only on subscriptions tab */}
        {activeTab === 'subscriptions' && (
          <>
            <DashboardMetrics />
            <UpcomingAlertBanner />
          </>
        )}

        {activeTab === 'subscriptions' && (
          <div>
            <SubscriptionFilters />
            {filters.viewMode === 'table' ? <SubscriptionTable /> : <SubscriptionGrid />}
          </div>
        )}

        {activeTab === 'optimizer' && <MoneySaverView />}

        {activeTab === 'analytics' && <AnalyticsDashboard />}

        {activeTab === 'calendar' && <RenewalsCalendar />}

        {activeTab === 'payments' && <PaymentMethodsView />}
      </main>

      {/* Modals */}
      <SubscriptionModal />
      <EmailScanModal />
      <ImportExportModal />
      <PaymentMethodsModal />
      <AuthModal />
      <CalendarSyncModal />
      <AutoSyncModal />
    </div>
  );
};

export default App;