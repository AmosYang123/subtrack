import React from 'react';
import { Sparkles, MapPin, X, ArrowRight } from 'lucide-react';
import { useAppStore } from '../services/store';

export const LocationCurrencyPrompt: React.FC = () => {
  const {
    detectedLocation,
    currency,
    locationPromptDismissed,
    isCurrencyExplicitlySet,
    applyDetectedCurrency,
    dismissLocationPrompt
  } = useAppStore();

  // Only show if detected location currency differs from currently active workspace currency,
  // and user hasn't explicitly dismissed it or chosen a custom currency.
  if (
    !detectedLocation ||
    detectedLocation.currency === currency ||
    locationPromptDismissed ||
    isCurrencyExplicitlySet
  ) {
    return null;
  }

  return (
    <div
      className="location-currency-prompt animate-slide-down"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '10px 16px',
        marginBottom: 18,
        borderRadius: 'var(--radius)',
        backgroundColor: 'var(--primary-bg)',
        border: '1px solid var(--primary-border)',
        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.08)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }} role="img" aria-label={detectedLocation.countryName}>
          {detectedLocation.flag}
        </span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 650, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>We noticed you're in {detectedLocation.countryName}</span>
            <span
              style={{
                fontSize: 10.5,
                padding: '1px 6px',
                borderRadius: 100,
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                fontWeight: 700
              }}
            >
              Auto-detected
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
            Would you like to switch your display currency to <strong>{detectedLocation.currency} ({detectedLocation.symbol})</strong> with live exchange rates?
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          className="btn-primary-action"
          style={{ fontSize: 12, padding: '5px 12px', height: 'auto' }}
          onClick={applyDetectedCurrency}
        >
          <Sparkles size={13} />
          <span>Switch to {detectedLocation.currency}</span>
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ fontSize: 12, padding: '5px 10px', height: 'auto', color: 'var(--text-muted)' }}
          onClick={dismissLocationPrompt}
        >
          Keep {currency}
        </button>

        <button
          type="button"
          className="btn-icon"
          style={{ width: 26, height: 26, color: 'var(--text-muted)' }}
          onClick={dismissLocationPrompt}
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
