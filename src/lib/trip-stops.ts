/**
 * src/lib/trip-stops.ts
 *
 * Single source of truth for reading and writing trips.stops JSONB.
 * Always normalize on read; legacy single-destination rows synthesize one stop.
 */

import type { TripStop } from '@/types/trip';

export interface TripRowLike {
  destination?: string | null;
  title?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  stops?: unknown;
}

export interface CountryStopGroup {
  country: string;
  stops: TripStop[];
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function inferCountryFromDestination(destination: string): string | undefined {
  const d = destination.trim();
  if (!d) return undefined;
  if (d.includes('→')) return undefined;
  const parts = d.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1];
  return undefined;
}

function inferCityFromDestination(destination: string): string | undefined {
  const d = destination.trim();
  if (!d || d.includes('→')) return undefined;
  const parts = d.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[0];
  return undefined;
}

/** Normalize one raw stop object from JSONB or client payload. */
export function normalizeStop(
  raw: unknown,
  index: number,
  fallback?: { startDate?: string; endDate?: string }
): TripStop | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const destination = str(o.destination);
  if (!destination) return null;

  const id = str(o.id) || `stop-${index}`;
  const startDate = str(o.startDate) || fallback?.startDate || '';
  const endDate = str(o.endDate) || fallback?.endDate || '';
  const country = str(o.country) || inferCountryFromDestination(destination);
  const city = str(o.city) || inferCityFromDestination(destination);
  const order =
    typeof o.order === 'number' && Number.isFinite(o.order) ? o.order : index;
  const notes = str(o.notes) || undefined;

  const stop: TripStop = { id, destination, startDate, endDate, order };
  if (country) stop.country = country;
  if (city) stop.city = city;
  if (notes) stop.notes = notes;
  return stop;
}

/** Synthesize a single stop from legacy trip columns. */
export function legacyStopFromRow(row: TripRowLike): TripStop {
  const destination =
    str(row.destination) || str(row.title) || 'Your destination';
  const startDate = str(row.start_date);
  const endDate = str(row.end_date);
  const country = inferCountryFromDestination(destination);
  const city = inferCityFromDestination(destination);

  const stop: TripStop = {
    id: 'stop-0',
    destination,
    startDate,
    endDate,
    order: 0,
  };
  if (country) stop.country = country;
  if (city) stop.city = city;
  return stop;
}

/**
 * Answer "what are this trip's stops?" for any trips row (or hub-shaped object).
 * Never throws; malformed JSON falls back to legacy single stop.
 */
export function normalizeTripStopsFromRow(row: TripRowLike): TripStop[] {
  const fallbackDates = {
    startDate: str(row.start_date),
    endDate: str(row.end_date),
  };

  let rawStops: unknown = row.stops;
  if (typeof rawStops === 'string') {
    try {
      rawStops = JSON.parse(rawStops);
    } catch {
      rawStops = null;
    }
  }

  if (Array.isArray(rawStops) && rawStops.length > 0) {
    const normalized = rawStops
      .map((s, i) => normalizeStop(s, i, fallbackDates))
      .filter((s): s is TripStop => s !== null);
    if (normalized.length > 0) {
      return normalized
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((s, i) => ({ ...s, order: s.order ?? i }));
    }
  }

  return [legacyStopFromRow(row)];
}

/** Prepare stops for trips.stops JSONB on insert/update. Returns null when empty. */
export function serializeStopsForDb(stops: TripStop[]): TripStop[] | null {
  if (!Array.isArray(stops) || stops.length === 0) return null;
  const normalized = stops
    .map((s, i) => normalizeStop(s, i))
    .filter((s): s is TripStop => s !== null);
  if (normalized.length === 0) return null;
  return normalized.map((s, i) => ({ ...s, order: s.order ?? i }));
}

/** Group normalized stops by country for Stage 2 drill-down UI. */
export function groupStopsByCountry(stops: TripStop[]): CountryStopGroup[] {
  const groups = new Map<string, TripStop[]>();
  for (const stop of stops) {
    const key = stop.country?.trim() || 'Other';
    const list = groups.get(key) ?? [];
    list.push(stop);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).map(([country, countryStops]) => ({
    country,
    stops: countryStops.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  }));
}
