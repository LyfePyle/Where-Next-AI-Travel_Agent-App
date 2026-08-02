/**
 * Shared place geocoding: OpenWeather first (fast for major cities), Nominatim fallback
 * (better long-tail coverage for villages, neighborhoods, small islands).
 */

export interface GeocodeResult {
  name: string;
  country: string;
  countryCode?: string;
  lat: number;
  lon: number;
  source: 'openweather' | 'nominatim';
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_USER_AGENT = 'WhereNext-Travel-App/1.0';

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function namesMatch(requested: string, found: string): boolean {
  const a = normalize(requested);
  const b = normalize(found);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function countryMatches(
  requested: string | undefined,
  foundCountry: string | undefined,
  foundCode: string | undefined
): boolean {
  if (!requested?.trim()) return true;
  const req = normalize(requested);
  const country = normalize(foundCountry ?? '');
  const code = (foundCode ?? '').toLowerCase();

  if (country && (country === req || country.includes(req) || req.includes(country))) {
    return true;
  }
  if (code && req.length >= 2 && code === req.slice(0, 2)) return true;
  return false;
}

interface NominatimRow {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

function nameFromNominatim(row: NominatimRow, requested: string): string {
  const addr = row.address;
  const candidates = [
    row.name,
    addr?.city,
    addr?.town,
    addr?.village,
    addr?.municipality,
    row.display_name?.split(',')[0],
  ].filter(Boolean) as string[];

  const match = candidates.find((c) => namesMatch(requested, c));
  return match ?? candidates[0] ?? requested;
}

export async function geocodeOpenWeather(
  place: string,
  country?: string
): Promise<GeocodeResult | null> {
  const city = place.trim();
  if (!city) return null;

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  const query = country?.trim() ? `${city},${country.trim()}` : city;
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const data = (await res.json()) as Array<{
      name: string;
      country: string;
      lat: number;
      lon: number;
    }>;

    if (!Array.isArray(data) || data.length === 0) return null;

    const cityLower = city.toLowerCase();
    const match =
      data.find(
        (d) =>
          d.name.toLowerCase() === cityLower ||
          d.name.toLowerCase().includes(cityLower) ||
          cityLower.includes(d.name.toLowerCase())
      ) ?? data[0];

    return {
      name: match.name,
      country: match.country.length === 2 ? country?.trim() || match.country : match.country,
      countryCode: match.country.length === 2 ? match.country : undefined,
      lat: match.lat,
      lon: match.lon,
      source: 'openweather',
    };
  } catch {
    return null;
  }
}

export async function geocodeNominatim(
  place: string,
  country?: string
): Promise<GeocodeResult | null> {
  const city = place.trim();
  if (!city) return null;

  const query = country?.trim() ? `${city}, ${country.trim()}` : city;
  const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': NOMINATIM_USER_AGENT },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as NominatimRow[];
    if (!Array.isArray(data) || data.length === 0) return null;

    const countryTrimmed = country?.trim();
    const match =
      data.find((row) => {
        const addr = row.address;
        const placeName = nameFromNominatim(row, city);
        return (
          namesMatch(city, placeName) &&
          countryMatches(countryTrimmed, addr?.country, addr?.country_code)
        );
      }) ??
      data.find((row) => namesMatch(city, nameFromNominatim(row, city))) ??
      data[0];

    const addr = match.address;
    const name = nameFromNominatim(match, city);
    const resolvedCountry = addr?.country ?? countryTrimmed ?? '';

    return {
      name,
      country: resolvedCountry || countryTrimmed || '',
      countryCode: addr?.country_code?.toUpperCase(),
      lat: parseFloat(match.lat),
      lon: parseFloat(match.lon),
      source: 'nominatim',
    };
  } catch (err) {
    console.warn(`geocodeNominatim failed for "${query}":`, err);
    return null;
  }
}

/** Try OpenWeather, then Nominatim. Returns null only if both miss. */
export async function resolvePlace(
  place: string,
  country?: string
): Promise<GeocodeResult | null> {
  const ow = await geocodeOpenWeather(place, country);
  if (ow) return ow;
  return geocodeNominatim(place, country);
}
