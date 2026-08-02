import type { ItineraryBlock, TimeOfDay } from '@/types/itinerary';

const TIME_ORDER: Record<TimeOfDay, number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
};

/** Display order: morning → afternoon → evening (self-heals any write order). */
export function sortBlocksByTimeOfDay(blocks: ItineraryBlock[]): ItineraryBlock[] {
  return [...blocks].sort(
    (a, b) => (TIME_ORDER[a.time_of_day] ?? 1) - (TIME_ORDER[b.time_of_day] ?? 1)
  );
}
