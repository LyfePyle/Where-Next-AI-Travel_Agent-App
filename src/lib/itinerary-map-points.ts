/**
 * Build Leaflet points for one itinerary day.
 * Located blocks become markers; any block without coords shares a single city pin.
 */

import { hasBlockCoords, sortBlocksByTimeOfDay } from '@/lib/itinerary-blocks';
import type { ItineraryBlock } from '@/types/itinerary';

export type ItineraryMapPointKind = 'block' | 'city';

export interface ItineraryMapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  kind: ItineraryMapPointKind;
  /** 1-based marker number for located blocks. */
  order?: number;
}

export interface CityPinInput {
  lat: number;
  lon: number;
  city: string;
}

export function cityPointId(dayId: string | null | undefined): string {
  return dayId ? `city-${dayId}` : 'city-fallback';
}

/** Marker id for a block: its own pin, or the shared city pin when coords are missing. */
export function mapPointIdForBlock(
  day: { id: string },
  block: Pick<ItineraryBlock, 'id' | 'lat' | 'lng'>
): string {
  return hasBlockCoords(block) ? block.id : cityPointId(day.id);
}

export function itineraryDayMapPoints(
  day: { id: string; blocks: ItineraryBlock[] } | null | undefined,
  cityPin: CityPinInput | null | undefined
): ItineraryMapPoint[] {
  const points: ItineraryMapPoint[] = [];
  const blocks = day ? sortBlocksByTimeOfDay(day.blocks) : [];
  let missingCoords = !day || blocks.length === 0;

  let blockOrder = 0;
  for (const block of blocks) {
    if (hasBlockCoords(block)) {
      blockOrder += 1;
      points.push({
        id: block.id,
        lat: block.lat,
        lng: block.lng,
        label: block.title || 'Untitled',
        sublabel: block.time_of_day,
        kind: 'block',
        order: blockOrder,
      });
    } else {
      missingCoords = true;
    }
  }

  if (missingCoords && cityPin) {
    points.push({
      id: cityPointId(day?.id),
      lat: cityPin.lat,
      lng: cityPin.lon,
      label: cityPin.city,
      sublabel: 'City center',
      kind: 'city',
    });
  }

  return points;
}
