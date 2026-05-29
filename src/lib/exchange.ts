const EXCHANGE_RATE_API_BASE = 'https://v6.exchangerate-api.com/v6';
const OPEN_EXCHANGE_API_BASE = 'https://openexchangerates.org/api';

export type ExchangeRateData = {
  base: string;
  target: string;
  rate: number;
  source: 'live' | 'fallback';
};

const RATE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const rateCache = new Map<string, { data: ExchangeRateData; expiresAt: number }>();

const EUR_COUNTRIES = new Set([
  'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE',
  'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
]);

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  AU: 'AUD',
  NZ: 'NZD',
  JP: 'JPY',
  KR: 'KRW',
  CN: 'CNY',
  IN: 'INR',
  MX: 'MXN',
  BR: 'BRL',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  TR: 'TRY',
  IL: 'ILS',
  AE: 'AED',
  SA: 'SAR',
  SG: 'SGD',
  HK: 'HKD',
  TH: 'THB',
  ID: 'IDR',
  MY: 'MYR',
  PH: 'PHP',
  VN: 'VND',
  ZA: 'ZAR',
};

export function getCurrencyForLocale(locale: string): string {
  const normalized = locale?.trim();
  if (!normalized) return 'USD';

  const parts = normalized.replace('_', '-').split('-');
  const region = parts[1]?.toUpperCase();
  if (!region) return 'USD';

  if (EUR_COUNTRIES.has(region)) return 'EUR';
  return COUNTRY_TO_CURRENCY[region] ?? 'USD';
}

function cacheKey(base: string, target: string) {
  return `${base.toUpperCase()}_${target.toUpperCase()}`;
}

export async function getExchangeRate(base: string, target: string): Promise<ExchangeRateData> {
  const normalizedBase = base.toUpperCase();
  const normalizedTarget = target.toUpperCase();

  if (normalizedBase === normalizedTarget) {
    return { base: normalizedBase, target: normalizedTarget, rate: 1, source: 'fallback' };
  }

  const key = cacheKey(normalizedBase, normalizedTarget);
  const cached = rateCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const apiKey = process.env.EXCHANGE_RATES_API_KEY;
  if (!apiKey) {
    console.warn('EXCHANGE_RATES_API_KEY not set - using fallback rate 1');
    return { base: normalizedBase, target: normalizedTarget, rate: 1, source: 'fallback' };
  }

  const data =
    (await fetchFromExchangeRateApi(normalizedBase, normalizedTarget, apiKey)) ??
    (await fetchFromOpenExchangeRates(normalizedBase, normalizedTarget, apiKey));

  if (!data) {
    return { base: normalizedBase, target: normalizedTarget, rate: 1, source: 'fallback' };
  }

  rateCache.set(key, { data, expiresAt: Date.now() + RATE_TTL_MS });
  return data;
}

async function fetchFromExchangeRateApi(
  base: string,
  target: string,
  apiKey: string
): Promise<ExchangeRateData | null> {
  try {
    const url = `${EXCHANGE_RATE_API_BASE}/${apiKey}/latest/${base}`;
    const res = await fetch(url, { next: { revalidate: 43200 } });
    if (!res.ok) return null;
    const json = await res.json();
    const rate = json?.conversion_rates?.[target];
    if (!rate) return null;
    return { base, target, rate, source: 'live' };
  } catch (err) {
    console.error('ExchangeRate-API fetch error:', err);
    return null;
  }
}

async function fetchFromOpenExchangeRates(
  base: string,
  target: string,
  apiKey: string
): Promise<ExchangeRateData | null> {
  try {
    // Free plan supports USD base only.
    const effectiveBase = base === 'USD' ? base : 'USD';
    const url = `${OPEN_EXCHANGE_API_BASE}/latest.json?app_id=${apiKey}&base=${effectiveBase}`;
    const res = await fetch(url, { next: { revalidate: 43200 } });
    if (!res.ok) return null;
    const json = await res.json();
    const rate = json?.rates?.[target];
    if (!rate) return null;
    const finalRate = effectiveBase === base ? rate : rate / (json?.rates?.[base] ?? 1);
    return { base, target, rate: finalRate, source: 'live' };
  } catch (err) {
    console.error('OpenExchangeRates fetch error:', err);
    return null;
  }
}
