/**
 * Shared place geocoding: OpenWeather first (fast for major cities), Nominatim fallback
 * (better long-tail coverage for villages, neighborhoods, small islands).
 */

import {
  ambiguousCityDefaultCountry,
  disambiguatedCountry,
  isLikelyCountryName,
  normalizePlaceKey,
} from '@/lib/geocode-disambiguation';

export interface GeocodeResult {
  name: string;
  country: string;
  countryCode?: string;
  lat: number;
  lon: number;
  source: 'openweather' | 'nominatim';
}

export interface PlaceCandidate extends GeocodeResult {
  score: number;
}

const regionDisplay =
  typeof Intl !== 'undefined' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;

function displayCountry(country: string, countryCode?: string): string {
  if (country.trim().length > 2) return country.trim();
  const code = (countryCode ?? (country.length === 2 ? country : '')).toUpperCase();
  if (code && regionDisplay) {
    return regionDisplay.of(code) ?? country;
  }
  return country;
}

function candidateKey(name: string, country: string, countryCode?: string): string {
  const code = (countryCode ?? country).toLowerCase();
  return `${normalizePlaceKey(name)}|${code.slice(0, 2)}`;
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
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) return true;
  return false;
}

function isoNameMatches(requested: string, iso: string): boolean {
  if (!iso || iso.length !== 2 || !regionDisplay) return false;
  const named = regionDisplay.of(iso.toUpperCase());
  if (!named) return false;
  const name = normalize(named);
  return name === requested || name.includes(requested) || requested.includes(name);
}

export function countryMatches(
  requested: string | undefined,
  foundCountry: string | undefined,
  foundCode: string | undefined
): boolean {
  if (!requested?.trim()) return true;
  const req = normalize(requested);
  const country = normalize(foundCountry ?? '');
  const code = (foundCode ?? '').toLowerCase();

  // Never substring-match a 2-letter ISO against a full name ("co" in "costa rica").
  if (country.length === 2) {
    if (req.length === 2 && country === req) return true;
    if (isoNameMatches(req, country)) return true;
  } else if (
    country &&
    (country === req ||
      (country.length >= 4 && country.includes(req)) ||
      (req.length >= 4 && req.includes(country)))
  ) {
    return true;
  }
  if (code && req.length === 2 && code === req) return true;
  if (code && isoNameMatches(req, code)) return true;
  return false;
}

interface NominatimRow {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  place_rank?: number;
  class?: string;
  type?: string;
  importance?: number;
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

function nominatimScore(row: NominatimRow, city: string, country?: string): number {
  let score = 0;
  const placeName = nameFromNominatim(row, city);
  const cityKey = normalizePlaceKey(city);
  const nameKey = normalizePlaceKey(row.name ?? '');

  if (nameKey === cityKey) score += 120;
  else if (namesMatch(city, placeName)) score += 80;

  const rank = row.place_rank ?? 30;
  score += Math.max(0, 28 - rank);

  const importance = row.importance ?? 0;
  score += importance * 15;

  const addr = row.address;
  if (country && countryMatches(country, addr?.country, addr?.country_code)) {
    score += 250;
  } else if (country) {
    score -= 120;
  }

  if (row.type === 'hamlet' || row.type === 'isolated_dwelling') score -= 100;
  if (row.class === 'shop' || row.class === 'building') score -= 120;
  if (row.class === 'boundary' && (row.type === 'administrative' || row.type === 'state')) {
    score += 40;
  }
  if (row.class === 'place' && (row.type === 'city' || row.type === 'town')) score += 30;

  return score;
}

function pickBestNominatimRow(rows: NominatimRow[], city: string, country?: string): NominatimRow {
  return rows.reduce((best, row) =>
    nominatimScore(row, city, country) > nominatimScore(best, city, country) ? row : best
  );
}

function openWeatherScore(
  row: { name: string; country: string; lat: number; lon: number },
  city: string,
  country?: string
): number {
  let score = 0;
  const cityKey = normalizePlaceKey(city);
  const nameKey = normalizePlaceKey(row.name);

  if (nameKey === cityKey) score += 120;
  else if (namesMatch(city, row.name)) score += 60;

  if (country && row.country.length === 2) {
    const code = row.country.toLowerCase();
    if (countryMatches(country, undefined, code)) score += 200;
    else score -= 150;
  }

  return score;
}

function pickBestOpenWeatherRow(
  rows: Array<{ name: string; country: string; lat: number; lon: number }>,
  city: string,
  country?: string
) {
  return rows.reduce((best, row) =>
    openWeatherScore(row, city, country) > openWeatherScore(best, city, country) ? row : best
  );
}

export async function geocodeOpenWeather(
  place: string,
  country?: string
): Promise<GeocodeResult | null> {
  const city = place.trim();
  if (!city) return null;

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  const resolvedCountry = country?.trim() || disambiguatedCountry(city);
  const query = resolvedCountry ? `${city},${resolvedCountry}` : city;
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

    const match = pickBestOpenWeatherRow(data, city, resolvedCountry);
    const matchCode = match.country.length === 2 ? match.country : undefined;
    if (
      resolvedCountry &&
      isLikelyCountryName(resolvedCountry) &&
      !countryMatches(resolvedCountry, match.country, matchCode)
    ) {
      return null;
    }

    return {
      name: match.name,
      country: match.country.length === 2 ? resolvedCountry || match.country : match.country,
      countryCode: matchCode,
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

  const resolvedCountry = country?.trim() || disambiguatedCountry(city);
  const query = resolvedCountry ? `${city}, ${resolvedCountry}` : city;
  const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(query)}&format=json&limit=8&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': NOMINATIM_USER_AGENT },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as NominatimRow[];
    if (!Array.isArray(data) || data.length === 0) return null;

    const countryTrimmed = resolvedCountry;
    const filtered =
      countryTrimmed && isLikelyCountryName(countryTrimmed)
        ? data.filter((row) =>
            countryMatches(countryTrimmed, row.address?.country, row.address?.country_code)
          )
        : data;

    const candidates = filtered.length > 0 ? filtered : data;
    const match = pickBestNominatimRow(candidates, city, countryTrimmed);

    const addr = match.address;
    const name = nameFromNominatim(match, city);
    const resolvedCountryName = addr?.country ?? countryTrimmed ?? '';

    return {
      name,
      country: resolvedCountryName || countryTrimmed || '',
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
  const resolvedCountry = country?.trim() || disambiguatedCountry(place.trim());
  const ow = await geocodeOpenWeather(place, resolvedCountry);
  if (
    ow &&
    (!resolvedCountry ||
      !isLikelyCountryName(resolvedCountry) ||
      countryMatches(resolvedCountry, ow.country, ow.countryCode))
  ) {
    return ow;
  }
  return geocodeNominatim(place, resolvedCountry);
}

async function searchOpenWeatherCandidates(
  place: string,
  country?: string
): Promise<PlaceCandidate[]> {
  const city = place.trim();
  if (!city) return [];

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return [];

  const resolvedCountry = country?.trim() || disambiguatedCountry(city);
  const query = resolvedCountry ? `${city},${resolvedCountry}` : city;
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];

    const data = (await res.json()) as Array<{
      name: string;
      country: string;
      lat: number;
      lon: number;
    }>;
    if (!Array.isArray(data) || data.length === 0) return [];

    return data.map((row) => {
      const countryCode = row.country.length === 2 ? row.country : undefined;
      const countryName = displayCountry(
        resolvedCountry || row.country,
        countryCode
      );
      return {
        name: row.name,
        country: countryName,
        countryCode,
        lat: row.lat,
        lon: row.lon,
        source: 'openweather' as const,
        score: openWeatherScore(row, city, resolvedCountry),
      };
    });
  } catch {
    return [];
  }
}

