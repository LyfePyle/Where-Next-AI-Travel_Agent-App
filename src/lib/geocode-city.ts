/**
 * City-level geocoding via OpenWeather Geocoding API (same source as /api/utils/city-search).
 * In-memory cache avoids repeat lookups for the same city/country pair.
 */

export interface CityCoords {
  lat: number;
  lon: number;
  name: string;
  country?: string;
  source: 'live' | 'fallback';
}

const coordsCache = new Map<string, CityCoords>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const cacheExpiry = new Map<string, number>();

function cacheKey(city: string, country?: string): string {
  const c = city.trim().toLowerCase();
  const co = (country ?? '').trim().toLowerCase();
  return co ? `${c}|${co}` : c;
}

/** Rough fallback coords when API key missing or lookup fails (spread by hash). */
function fallbackCoords(city: string, country?: string): CityCoords {
  const seed = (city + (country ?? '')).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return {
    lat: 20 + (seed % 40) - 10,
    lon: ((seed * 7) % 360) - 180,
    name: city,
    country,
    source: 'fallback',
  };
}

export async function geocodeCity(city: string, country?: string): Promise<CityCoords> {
  const place = city.trim();
  if (!place) return fallbackCoords('Unknown');

  const key = cacheKey(place, country);
  const cached = coordsCache.get(key);
  const expires = cacheExpiry.get(key) ?? 0;
  if (cached && Date.now() < expires) return cached;

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    const fb = fallbackCoords(place, country);
    coordsCache.set(key, fb);
    cacheExpiry.set(key, Date.now() + CACHE_TTL_MS);
    return fb;
  }

  const query = country ? `${place},${country.trim()}` : place;
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`Geocode ${res.status}`);

    const data = (await res.json()) as Array<{
      name: string;
      country: string;
      lat: number;
      lon: number;
    }>;

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No results');
    }

    const countryUpper = country?.trim().toUpperCase();
    const match =
      (countryUpper &&
        data.find(
          (r) =>
            r.country?.toUpperCase() === countryUpper ||
            r.name?.toLowerCase() === place.toLowerCase()
        )) ??
      data[0];

    const result: CityCoords = {
      lat: match.lat,
      lon: match.lon,
      name: match.name,
      country: match.country,
      source: 'live',
    };

    coordsCache.set(key, result);
    cacheExpiry.set(key, Date.now() + CACHE_TTL_MS);
    return result;
  } catch (err) {
    console.warn(`geocodeCity failed for "${query}":`, err);
    const fb = fallbackCoords(place, country);
    coordsCache.set(key, fb);
    cacheExpiry.set(key, Date.now() + CACHE_TTL_MS);
    return fb;
  }
}
