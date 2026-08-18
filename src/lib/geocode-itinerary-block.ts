/**
 * Attach lat/lng to itinerary blocks at generation / chat-add time.
 * Prefers Nominatim on a named place; falls back to model coords only if they
 * sit near the stop city. Missing coords stay omitted (city-pin fallback later).
 */

import { geocodeCity } from '@/lib/geocode-city';
import { hasBlockCoords } from '@/lib/itinerary-blocks';
import type { GeneratedItineraryDay, ItineraryBlock } from '@/types/itinerary';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_USER_AGENT = 'WhereNext-Travel-App/1.0';
const NOMINATIM_GAP_MS = 1100;

/** Accept a pin if it is within this distance of the stop city. */
export const CITY_PROXIMITY_KM = 80;
/** Treat a hit this close to the city centroid as "the city", not a venue. */
export const CITY_CENTROID_KM = 1.5;

export interface LatLng {
  lat: number;
  lng: number;
}

export function kmBetween(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isNearCity(point: LatLng, city: LatLng, maxKm = CITY_PROXIMITY_KM): boolean {
  return kmBetween(point, city) <= maxKm;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastNominatimAt = 0;

async function throttleNominatim(): Promise<void> {
  const wait = NOMINATIM_GAP_MS - (Date.now() - lastNominatimAt);
  if (wait > 0) await sleep(wait);
  lastNominatimAt = Date.now();
}

export async function geocodeVenue(
  venue: string,
  city: string,
  country?: string
): Promise<LatLng | null> {
  const name = venue.trim();
  if (!name) return null;

  const query = [name, city.trim(), country?.trim()].filter(Boolean).join(', ');
  const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;

  await throttleNominatim();

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': NOMINATIM_USER_AGENT },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;

    for (const row of data) {
      const lat = parseFloat(row.lat ?? '');
      const lng = parseFloat(row.lon ?? '');
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (lat === 0 && lng === 0) continue;
      return { lat, lng };
    }
    return null;
  } catch (err) {
    console.warn(`geocodeVenue failed for "${query}":`, err);
    return null;
  }
}

export interface AttachCoordsDeps {
  geocodeCityFn?: (city: string, country: string) => Promise<LatLng | null>;
  geocodeVenueFn?: (venue: string, city: string, country: string) => Promise<LatLng | null>;
}

const venueCache = new Map<string, LatLng | null>();

function venueKey(venue: string, city: string, country: string): string {
  return `${venue.trim().toLowerCase()}|${city.trim().toLowerCase()}|${country.trim().toLowerCase()}`;
}

async function defaultCityGeocode(city: string, country: string): Promise<LatLng | null> {
  const result = await geocodeCity(city, country);
  if (result.source === 'fallback') return null;
  return { lat: result.lat, lng: result.lon };
}

function stripCoords<T extends Partial<ItineraryBlock>>(block: T): T {
  const next = { ...block };
  delete next.lat;
  delete next.lng;
  return next;
}

function withCoords<T extends Partial<ItineraryBlock>>(block: T, point: LatLng): T {
  return { ...block, lat: point.lat, lng: point.lng };
}

/**
 * Resolve coords for one block. Geocode the named place first; use model lat/lng
 * only when they sit near the city. Generic city-centroid hits without a place
 * are left empty so the map can fall back to the city pin.
 */
export async function resolveBlockCoords(
  block: Pick<ItineraryBlock, 'title' | 'place' | 'lat' | 'lng'>,
  city: string,
  country: string,
  cityCenter: LatLng | null,
  deps: AttachCoordsDeps = {}
): Promise<LatLng | null> {
  const geocodeVenueFn = deps.geocodeVenueFn ?? geocodeVenue;
  const venue = (block.place || block.title).trim();
  const hadPlace = Boolean(block.place?.trim());

  let geocoded: LatLng | null = null;
  if (venue) {
    const key = venueKey(venue, city, country);
    if (deps.geocodeVenueFn) {
      geocoded = await geocodeVenueFn(venue, city, country);
    } else if (venueCache.has(key)) {
      geocoded = venueCache.get(key) ?? null;
    } else {
      geocoded = await geocodeVenueFn(venue, city, country);
      venueCache.set(key, geocoded);
    }
  }

  if (geocoded && cityCenter) {
    if (!isNearCity(geocoded, cityCenter)) {
      geocoded = null;
    } else if (!hadPlace && kmBetween(geocoded, cityCenter) <= CITY_CENTROID_KM) {
      geocoded = null;
    }
  } else if (geocoded && !cityCenter && !hadPlace) {
    geocoded = null;
  }

  if (geocoded) return geocoded;

  const ai =
    hasBlockCoords(block) ? { lat: block.lat, lng: block.lng } : null;
  if (ai && cityCenter && isNearCity(ai, cityCenter)) {
    if (!hadPlace && kmBetween(ai, cityCenter) <= CITY_CENTROID_KM) return null;
    return ai;
  }
  if (ai && !cityCenter) return ai;

  return null;
}

export async function attachCoordsToBlocks<T extends Partial<ItineraryBlock> & { title: string }>(
  blocks: T[],
  city: string,
  country: string,
  deps: AttachCoordsDeps = {}
): Promise<T[]> {
  const geocodeCityFn = deps.geocodeCityFn ?? defaultCityGeocode;
  const cityCenter = city.trim() ? await geocodeCityFn(city, country) : null;

  const next: T[] = [];
  for (const block of blocks) {
    const point = await resolveBlockCoords(block, city, country, cityCenter, deps);
    next.push(point ? withCoords(block, point) : stripCoords(block));
  }
  return next;
}

export async function attachCoordsToGeneratedDays(
  days: GeneratedItineraryDay[],
  city: string,
  country: string,
  deps: AttachCoordsDeps = {}
): Promise<GeneratedItineraryDay[]> {
  const out: GeneratedItineraryDay[] = [];
  for (const day of days) {
    out.push({
      ...day,
      blocks: await attachCoordsToBlocks(day.blocks, city, country, deps),
    });
  }
  return out;
}
