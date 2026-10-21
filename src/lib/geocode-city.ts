/**
 * City-level geocoding: OpenWeather first, Nominatim second.
 * A miss returns null. Callers show no pin rather than a made-up coordinate.
 * In-memory cache avoids repeat lookups for the same city/country pair.
 */

import { resolvePlace } from '@/lib/geocode-place';
import { resolveGeocodeCountry } from '@/lib/geocode-disambiguation';

export interface CityCoords {
  lat: number;
  lon: number;
  name: string;
  country?: string;
  source: 'openweather' | 'nominatim';
}

const coordsCache = new Map<string, CityCoords>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const cacheExpiry = new Map<string, number>();

function cacheKey(city: string, country?: string): string {
  const c = city.trim().toLowerCase();
  const co = (country ?? '').trim().toLowerCase();
  return co ? `v5|${c}|${co}` : `v5|${c}`;
}

export async function geocodeCity(
  city: string,
  country?: string,
  siblingCountries: string[] = []
): Promise<CityCoords | null> {
  const place = city.trim();
  if (!place) return null;

  const resolvedCountry = resolveGeocodeCountry(place, country, siblingCountries);
  const key = cacheKey(place, resolvedCountry);
  const cached = coordsCache.get(key);
  const expires = cacheExpiry.get(key) ?? 0;
  if (cached && Date.now() < expires) return cached;

  const resolved = await resolvePlace(place, resolvedCountry);
  if (resolved) {
    const result: CityCoords = {
      lat: resolved.lat,
      lon: resolved.lon,
      name: resolved.name,
      country: resolved.country || resolvedCountry,
      source: resolved.source,
    };
    coordsCache.set(key, result);
    cacheExpiry.set(key, Date.now() + CACHE_TTL_MS);
    return result;
  }

  console.warn(
    `geocodeCity: no results for "${place}"${resolvedCountry ? `, ${resolvedCountry}` : ''}`
  );
  return null;
}
