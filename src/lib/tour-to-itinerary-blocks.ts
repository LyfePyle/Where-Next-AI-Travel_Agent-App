/**
 * Map a walking tour onto itinerary blocks (1:1, cap 6) so day-map pins survive.
 */

import { newBlockId } from '@/lib/itinerary-blocks';
import type { ItineraryBlock, TimeOfDay } from '@/types/itinerary';

export const TOUR_BLOCK_CAP = 6;

export type TourStopLike = {
  name: string;
  description?: string;
  local_tip?: string;
  best_time?: string;
  lat?: number;
  lng?: number;
  order?: number;
};

export function timeOfDayByThirds(index: number, total: number): TimeOfDay {
  const n = Math.max(1, total);
  if (n === 1) return 'morning';
  const morningEnd = Math.ceil(n / 3);
  const afternoonEnd = Math.ceil((2 * n) / 3);
  if (index < morningEnd) return 'morning';
  if (index < afternoonEnd) return 'afternoon';
  return 'evening';
}

function orderedStops(stops: TourStopLike[]): TourStopLike[] {
  return [...stops].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function blockDescription(stop: TourStopLike): string {
  return [stop.description?.trim(), stop.local_tip?.trim()].filter(Boolean).join(' ');
}

export function tourStopsToItineraryBlocks(
  stops: TourStopLike[],
  options?: { idFn?: () => string }
): { blocks: ItineraryBlock[]; extraStopNames: string[] } {
  const idFn = options?.idFn ?? newBlockId;
  const ordered = orderedStops(stops).filter((s) => s.name?.trim());
  const kept = ordered.slice(0, TOUR_BLOCK_CAP);
  const extra = ordered.slice(TOUR_BLOCK_CAP);
  const extraStopNames = extra.map((s) => s.name.trim());
  const n = kept.length;

  const blocks: ItineraryBlock[] = kept.map((stop, index) => {
    const name = stop.name.trim();
    const block: ItineraryBlock = {
      id: idFn(),
      time_of_day: timeOfDayByThirds(index, n),
      title: name,
      description: blockDescription(stop) || name,
      place: name,
    };
    const lat = Number(stop.lat);
    const lng = Number(stop.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
      block.lat = lat;
      block.lng = lng;
    }
    return block;
  });

  if (extraStopNames.length && blocks.length > 0) {
    const last = blocks[blocks.length - 1];
    const extras = extraStopNames.join(', ');
    last.description = `${last.description} Optional extras: ${extras}.`.trim();
  }

  return { blocks, extraStopNames };
}
