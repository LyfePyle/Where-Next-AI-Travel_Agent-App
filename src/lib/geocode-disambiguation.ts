/**
 * Known ambiguous place names that collide with unrelated hamlets worldwide.
 * Keys are normalized lowercase city names; values are canonical country names
 * for geocoding queries (e.g. "Penang, Malaysia" not bare "Penang").
 */

const CITY_COUNTRY_OVERRIDES: Record<string, string> = {
  penang: 'Malaysia',
  'pulau pinang': 'Malaysia',
  'george town': 'Malaysia',
  langkawi: 'Malaysia',
  malacca: 'Malaysia',
  melaka: 'Malaysia',
  ipoh: 'Malaysia',
  'kuala lumpur': 'Malaysia',
};

/** Last-segment labels that look like countries in "City, X" but are not. */
const NON_COUNTRY_PLACE_NAMES = new Set([
  'penang',
  'pulau pinang',
  'selangor',
  'johor',
  'sabah',
  'sarawak',
  'malacca',
  'melaka',
  'bali',
  'java',
  'jawa',
  'yogyakarta',
  'lombardy',
  'tuscany',
  'bavaria',
  'catalonia',
  'queensland',
  'ontario',
  'california',
  'texas',
  'florida',
]);

const US_STATE_CODES = new Set([
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks',
  'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny',
  'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv',
  'wi', 'wy', 'dc',
]);

export function normalizePlaceKey(name: string): string {
  return name.trim().toLowerCase();
}

export function disambiguatedCountry(city: string): string | undefined {
  return CITY_COUNTRY_OVERRIDES[normalizePlaceKey(city)];
}

/** Whether a comma-suffix or stored country field is plausibly a country name. */
export function isLikelyCountryName(label: string): boolean {
  const key = normalizePlaceKey(label);
  if (!key || key.length < 3) return false;
  if (NON_COUNTRY_PLACE_NAMES.has(key)) return false;
  if (disambiguatedCountry(label)) return false;
  if (US_STATE_CODES.has(key)) return false;
  return true;
}

/** Pick the most common explicit country among sibling stops. */
export function majorityTripCountry(countries: string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const raw of countries) {
    const c = raw.trim();
    if (!c || !isLikelyCountryName(c)) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  if (counts.size === 0) return undefined;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Resolve the country string to pass into geocoding for a city/stop.
 * Order: explicit valid country → disambiguation table → sibling majority.
 */
export function resolveGeocodeCountry(
  city: string,
  explicitCountry?: string,
  siblingCountries: string[] = []
): string | undefined {
  // Known ambiguous cities always win — avoids "Penang" + country "Indonesia" from AI.
  const fromCity = disambiguatedCountry(city);
  if (fromCity) return fromCity;

  const explicit = explicitCountry?.trim();
  if (explicit && isLikelyCountryName(explicit)) return explicit;

  const fromSiblings = majorityTripCountry(siblingCountries);
  if (fromSiblings) return fromSiblings;

  return explicit || undefined;
}
