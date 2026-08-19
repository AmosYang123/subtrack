// Live Currency Exchange Rates API service
// Uses open.er-api.com (free, open, no API key required) with localStorage caching

export interface ExchangeRatesData {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
}

const CACHE_KEY_PREFIX = 'subtrack_exchange_rates_';
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
  NOK: 10.85,
  DKK: 6.88,
  PLN: 3.96,
  BRL: 5.15,
  MXN: 16.95,
  KRW: 1370.0,
  TWD: 32.4,
  THB: 36.8,
  IDR: 16200.0,
  MYR: 4.72,
  PHP: 58.2,
  AED: 3.67,
  SAR: 3.75,
  ZAR: 18.4,
  TRY: 32.5,
  ILS: 3.72
};

// In-flight request deduplication map to prevent duplicate burst requests
const inFlightRequests = new Map<string, Promise<ExchangeRatesData>>();

export async function fetchLiveExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRatesData> {
  const normBase = (baseCurrency || 'USD').toUpperCase();
  const cacheKey = `${CACHE_KEY_PREFIX}${normBase}`;

  // Check cached rates first
  try {
    const cached = localStorage.getItem(cacheKey);
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

  // Deduplicate in-flight requests for the same base currency
  if (inFlightRequests.has(normBase)) {
    return inFlightRequests.get(normBase)!;
  }

  const fetchPromise = (async (): Promise<ExchangeRatesData> => {
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${normBase}`, {
        cache: 'default'
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.result === 'success' && data.rates) {
          const ratesData: ExchangeRatesData = {
            base: normBase,
            rates: data.rates,
            lastUpdated: new Date().toISOString()
          };
          try {
            localStorage.setItem(cacheKey, JSON.stringify(ratesData));
          } catch {
            // localStorage write failed (quota), ignore
          }
          return ratesData;
        }
      }
    } catch (err) {
      console.warn('Could not fetch live exchange rates, using fallback:', err);
    } finally {
      inFlightRequests.delete(normBase);
    }

    // Fallback if offline or API error
    return {
      base: normBase,
      rates: FALLBACK_RATES,
      lastUpdated: new Date().toISOString()
    };
  })();

  inFlightRequests.set(normBase, fetchPromise);
  return fetchPromise;
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
