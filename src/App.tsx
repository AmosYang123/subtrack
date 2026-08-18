import React, { useEffect } from 'react';
import { useAppStore } from './services/store';
import { Navbar } from './components/Navbar';
import { DashboardMetrics } from './components/DashboardMetrics';
import { UpcomingAlertBanner } from './components/UpcomingAlertBanner';
import { SubscriptionFilters } from './components/SubscriptionFilters';
import { SubscriptionTable } from './components/SubscriptionTable';
import { SubscriptionGrid } from './components/SubscriptionGrid';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { RenewalsCalendar } from './components/RenewalsCalendar';
import { SubscriptionModal } from './components/SubscriptionModal';
import { EmailScanModal } from './components/EmailScanModal';
import { ImportExportModal } from './components/ImportExportModal';
import { PaymentMethodsModal } from './components/PaymentMethodsModal';
import { PaymentMethodsView } from './components/PaymentMethodsView';
import { AuthModal } from './components/AuthModal';

const App: React.FC = () => {
  const { activeTab, filters, theme } = useAppStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme === 'dark' ? 'dark' : 'light');
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
  }, [theme]);

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
    </div>
  );
};

export default App;