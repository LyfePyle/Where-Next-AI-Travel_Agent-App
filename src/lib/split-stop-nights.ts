/**
 * Even night split + drag-reconcile for Plan Trip / chip editor.
 * Remainder nights land on the first stops — a starting point, not a rule.
 */

import { isoAddDays } from '@/lib/trip-stops';
import type { TripStop } from '@/types/trip';

/** 10 nights / 3 stops → [4, 3, 3]. Remainder goes to the earliest stops. */
export function evenSplitNights(totalNights: number, stopCount: number): number[] {
  if (stopCount <= 0) return [];
  const total = Math.max(0, Math.round(totalNights));
  if (stopCount === 1) return [total];
  const base = Math.floor(total / stopCount);
  const rem = total % stopCount;
  return Array.from({ length: stopCount }, (_, i) => base + (i < rem ? 1 : 0));
}

export function nightsOnStop(stop: TripStop): number {
  if (typeof stop.nights === 'number' && Number.isFinite(stop.nights) && stop.nights >= 0) {
    return Math.round(stop.nights);
  }
  return 0;
}

export function nightsArray(stops: TripStop[]): number[] {
  return stops.map(nightsOnStop);
}

export function applyStopNights(
  stops: TripStop[],
  nights: number[],
  tripStart: string
): TripStop[] {
  let cursor = tripStart;
  return stops.map((stop, i) => {
    const n = Math.max(0, Math.round(nights[i] ?? 0));
    const startDate = tripStart ? cursor : stop.startDate;
    const endDate = tripStart ? isoAddDays(cursor, n) : stop.endDate;
    if (tripStart) cursor = endDate;
    return { ...stop, nights: n, startDate, endDate, order: i };
  });
}

export function moveNightBetweenStops(
  stops: TripStop[],
  fromStopId: string,
  toStopId: string,
  tripStart: string
): TripStop[] {
  if (fromStopId === toStopId) return stops;
  const fromIdx = stops.findIndex((s) => s.id === fromStopId);
  const toIdx = stops.findIndex((s) => s.id === toStopId);
  if (fromIdx < 0 || toIdx < 0) return stops;

  const nights = nightsArray(stops);
  if (nights[fromIdx] <= 0) return stops;
  nights[fromIdx] -= 1;
  nights[toIdx] += 1;
  return applyStopNights(stops, nights, tripStart);
}

function addNightsRoundRobin(nights: number[], extra: number): number[] {
  const next = nights.slice();
  if (next.length === 0 || extra <= 0) return next;
  for (let k = 0; k < extra; k++) {
    next[k % next.length] += 1;
  }
  return next;
}

function removeNightsFromEnd(nights: number[], extra: number): number[] {
  const next = nights.slice();
  let left = extra;
  let guard = 0;
  while (left > 0 && next.some((n) => n > 0) && guard < 10_000) {
    for (let i = next.length - 1; i >= 0 && left > 0; i--) {
      if (next[i] > 0) {
        next[i] -= 1;
        left -= 1;
      }
    }
    guard += 1;
  }
  return next;
}

function sameIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((id) => set.has(id));
}

function matchTotal(nights: number[], totalNights: number): number[] {
  const total = Math.max(0, Math.round(totalNights));
  const sum = nights.reduce((a, b) => a + b, 0);
  if (sum < total) return addNightsRoundRobin(nights, total - sum);
  if (sum > total) return removeNightsFromEnd(nights, sum - total);
  return nights;
}

export function nightsFingerprint(stops: TripStop[]): string {
  return stops.map((s) => `${s.id}:${nightsOnStop(s)}:${s.startDate}:${s.endDate}`).join('|');
}

/**
 * Re-apply nights when trip length or the stop list changes.
 * Unedited trips re-even-split. After the user drags, keep their distribution
 * and only place newly added/removed nights (or a length delta).
 */
export function reconcileStopNights(opts: {
  stops: TripStop[];
  prevIds: string[];
  prevNights: number[];
  totalNights: number;
  userAdjusted: boolean;
  tripStart: string;
}): TripStop[] {
  const { stops, prevIds, prevNights, totalNights, userAdjusted, tripStart } = opts;
  if (stops.length === 0) return [];

  const ids = stops.map((s) => s.id);
  const prevById = new Map(prevIds.map((id, i) => [id, prevNights[i] ?? 0]));
  const currentIds = new Set(ids);
  const firstRun = prevIds.length === 0;
  const prevSum = prevNights.reduce((a, b) => a + b, 0);
  const totalChanged = !firstRun && prevSum !== Math.max(0, Math.round(totalNights));
  const membershipChanged = !firstRun && !sameIdSet(ids, prevIds);

  if (!userAdjusted && (firstRun || membershipChanged || totalChanged)) {
    return applyStopNights(stops, evenSplitNights(totalNights, stops.length), tripStart);
  }

  const preserved = ids.map((id) => prevById.get(id) ?? 0);
  let freed = 0;
  for (let i = 0; i < prevIds.length; i++) {
    if (!currentIds.has(prevIds[i])) freed += prevNights[i] ?? 0;
  }

  return applyStopNights(
    stops,
    matchTotal(addNightsRoundRobin(preserved, freed), totalNights),
    tripStart
  );
}
