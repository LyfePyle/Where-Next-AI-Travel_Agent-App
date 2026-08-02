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
  const nightsRaw = o.nights;
  const nights =
    typeof nightsRaw === 'number' && Number.isFinite(nightsRaw) && nightsRaw >= 1
      ? Math.round(nightsRaw)
      : undefined;

  const stop: TripStop = { id, destination, startDate, endDate, order };
  if (country) stop.country = country;
  if (city) stop.city = city;
  if (notes) stop.notes = notes;
  if (nights != null) stop.nights = nights;
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

/** Stable key for duplicate detection: ordered city|country pairs. */
export function stopSetFingerprint(stops: TripStop[]): string {
  const normalized = serializeStopsForDb(stops);
  if (!normalized?.length) return '';
  return normalized
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s) => {
      const city = (s.city || s.destination.split(',')[0]).trim().toLowerCase();
      const country = (s.country || '').trim().toLowerCase();
      return `${city}|${country}`;
    })
    .join(';;');
}

/** Fingerprint from raw trips.stops JSONB (for server-side duplicate checks). */
export function fingerprintFromStopsJson(raw: unknown): string {
  if (!Array.isArray(raw) || raw.length === 0) return '';
  const stops = raw
    .map((s, i) => normalizeStop(s, i))
    .filter((s): s is TripStop => s !== null);
  return stopSetFingerprint(stops);
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

export function isoAddDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Nights between dates (shared boundary: same-day checkout/check-in = 0 gap). */
export function nightsBetween(start: string, end: string): number {
  const s = new Date(`${start}T12:00:00`);
  const e = new Date(`${end}T12:00:00`);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / 86_400_000));
}

const DEFAULT_STOP_NIGHTS = 3;

/** Derive nights for one stop from cached nights or stored dates. */
export function deriveNightsFromStop(stop: TripStop): number {
  if (typeof stop.nights === 'number' && stop.nights >= 1 && Number.isFinite(stop.nights)) {
    return Math.round(stop.nights);
  }
  if (stop.startDate && stop.endDate) {
    return Math.max(1, nightsBetween(stop.startDate, stop.endDate));
  }
  return DEFAULT_STOP_NIGHTS;
}

/**
 * Cascade arrive/leave dates from trip start + per-stop nights.
 * Stop N+1 arrives on stop N's leave day (shared boundary).
 * Returns null when chain cannot be built (missing start or stops).
 */
export function chainStopsFromNights(
  stops: TripStop[],
  tripStart: string
): TripStop[] | null {
  if (!tripStart || stops.length === 0) return null;

  let cursor = tripStart;
  return stops.map((stop, i) => {
    const n = Math.max(1, deriveNightsFromStop(stop));
    const startDate = cursor;
    const endDate = isoAddDays(cursor, n);
    cursor = endDate;
    return { ...stop, startDate, endDate, nights: n, order: i };
  });
}

/** Re-chain after load so legacy rows with nights metadata get consistent dates. */
export function hydrateStopsWithNights(
  stops: TripStop[],
  tripStart: string
): TripStop[] {
  const withNights = stops.map((s) => ({ ...s, nights: deriveNightsFromStop(s) }));
  return chainStopsFromNights(withNights, tripStart) ?? withNights;
}

/**
 * Split a trip date range evenly across ordered stops.
 * Shared boundary days: stop N ends on the same day stop N+1 starts (checkout/check-in).
 * Remainder nights go on the last stop only; last stop always ends on tripEnd.
 */
export function assignDatesAcrossStops(
  stops: TripStop[],
  tripStart: string,
  tripEnd: string
): TripStop[] {
  if (stops.length === 0) return [];
  if (stops.length === 1) {
    return [
      {
        ...stops[0],
        startDate: tripStart || stops[0].startDate,
        endDate: tripEnd || stops[0].endDate,
        order: 0,
      },
    ];
  }
  if (!tripStart || !tripEnd) {
    return stops.map((s, i) => ({ ...s, order: i }));
  }

  const totalNights = Math.max(1, nightsBetween(tripStart, tripEnd));
  const n = stops.length;
  const base = Math.floor(totalNights / n);
  const remainder = totalNights % n;

  let cursor = tripStart;
  return stops.map((stop, i) => {
    const nights = i === n - 1 ? base + remainder : base;
    const startDate = cursor;
    const endDate = i === n - 1 ? tripEnd : isoAddDays(cursor, nights);
    cursor = endDate;
    return { ...stop, startDate, endDate, order: i };
  });
}

export interface StopsValidationResult {
  ok: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

/** Client/server validation before persisting edited stops. */
export function validateStopsForSave(stops: TripStop[]): StopsValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  if (!Array.isArray(stops) || stops.length === 0) {
    return { ok: false, errors: { _form: 'At least one stop is required.' }, warnings };
  }

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const dest = str(stop.destination);
    if (!dest) {
      errors[stop.id] = 'Enter a destination (e.g. Monteverde, Costa Rica).';
      continue;
    }
    if (!stop.startDate || !stop.endDate) {
      errors[stop.id] = 'Start and end dates are required.';
      continue;
    }
    if (stop.startDate > stop.endDate) {
      errors[stop.id] = 'End date must be on or after start date.';
    }
    if (i > 0) {
      const prev = stops[i - 1];
      if (prev.endDate && stop.startDate && stop.startDate < prev.endDate) {
        warnings.push(
          `${stop.destination || `Stop ${i + 1}`} starts before the previous stop ends — check your dates.`
        );
      } else if (prev.endDate && stop.startDate && stop.startDate > prev.endDate) {
        warnings.push(
          `There is a gap between stop ${i} and stop ${i + 1} — check your dates.`
        );
      }
    }
  }

  const serialized = serializeStopsForDb(stops);
  if (!serialized) {
    return { ok: false, errors: { _form: 'Could not validate stops.' }, warnings };
  }

  return { ok: Object.keys(errors).length === 0, errors, warnings };
}

/** Auto-title from distinct countries in stop order, e.g. "Costa Rica & Nicaragua". */
export function titleFromCountries(stops: TripStop[]): string {
  const seen = new Set<string>();
  const countries: string[] = [];
  for (const s of stops) {
    const c = s.country?.trim();
    if (c && !seen.has(c.toLowerCase())) {
      seen.add(c.toLowerCase());
      countries.push(c);
    }
  }
  if (countries.length === 0) {
    const first = stops[0]?.destination.split(',')[0]?.trim();
    return first || 'Your trip';
  }
  return countries.join(' & ');
}
