// Live Currency Exchange Rates API service
// Uses open.er-api.com (free, open, no API key required) with localStorage caching

export interface ExchangeRatesData {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
}

const CACHE_KEY = 'subtrack_exchange_rates_v1';
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

// Static fallback rates (relative to USD) in case network is offline
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 154.5,
  INR: 83.4,
  SGD: 1.35,
  CHF: 0.91,
  NZD: 1.66,
  CNY: 7.24,
  HKD: 7.82,
  SEK: 10.65,
  BRL: 5.15
};

export async function fetchLiveExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRatesData> {
  // Check cached rates first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as ExchangeRatesData;
      const age = Date.now() - new Date(parsed.lastUpdated).getTime();
      if (age < CACHE_DURATION_MS && parsed.rates && Object.keys(parsed.rates).length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read exchange rate cache:', e);
  }

  // Fetch live rates from public API
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`, {
      cache: 'default'
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.result === 'success' && data.rates) {
        const ratesData: ExchangeRatesData = {
          base: baseCurrency,
          rates: data.rates,
          lastUpdated: new Date().toISOString()
        };
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(ratesData));
        } catch {
          // localStorage write failed (quota), ignore
        }
        return ratesData;
      }
    }
  } catch (err) {
    console.warn('Could not fetch live exchange rates, using fallback:', err);
  }

  // Fallback if offline or API error
  return {
    base: baseCurrency,
    rates: FALLBACK_RATES,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Converts an amount from one currency to another using exchange rates.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = FALLBACK_RATES
): number {
  if (fromCurrency === toCurrency || !amount) return amount;

  const fromRate = rates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1;
  const toRate = rates[toCurrency] || FALLBACK_RATES[toCurrency] || 1;

  // Convert to USD base first, then to target currency
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}
