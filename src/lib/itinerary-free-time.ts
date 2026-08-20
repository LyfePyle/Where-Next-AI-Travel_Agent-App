/**
 * Which itinerary days may receive an auto-suggested walking tour.
 * Travel days are never "free time" — they are supposed to look sparse.
 */

import { parseTravelNoteKind, resolveTravelNoteKind } from '@/lib/itinerary-travel-note';

export const FREE_TIME_MAX_BLOCKS = 1;

export function isItineraryTravelDay(
  day: { day_index: number; travel_note_kind?: string | null },
  stopDayCount: number
): boolean {
  if (parseTravelNoteKind(day.travel_note_kind)) return true;
  return (
    resolveTravelNoteKind({
      dayIndex: day.day_index,
      totalDays: stopDayCount,
      isLastStop: true,
    }) !== null
  );
}

export function isFreeTimeDay(
  day: {
    day_index: number;
    blocks?: unknown[];
    travel_note_kind?: string | null;
  },
  stopDayCount: number
): boolean {
  if (isItineraryTravelDay(day, stopDayCount)) return false;
  return (day.blocks?.length ?? 0) <= FREE_TIME_MAX_BLOCKS;
}

/** At most one auto-suggestion day per stop (earliest eligible middle day). */
export function pickTourSuggestionDays<
  T extends {
    id: string;
    stop_id: string;
    day_index: number;
    blocks?: unknown[];
    travel_note_kind?: string | null;
  },
>(days: T[]): T[] {
  const byStop = new Map<string, T[]>();
  for (const day of days) {
    const list = byStop.get(day.stop_id) ?? [];
    list.push(day);
    byStop.set(day.stop_id, list);
  }

  const picked: T[] = [];
  for (const group of byStop.values()) {
    const sorted = [...group].sort((a, b) => a.day_index - b.day_index);
    const eligible = sorted.find((d) => isFreeTimeDay(d, sorted.length));
    if (eligible) picked.push(eligible);
  }
  return picked;
}