async function searchNominatimCandidates(
  place: string,
  country?: string
): Promise<PlaceCandidate[]> {
  const city = place.trim();
  if (!city) return [];

  const resolvedCountry = country?.trim() || disambiguatedCountry(city);
  const query = resolvedCountry ? `${city}, ${resolvedCountry}` : city;
  const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(query)}&format=json&limit=8&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': NOMINATIM_USER_AGENT },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as NominatimRow[];
    if (!Array.isArray(data) || data.length === 0) return [];

    const countryTrimmed = resolvedCountry;
    const filtered =
      countryTrimmed && isLikelyCountryName(countryTrimmed)
        ? data.filter((row) =>
            countryMatches(countryTrimmed, row.address?.country, row.address?.country_code)
          )
        : data;

    const candidates = filtered.length > 0 ? filtered : data;
    return candidates.map((row) => {
      const addr = row.address;
      const name = nameFromNominatim(row, city);
      const countryName = displayCountry(
        addr?.country ?? countryTrimmed ?? '',
        addr?.country_code?.toUpperCase()
      );
      return {
        name,
        country: countryName,
        countryCode: addr?.country_code?.toUpperCase(),
        lat: parseFloat(row.lat),
        lon: parseFloat(row.lon),
        source: 'nominatim' as const,
        score: nominatimScore(row, city, countryTrimmed),
      };
    });
  } catch (err) {
    console.warn(`searchNominatimCandidates failed for "${query}":`, err);
    return [];
  }
}

function mergeCandidates(lists: PlaceCandidate[][]): PlaceCandidate[] {
  const merged = new Map<string, PlaceCandidate>();
  for (const candidate of lists.flat()) {
    if (candidate.score < 40) continue;
    const key = candidateKey(candidate.name, candidate.country, candidate.countryCode);
    const existing = merged.get(key);
    if (!existing || candidate.score > existing.score) {
      merged.set(key, candidate);
    }
  }
  return [...merged.values()].sort((a, b) => b.score - a.score);
}

/** Search geocoders and merge ranked place candidates (for bare-city disambiguation). */
export async function searchPlaceCandidates(
  place: string,
  country?: string
): Promise<PlaceCandidate[]> {
  const city = place.trim();
  if (!city) return [];

  const resolvedCountry = country?.trim() || disambiguatedCountry(city);
  const searches: Promise<PlaceCandidate[]>[] = [
    searchOpenWeatherCandidates(city, resolvedCountry),
    searchNominatimCandidates(city, resolvedCountry),
  ];

  // Homonyms like Liberia (country vs Costa Rica city): also search the
  // travel-app default so both sides show up in "did you mean".
  const soft = !country?.trim() && !resolvedCountry ? ambiguousCityDefaultCountry(city) : undefined;
  if (soft) {
    searches.push(
      searchOpenWeatherCandidates(city, soft),
      searchNominatimCandidates(city, soft)
    );
  }

  const lists = await Promise.all(searches);
  return mergeCandidates(lists);
}
