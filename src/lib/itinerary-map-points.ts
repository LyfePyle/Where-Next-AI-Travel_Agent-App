/**
 * Build Leaflet points for one itinerary day.
 * Located blocks become markers; any block without coords shares a single city pin.
 */

import { hasBlockCoords, sortBlocksByTimeOfDay } from '@/lib/itinerary-blocks';

/** Same radius as venue geocoding: a block pin farther than this is not this stop. */
const STOP_PIN_RADIUS_KM = 80;

function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
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
  cityPin: CityPinInput | null | undefined,
  /** Stored stop coordinates. Block pins far from this point are dropped. */
  anchor?: { lat: number; lng: number } | null
): ItineraryMapPoint[] {
  const points: ItineraryMapPoint[] = [];
  const blocks = day ? sortBlocksByTimeOfDay(day.blocks) : [];
  let missingCoords = !day || blocks.length === 0;

  let blockOrder = 0;
  for (const block of blocks) {
    const located = hasBlockCoords(block);
    const nearAnchor =
      located &&
      (!anchor || kmBetween(anchor, { lat: block.lat, lng: block.lng }) <= STOP_PIN_RADIUS_KM);
    if (located && nearAnchor) {
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
