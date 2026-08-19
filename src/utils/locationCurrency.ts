/**
 * Location and Currency Detection Utility
 *
 * Uses multi-layered signals to determine the user's location and appropriate currency:
 * 1. Intl.DateTimeFormat().resolvedOptions().timeZone (instant, offline, zero-permission, high accuracy)
 * 2. navigator.languages / navigator.language (locale subtags)
 * 3. Optional lightweight async Geo-IP enhancement (non-blocking fallback)
 */

export interface DetectedLocation {
  countryCode: string;
  countryName: string;
  currency: string;
  symbol: string;
  flag: string;
  timezone: string;
  source: 'timezone' | 'locale' | 'geoip';
}

export interface CurrencyMeta {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  country: string;
  countryCode: string;
  decimals?: number;
}

// Global currencies with country association and flags
export const GLOBAL_CURRENCIES: CurrencyMeta[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', country: 'United States', countryCode: 'US' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', country: 'Eurozone', countryCode: 'EU' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', country: 'United Kingdom', countryCode: 'GB' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', country: 'Singapore', countryCode: 'SG' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', country: 'Canada', countryCode: 'CA' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', flag: '🇦🇺', country: 'Australia', countryCode: 'AU' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', country: 'Japan', countryCode: 'JP', decimals: 0 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', country: 'India', countryCode: 'IN' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', country: 'Switzerland', countryCode: 'CH' },
  { code: 'NZD', symbol: 'NZ$', name: 'NZ Dollar', flag: '🇳🇿', country: 'New Zealand', countryCode: 'NZ' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰', country: 'Hong Kong', countryCode: 'HK' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', country: 'China', countryCode: 'CN' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪', country: 'Sweden', countryCode: 'SE' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴', country: 'Norway', countryCode: 'NO' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰', country: 'Denmark', countryCode: 'DK' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', flag: '🇵🇱', country: 'Poland', countryCode: 'PL' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', country: 'Brazil', countryCode: 'BR' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', flag: '🇲🇽', country: 'Mexico', countryCode: 'MX' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷', country: 'South Korea', countryCode: 'KR', decimals: 0 },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', flag: '🇹🇼', country: 'Taiwan', countryCode: 'TW' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭', country: 'Thailand', countryCode: 'TH' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩', country: 'Indonesia', countryCode: 'ID', decimals: 0 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾', country: 'Malaysia', countryCode: 'MY' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭', country: 'Philippines', countryCode: 'PH' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', country: 'United Arab Emirates', countryCode: 'AE' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', country: 'Saudi Arabia', countryCode: 'SA' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', country: 'South Africa', countryCode: 'ZA' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷', country: 'Turkey', countryCode: 'TR' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', flag: '🇮🇱', country: 'Israel', countryCode: 'IL' }
];

// Timezone to Country & Currency Mapping
const TIMEZONE_TO_LOCATION: Record<string, { countryCode: string; countryName: string; currency: string; flag: string }> = {
  // Singapore & SE Asia
  'Asia/Singapore': { countryCode: 'SG', countryName: 'Singapore', currency: 'SGD', flag: '🇸🇬' },
  'Asia/Kuala_Lumpur': { countryCode: 'MY', countryName: 'Malaysia', currency: 'MYR', flag: '🇲🇾' },
  'Asia/Kuching': { countryCode: 'MY', countryName: 'Malaysia', currency: 'MYR', flag: '🇲🇾' },
  'Asia/Bangkok': { countryCode: 'TH', countryName: 'Thailand', currency: 'THB', flag: '🇹🇭' },
  'Asia/Jakarta': { countryCode: 'ID', countryName: 'Indonesia', currency: 'IDR', flag: '🇮🇩' },
  'Asia/Pontianak': { countryCode: 'ID', countryName: 'Indonesia', currency: 'IDR', flag: '🇮🇩' },
  'Asia/Makassar': { countryCode: 'ID', countryName: 'Indonesia', currency: 'IDR', flag: '🇮🇩' },
  'Asia/Jayapura': { countryCode: 'ID', countryName: 'Indonesia', currency: 'IDR', flag: '🇮🇩' },
  'Asia/Manila': { countryCode: 'PH', countryName: 'Philippines', currency: 'PHP', flag: '🇵🇭' },
  'Asia/Ho_Chi_Minh': { countryCode: 'VN', countryName: 'Vietnam', currency: 'USD', flag: '🇻🇳' },

  // East Asia
  'Asia/Tokyo': { countryCode: 'JP', countryName: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  'Asia/Seoul': { countryCode: 'KR', countryName: 'South Korea', currency: 'KRW', flag: '🇰🇷' },
  'Asia/Hong_Kong': { countryCode: 'HK', countryName: 'Hong Kong', currency: 'HKD', flag: '🇭🇰' },
  'Asia/Taipei': { countryCode: 'TW', countryName: 'Taiwan', currency: 'TWD', flag: '🇹🇼' },
  'Asia/Shanghai': { countryCode: 'CN', countryName: 'China', currency: 'CNY', flag: '🇨🇳' },
  'Asia/Chongqing': { countryCode: 'CN', countryName: 'China', currency: 'CNY', flag: '🇨🇳' },
  'Asia/Urumqi': { countryCode: 'CN', countryName: 'China', currency: 'CNY', flag: '🇨🇳' },

  // South Asia
  'Asia/Kolkata': { countryCode: 'IN', countryName: 'India', currency: 'INR', flag: '🇮🇳' },
  'Asia/Calcutta': { countryCode: 'IN', countryName: 'India', currency: 'INR', flag: '🇮🇳' },
  'Asia/Colombo': { countryCode: 'LK', countryName: 'Sri Lanka', currency: 'USD', flag: '🇱🇰' },
  'Asia/Dhaka': { countryCode: 'BD', countryName: 'Bangladesh', currency: 'USD', flag: '🇧🇩' },

  // UK & Europe
  'Europe/London': { countryCode: 'GB', countryName: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  'Europe/Belfast': { countryCode: 'GB', countryName: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  'Europe/Dublin': { countryCode: 'IE', countryName: 'Ireland', currency: 'EUR', flag: '🇮🇪' },
  'Europe/Paris': { countryCode: 'FR', countryName: 'France', currency: 'EUR', flag: '🇫🇷' },
  'Europe/Berlin': { countryCode: 'DE', countryName: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  'Europe/Amsterdam': { countryCode: 'NL', countryName: 'Netherlands', currency: 'EUR', flag: '🇳🇱' },
  'Europe/Brussels': { countryCode: 'BE', countryName: 'Belgium', currency: 'EUR', flag: '🇧🇪' },
  'Europe/Rome': { countryCode: 'IT', countryName: 'Italy', currency: 'EUR', flag: '🇮🇹' },
  'Europe/Madrid': { countryCode: 'ES', countryName: 'Spain', currency: 'EUR', flag: '🇪🇸' },
  'Europe/Lisbon': { countryCode: 'PT', countryName: 'Portugal', currency: 'EUR', flag: '🇵🇹' },
  'Europe/Vienna': { countryCode: 'AT', countryName: 'Austria', currency: 'EUR', flag: '🇦🇹' },
  'Europe/Zurich': { countryCode: 'CH', countryName: 'Switzerland', currency: 'CHF', flag: '🇨🇭' },
  'Europe/Stockholm': { countryCode: 'SE', countryName: 'Sweden', currency: 'SEK', flag: '🇸🇪' },
  'Europe/Oslo': { countryCode: 'NO', countryName: 'Norway', currency: 'NOK', flag: '🇳🇴' },
  'Europe/Copenhagen': { countryCode: 'DK', countryName: 'Denmark', currency: 'DKK', flag: '🇩🇰' },
  'Europe/Helsinki': { countryCode: 'FI', countryName: 'Finland', currency: 'EUR', flag: '🇫🇷' },
  'Europe/Warsaw': { countryCode: 'PL', countryName: 'Poland', currency: 'PLN', flag: '🇵🇱' },
  'Europe/Prague': { countryCode: 'CZ', countryName: 'Czech Republic', currency: 'EUR', flag: '🇨🇿' },
  'Europe/Athens': { countryCode: 'GR', countryName: 'Greece', currency: 'EUR', flag: '🇬🇷' },
  'Europe/Budapest': { countryCode: 'HU', countryName: 'Hungary', currency: 'EUR', flag: '🇭🇺' },
  'Europe/Bucharest': { countryCode: 'RO', countryName: 'Romania', currency: 'EUR', flag: '🇷🇴' },
  'Europe/Istanbul': { countryCode: 'TR', countryName: 'Turkey', currency: 'TRY', flag: '🇹🇷' },

  // Australia & New Zealand
  'Australia/Sydney': { countryCode: 'AU', countryName: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  'Australia/Melbourne': { countryCode: 'AU', countryName: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  'Australia/Brisbane': { countryCode: 'AU', countryName: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  'Australia/Perth': { countryCode: 'AU', countryName: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  'Australia/Adelaide': { countryCode: 'AU', countryName: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  'Australia/Hobart': { countryCode: 'AU', countryName: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  'Australia/Darwin': { countryCode: 'AU', countryName: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  'Pacific/Auckland': { countryCode: 'NZ', countryName: 'New Zealand', currency: 'NZD', flag: '🇳🇿' },
  'Pacific/Chatham': { countryCode: 'NZ', countryName: 'New Zealand', currency: 'NZD', flag: '🇳🇿' },

  // Canada
  'America/Toronto': { countryCode: 'CA', countryName: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  'America/Vancouver': { countryCode: 'CA', countryName: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  'America/Montreal': { countryCode: 'CA', countryName: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  'America/Edmonton': { countryCode: 'CA', countryName: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  'America/Calgary': { countryCode: 'CA', countryName: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  'America/Winnipeg': { countryCode: 'CA', countryName: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  'America/Halifax': { countryCode: 'CA', countryName: 'Canada', currency: 'CAD', flag: '🇨🇦' },

  // Latin America
  'America/Sao_Paulo': { countryCode: 'BR', countryName: 'Brazil', currency: 'BRL', flag: '🇧🇷' },
  'America/Recife': { countryCode: 'BR', countryName: 'Brazil', currency: 'BRL', flag: '🇧🇷' },
  'America/Fortaleza': { countryCode: 'BR', countryName: 'Brazil', currency: 'BRL', flag: '🇧🇷' },
  'America/Manaus': { countryCode: 'BR', countryName: 'Brazil', currency: 'BRL', flag: '🇧🇷' },
  'America/Mexico_City': { countryCode: 'MX', countryName: 'Mexico', currency: 'MXN', flag: '🇲🇽' },
  'America/Monterrey': { countryCode: 'MX', countryName: 'Mexico', currency: 'MXN', flag: '🇲🇽' },
  'America/Tijuana': { countryCode: 'MX', countryName: 'Mexico', currency: 'MXN', flag: '🇲🇽' },
  'America/Cancun': { countryCode: 'MX', countryName: 'Mexico', currency: 'MXN', flag: '🇲🇽' },
  'America/Bogota': { countryCode: 'CO', countryName: 'Colombia', currency: 'USD', flag: '🇨🇴' },
  'America/Santiago': { countryCode: 'CL', countryName: 'Chile', currency: 'USD', flag: '🇨🇱' },
  'America/Buenos_Aires': { countryCode: 'AR', countryName: 'Argentina', currency: 'USD', flag: '🇦🇷' },

  // Middle East & Africa
  'Asia/Dubai': { countryCode: 'AE', countryName: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪' },
  'Asia/Riyadh': { countryCode: 'SA', countryName: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦' },
  'Asia/Jerusalem': { countryCode: 'IL', countryName: 'Israel', currency: 'ILS', flag: '🇮🇱' },
  'Asia/Tel_Aviv': { countryCode: 'IL', countryName: 'Israel', currency: 'ILS', flag: '🇮🇱' },
  'Africa/Johannesburg': { countryCode: 'ZA', countryName: 'South Africa', currency: 'ZAR', flag: '🇿🇦' },
  'Africa/Cairo': { countryCode: 'EG', countryName: 'Egypt', currency: 'USD', flag: '🇪🇬' },

  // United States & Territories
  'America/New_York': { countryCode: 'US', countryName: 'United States', currency: 'USD', flag: '🇺🇸' },
  'America/Chicago': { countryCode: 'US', countryName: 'United States', currency: 'USD', flag: '🇺🇸' },
  'America/Los_Angeles': { countryCode: 'US', countryName: 'United States', currency: 'USD', flag: '🇺🇸' },
  'America/Denver': { countryCode: 'US', countryName: 'United States', currency: 'USD', flag: '🇺🇸' },
  'America/Phoenix': { countryCode: 'US', countryName: 'United States', currency: 'USD', flag: '🇺🇸' },
  'America/Detroit': { countryCode: 'US', countryName: 'United States', currency: 'USD', flag: '🇺🇸' },
  'America/Anchorage': { countryCode: 'US', countryName: 'United States', currency: 'USD', flag: '🇺🇸' },
  'Pacific/Honolulu': { countryCode: 'US', countryName: 'United States', currency: 'USD', flag: '🇺🇸' }
};

// Country Code to Primary Currency Map
const COUNTRY_CODE_TO_CURRENCY: Record<string, { currency: string; countryName: string; flag: string }> = {
  SG: { currency: 'SGD', countryName: 'Singapore', flag: '🇸🇬' },
  US: { currency: 'USD', countryName: 'United States', flag: '🇺🇸' },
  GB: { currency: 'GBP', countryName: 'United Kingdom', flag: '🇬🇧' },
  UK: { currency: 'GBP', countryName: 'United Kingdom', flag: '🇬🇧' },
  CA: { currency: 'CAD', countryName: 'Canada', flag: '🇨🇦' },
  AU: { currency: 'AUD', countryName: 'Australia', flag: '🇦🇺' },
  JP: { currency: 'JPY', countryName: 'Japan', flag: '🇯🇵' },
  IN: { currency: 'INR', countryName: 'India', flag: '🇮🇳' },
  DE: { currency: 'EUR', countryName: 'Germany', flag: '🇩🇪' },
  FR: { currency: 'EUR', countryName: 'France', flag: '🇫🇷' },
  IT: { currency: 'EUR', countryName: 'Italy', flag: '🇮🇹' },
  ES: { currency: 'EUR', countryName: 'Spain', flag: '🇪🇸' },
  NL: { currency: 'EUR', countryName: 'Netherlands', flag: '🇳🇱' },
  BE: { currency: 'EUR', countryName: 'Belgium', flag: '🇧🇪' },
  IE: { currency: 'EUR', countryName: 'Ireland', flag: '🇮🇪' },
  AT: { currency: 'EUR', countryName: 'Austria', flag: '🇦🇹' },
  CH: { currency: 'CHF', countryName: 'Switzerland', flag: '🇨🇭' },
  NZ: { currency: 'NZD', countryName: 'New Zealand', flag: '🇳🇿' },
  HK: { currency: 'HKD', countryName: 'Hong Kong', flag: '🇭🇰' },
  CN: { currency: 'CNY', countryName: 'China', flag: '🇨🇳' },
  SE: { currency: 'SEK', countryName: 'Sweden', flag: '🇸🇪' },
  NO: { currency: 'NOK', countryName: 'Norway', flag: '🇳🇴' },
  DK: { currency: 'DKK', countryName: 'Denmark', flag: '🇩🇰' },
  PL: { currency: 'PLN', countryName: 'Poland', flag: '🇵🇱' },
  BR: { currency: 'BRL', countryName: 'Brazil', flag: '🇧🇷' },
  MX: { currency: 'MXN', countryName: 'Mexico', flag: '🇲🇽' },
  KR: { currency: 'KRW', countryName: 'South Korea', flag: '🇰🇷' },
  TW: { currency: 'TWD', countryName: 'Taiwan', flag: '🇹🇼' },
  TH: { currency: 'THB', countryName: 'Thailand', flag: '🇹🇭' },
  ID: { currency: 'IDR', countryName: 'Indonesia', flag: '🇮🇩' },
  MY: { currency: 'MYR', countryName: 'Malaysia', flag: '🇲🇾' },
  PH: { currency: 'PHP', countryName: 'Philippines', flag: '🇵🇭' },
  AE: { currency: 'AED', countryName: 'United Arab Emirates', flag: '🇦🇪' },
  SA: { currency: 'SAR', countryName: 'Saudi Arabia', flag: '🇸🇦' },
  ZA: { currency: 'ZAR', countryName: 'South Africa', flag: '🇿🇦' },
  TR: { currency: 'TRY', countryName: 'Turkey', flag: '🇹🇷' },
  IL: { currency: 'ILS', countryName: 'Israel', flag: '🇮🇱' }
};

/**
 * Gets symbol for a given currency code
 */
export function getCurrencySymbol(code: string): string {
  const match = GLOBAL_CURRENCIES.find(c => c.code.toUpperCase() === code.toUpperCase());
  return match?.symbol || '$';
}

/**
 * Gets metadata for a given currency code
 */
export function getCurrencyMeta(code: string): CurrencyMeta | undefined {
  return GLOBAL_CURRENCIES.find(c => c.code.toUpperCase() === code.toUpperCase());
}

/**
 * Synchronous, instant, zero-permission location and currency detection
 * using browser Intl timezone and language signals.
 */
export function detectUserLocationAndCurrency(): DetectedLocation {
  let tz = 'UTC';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    tz = 'UTC';
  }

  // 1. Direct TimeZone match
  if (tz && TIMEZONE_TO_LOCATION[tz]) {
    const loc = TIMEZONE_TO_LOCATION[tz];
    return {
      countryCode: loc.countryCode,
      countryName: loc.countryName,
      currency: loc.currency,
      symbol: getCurrencySymbol(loc.currency),
      flag: loc.flag,
      timezone: tz,
      source: 'timezone'
    };
  }

  // 2. Region-based TimeZone inference (e.g. Europe/* -> EUR, America/* -> USD, Australia/* -> AUD)
  if (tz) {
    if (tz.startsWith('Europe/')) {
      return {
        countryCode: 'EU',
        countryName: 'Europe',
        currency: 'EUR',
        symbol: '€',
        flag: '🇪🇺',
        timezone: tz,
        source: 'timezone'
      };
    }
    if (tz.startsWith('Australia/')) {
      return {
        countryCode: 'AU',
        countryName: 'Australia',
        currency: 'AUD',
        symbol: 'AU$',
        flag: '🇦🇺',
        timezone: tz,
        source: 'timezone'
      };
    }
    if (tz.startsWith('Canada/')) {
      return {
        countryCode: 'CA',
        countryName: 'Canada',
        currency: 'CAD',
        symbol: 'CA$',
        flag: '🇨🇦',
        timezone: tz,
        source: 'timezone'
      };
    }
  }

  // 3. Browser locale inspection (e.g. en-SG, en-GB, de-DE, pt-BR, etc.)
  if (typeof navigator !== 'undefined') {
    const locales = navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language || ''];

    for (const locale of locales) {
      if (!locale) continue;
      const parts = locale.split(/[-_]/);
      if (parts.length >= 2) {
        const countryCode = parts[parts.length - 1].toUpperCase();
        if (COUNTRY_CODE_TO_CURRENCY[countryCode]) {
          const match = COUNTRY_CODE_TO_CURRENCY[countryCode];
          return {
            countryCode,
            countryName: match.countryName,
            currency: match.currency,
            symbol: getCurrencySymbol(match.currency),
            flag: match.flag,
            timezone: tz,
            source: 'locale'
          };
        }
      }
    }
  }

  // 4. Default fallback: US / USD
  return {
    countryCode: 'US',
    countryName: 'United States',
    currency: 'USD',
    symbol: '$',
    flag: '🇺🇸',
    timezone: tz,
    source: 'timezone'
  };
}

/**
 * Optional non-blocking Geo-IP lookup for additional confirmation.
 * Runs in background without blocking app startup.
 */
export async function fetchGeoIPLocation(): Promise<Partial<DetectedLocation> | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', {
      headers: { Accept: 'application/json' },
      cache: 'default'
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.country_code) {
      const countryCode = data.country_code.toUpperCase();
      const match = COUNTRY_CODE_TO_CURRENCY[countryCode];
      if (match) {
        return {
          countryCode,
          countryName: data.country_name || match.countryName,
          currency: data.currency || match.currency,
          symbol: getCurrencySymbol(data.currency || match.currency),
          flag: match.flag,
          source: 'geoip'
        };
      }
    }
  } catch {
    // Geo-IP request failed or blocked, ignore
  }
  return null;
}
