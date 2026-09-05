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

/**
 * City names that also collide with a country or a place on another continent.
 * Unlike CITY_COUNTRY_OVERRIDES these must NOT win over an explicit country
 * (e.g. "Liberia" the country vs Liberia, Costa Rica).
 */
const AMBIGUOUS_CITY_DEFAULTS: Record<string, string> = {
  liberia: 'Costa Rica',
  monteverde: 'Costa Rica',
  arenal: 'Costa Rica',
  'la fortuna': 'Costa Rica',
  dominical: 'Costa Rica',
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
  'guanacaste',
  'puntarenas',
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

/** Default country for an ambiguous city when no explicit/sibling country is set. */
export function ambiguousCityDefaultCountry(city: string): string | undefined {
  return AMBIGUOUS_CITY_DEFAULTS[normalizePlaceKey(city)];
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
 * Hard overrides (Penang) always win. Names that collide with a country
 * (Liberia) prefer sibling-trip context, then an explicit *other* country,
 * then a Costa Rica default — unless the user clearly meant the country
 * (explicit country === city name, no other-country siblings).
 */
export function resolveGeocodeCountry(
  city: string,
  explicitCountry?: string,
  siblingCountries: string[] = []
): string | undefined {
  const fromCity = disambiguatedCountry(city);
  if (fromCity) return fromCity;

  const cityKey = normalizePlaceKey(city);
  const ambiguousDefault = ambiguousCityDefaultCountry(city);
  const fromSiblings = majorityTripCountry(siblingCountries);
  const explicit = explicitCountry?.trim();

  if (ambiguousDefault) {
    if (fromSiblings && normalizePlaceKey(fromSiblings) !== cityKey) {
      return fromSiblings;
    }
    if (explicit && isLikelyCountryName(explicit) && normalizePlaceKey(explicit) !== cityKey) {
      return explicit;
    }
    if (explicit && isLikelyCountryName(explicit) && normalizePlaceKey(explicit) === cityKey) {
      return explicit;
    }
    return ambiguousDefault;
  }

  if (explicit && isLikelyCountryName(explicit)) return explicit;
  if (fromSiblings) return fromSiblings;
  return explicit || undefined;
}
