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
  /** Admin region from the geocoder (OpenWeather state, Nominatim state). */
  state?: string;
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

function candidateKey(
  name: string,
  country: string,
  countryCode?: string,
  state?: string
): string {
  const code = (countryCode ?? country).toLowerCase();
  const region = normalizePlaceKey(state ?? '');
  return `${normalizePlaceKey(name)}|${code.slice(0, 2)}|${region}`;
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

/** Great-circle distance in kilometres. */
export function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
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

interface OpenWeatherHit {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

/**
 * Exact name is +120 and a partial name ("Oaxaca City" for "oaxaca") is +60.
 * OpenWeather already sorts by prominence, so a later exact-name hamlet must
 * not beat the first hit when that first hit actually matches the query.
 */
const OPENWEATHER_FIRST_MATCH_TIEBREAK = 70;
/** Nominatim and an OpenWeather hit are the same place inside this radius. */
const SAME_PLACE_KM = 100;

function openWeatherScore(
  row: { name: string; country: string; lat: number; lon: number },
  city: string,
  country: string | undefined,
  index: number
): number {
  let score = 0;
  const cityKey = normalizePlaceKey(city);
  const nameKey = normalizePlaceKey(row.name);
  const exact = nameKey === cityKey;
  const partial = !exact && namesMatch(city, row.name);

  if (exact) score += 120;
  else if (partial) score += 60;

  if (index === 0 && (exact || partial)) score += OPENWEATHER_FIRST_MATCH_TIEBREAK;

  if (country && row.country.length === 2) {
    const code = row.country.toLowerCase();
    if (countryMatches(country, undefined, code)) score += 200;
    else score -= 150;
  }

  return score;
}

function pickBestOpenWeatherRow(
  rows: OpenWeatherHit[],
  city: string,
  country?: string
): { row: OpenWeatherHit; index: number } {
  let best = rows[0];
  let bestIndex = 0;
  let bestScore = openWeatherScore(rows[0], city, country, 0);
  for (let i = 1; i < rows.length; i++) {
    const score = openWeatherScore(rows[i], city, country, i);
    if (score > bestScore) {
      best = rows[i];
      bestIndex = i;
      bestScore = score;
    }
  }
  return { row: best, index: bestIndex };
}

function toOpenWeatherResult(match: OpenWeatherHit, resolvedCountry?: string): GeocodeResult {
  const matchCode = match.country.length === 2 ? match.country : undefined;
  return {
    name: match.name,
    country: match.country.length === 2 ? resolvedCountry || match.country : match.country,
    countryCode: matchCode,
    lat: match.lat,
    lon: match.lon,
    source: 'openweather',
  };
}

interface OpenWeatherChoice {
  picked: GeocodeResult;
  pickedIndex: number;
  hits: OpenWeatherHit[];
}

async function loadOpenWeather(
  place: string,
  country?: string
): Promise<OpenWeatherChoice | null> {
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

    const data = (await res.json()) as OpenWeatherHit[];
    if (!Array.isArray(data) || data.length === 0) return null;

    const { row, index } = pickBestOpenWeatherRow(data, city, resolvedCountry);
    const matchCode = row.country.length === 2 ? row.country : undefined;
    if (
      resolvedCountry &&
      isLikelyCountryName(resolvedCountry) &&
      !countryMatches(resolvedCountry, row.country, matchCode)
    ) {
      return null;
    }

    return {
      picked: toOpenWeatherResult(row, resolvedCountry),
      pickedIndex: index,
      hits: data,
    };
  } catch {
    return null;
  }
}

export async function geocodeOpenWeather(
  place: string,
  country?: string
): Promise<GeocodeResult | null> {
  const choice = await loadOpenWeather(place, country);
  return choice?.picked ?? null;
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

function openWeatherAgrees(
  hit: GeocodeResult,
  resolvedCountry: string | undefined
): boolean {
  return (
    !resolvedCountry ||
    !isLikelyCountryName(resolvedCountry) ||
    countryMatches(resolvedCountry, hit.country, hit.countryCode)
  );
}

/**
 * OpenWeather first, Nominatim when OpenWeather misses.
 * If our scorer's pick is not OpenWeather's own first hit, cross-check
 * Nominatim and prefer the prominent place when the two disagree.
 */
export async function resolvePlace(
  place: string,
  country?: string
): Promise<GeocodeResult | null> {
  const resolvedCountry = country?.trim() || disambiguatedCountry(place.trim());
  const ow = await loadOpenWeather(place, resolvedCountry);
  if (!ow || !openWeatherAgrees(ow.picked, resolvedCountry)) {
    return geocodeNominatim(place, resolvedCountry);
  }

  if (ow.pickedIndex === 0) return ow.picked;

  const nomi = await geocodeNominatim(place, resolvedCountry);
  if (!nomi) return ow.picked;
  if (
    resolvedCountry &&
    isLikelyCountryName(resolvedCountry) &&
    !countryMatches(resolvedCountry, nomi.country, nomi.countryCode)
  ) {
    return ow.picked;
  }
  if (distanceKm(ow.picked, nomi) <= SAME_PLACE_KM) return ow.picked;

  const nearer = ow.hits
    .filter((hit) => distanceKm(hit, nomi) <= SAME_PLACE_KM)
    .sort((a, b) => distanceKm(a, nomi) - distanceKm(b, nomi))[0];
  if (nearer) return toOpenWeatherResult(nearer, resolvedCountry);
  return nomi;
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

    const data = (await res.json()) as OpenWeatherHit[];
    if (!Array.isArray(data) || data.length === 0) return [];

    return data.map((row, index) => {
      const countryCode = row.country.length === 2 ? row.country : undefined;
      const countryName = displayCountry(
        resolvedCountry || row.country,
        countryCode
      );
      return {
        name: row.name,
        country: countryName,
        countryCode,
        state: row.state,
        lat: row.lat,
        lon: row.lon,
        source: 'openweather' as const,
        score: openWeatherScore(row, city, resolvedCountry, index),
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
        state: addr?.state,
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
    const key = candidateKey(
      candidate.name,
      candidate.country,
      candidate.countryCode,
      candidate.state
    );
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
