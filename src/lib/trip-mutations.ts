/**
 * Shared trip stop mutations — used by AI chat tools and manual editor logic.
 * All date changes flow through chainStopsFromNights.
 */

import {
  chainStopsFromNights,
  deriveNightsFromStop,
} from '@/lib/trip-stops';
import type { TripStop } from '@/types/trip';

export const MAX_TRIP_STOPS = 6;

function newStopId(): string {
  return `stop-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatStopDestination(place: string, country: string): string {
  const p = place.trim();
  const c = country.trim();
  if (!p) return c;
  if (!c) return p;
  if (p.toLowerCase().includes(c.toLowerCase())) return p;
  return `${p}, ${c}`;
}

export type MutationResult =
  | { ok: true; stops: TripStop[]; summary: string }
  | { ok: false; error: string };

function rechainOrFail(stops: TripStop[], tripStart: string): MutationResult {
  const chained = chainStopsFromNights(stops, tripStart);
  if (!chained) {
    return { ok: false, error: 'Could not compute chained dates — check trip start date.' };
  }
  return { ok: true, stops: chained, summary: '' };
}

function findStop(stops: TripStop[], stopId: string): TripStop | undefined {
  return stops.find((s) => s.id === stopId);
}

function stopLabel(stop: TripStop): string {
  return stop.city || stop.destination.split(',')[0]?.trim() || stop.destination;
}

/** Replace one stop with a different place, keeping position and nights unless resized separately. */
export function swapStop(
  stops: TripStop[],
  tripStart: string,
  stopId: string,
  newPlace: string,
  newCountry: string
): MutationResult {
  const idx = stops.findIndex((s) => s.id === stopId);
  if (idx < 0) return { ok: false, error: `Stop not found: ${stopId}` };

  const prev = stops[idx];
  const nights = deriveNightsFromStop(prev);
  const destination = formatStopDestination(newPlace, newCountry);
  const next = stops.map((s, i) =>
    i === idx
      ? {
          ...s,
          destination,
          city: newPlace.trim(),
          country: newCountry.trim(),
          nights,
        }
      : s
  );

  const result = rechainOrFail(next, tripStart);
  if (!result.ok) return result;
  return {
    ok: true,
    stops: result.stops,
    summary: `Swapped ${stopLabel(prev)} → ${newPlace.trim()} (${nights} night${nights !== 1 ? 's' : ''})`,
  };
}

/** Change nights at a stop; downstream dates cascade automatically. */
export function resizeStopNights(
  stops: TripStop[],
  tripStart: string,
  stopId: string,
  newNights: number
): MutationResult {
  const stop = findStop(stops, stopId);
  if (!stop) return { ok: false, error: `Stop not found: ${stopId}` };

  const nights = Math.max(1, Math.round(newNights));
  const prevNights = deriveNightsFromStop(stop);
  const next = stops.map((s) => (s.id === stopId ? { ...s, nights } : s));

  const result = rechainOrFail(next, tripStart);
  if (!result.ok) return result;
  return {
    ok: true,
    stops: result.stops,
    summary: `Changed ${stopLabel(stop)} from ${prevNights} to ${nights} night${nights !== 1 ? 's' : ''}`,
  };
}

/** Insert a new stop at a 0-indexed position. Extends the trip. */
export function insertStop(
  stops: TripStop[],
  tripStart: string,
  place: string,
  country: string,
  position: number,
  nights: number
): MutationResult {
  if (stops.length >= MAX_TRIP_STOPS) {
    return { ok: false, error: `Maximum ${MAX_TRIP_STOPS} stops allowed.` };
  }

  const n = Math.max(1, Math.round(nights));
  const pos = Math.max(0, Math.min(Math.round(position), stops.length));
  const destination = formatStopDestination(place, country);
  const newStop: TripStop = {
    id: newStopId(),
    destination,
    city: place.trim(),
    country: country.trim(),
    startDate: '',
    endDate: '',
    nights: n,
    order: pos,
  };

  const next = [...stops.slice(0, pos), newStop, ...stops.slice(pos)];
  const result = rechainOrFail(next, tripStart);
  if (!result.ok) return result;
  return {
    ok: true,
    stops: result.stops,
    summary: `Added ${place.trim()} (${n} night${n !== 1 ? 's' : ''}) at stop ${pos + 1}`,
  };
}

/** Remove a stop; downstream stops shift earlier. */
export function deleteStop(
  stops: TripStop[],
  tripStart: string,
  stopId: string
): MutationResult {
  if (stops.length <= 1) {
    return { ok: false, error: 'Cannot remove the last stop — a trip needs at least one destination.' };
  }

  const removed = findStop(stops, stopId);
  if (!removed) return { ok: false, error: `Stop not found: ${stopId}` };

  const next = stops.filter((s) => s.id !== stopId);
  const result = rechainOrFail(next, tripStart);
  if (!result.ok) return result;
  return {
    ok: true,
    stops: result.stops,
    summary: `Removed ${stopLabel(removed)}`,
  };
}

/** Reorder all stops; dates recompute from trip start. */
export function reorderStops(
  stops: TripStop[],
  tripStart: string,
  orderedStopIds: string[]
): MutationResult {
  if (orderedStopIds.length !== stops.length) {
    return { ok: false, error: 'ordered_stop_ids must include every stop exactly once.' };
  }

  const byId = new Map(stops.map((s) => [s.id, s]));
  const reordered: TripStop[] = [];
  for (const id of orderedStopIds) {
    const stop = byId.get(id);
    if (!stop) return { ok: false, error: `Unknown stop id: ${id}` };
    reordered.push(stop);
    byId.delete(id);
  }

  if (byId.size > 0) {
    return { ok: false, error: 'ordered_stop_ids must include every stop exactly once.' };
  }

  const result = rechainOrFail(reordered, tripStart);
  if (!result.ok) return result;
  return { ok: true, stops: result.stops, summary: 'Reordered stops' };
}

export interface ToolCallInput {
  name: string;
  arguments: Record<string, unknown>;
}

/** Execute one or more tool calls in order against current stops. */
export function applyToolCalls(
  stops: TripStop[],
  tripStart: string,
  calls: ToolCallInput[]
): { ok: true; stops: TripStop[]; summaries: string[] } | { ok: false; error: string } {
  let current = stops;
  const summaries: string[] = [];

  for (const call of calls) {
    const args = call.arguments;
    let result: MutationResult;

    switch (call.name) {
      case 'swap_stop':
        result = swapStop(
          current,
          tripStart,
          String(args.stop_id ?? ''),
          String(args.new_place ?? ''),
          String(args.new_country ?? '')
        );
        break;
      case 'resize_stop_nights':
        result = resizeStopNights(
          current,
          tripStart,
          String(args.stop_id ?? ''),
          Number(args.new_nights)
        );
        break;
      case 'add_stop':
        result = insertStop(
          current,
          tripStart,
          String(args.place ?? ''),
          String(args.country ?? ''),
          Number(args.position),
          Number(args.nights)
        );
        break;
      case 'remove_stop':
        result = deleteStop(current, tripStart, String(args.stop_id ?? ''));
        break;
      case 'reorder_stops':
        result = reorderStops(
          current,
          tripStart,
          Array.isArray(args.ordered_stop_ids)
            ? args.ordered_stop_ids.map(String)
            : []
        );
        break;
      default:
        return { ok: false, error: `Unknown tool: ${call.name}` };
    }

    if (!result.ok) return result;
    current = result.stops;
    if (result.summary) summaries.push(result.summary);
  }

  return { ok: true, stops: current, summaries };
}
