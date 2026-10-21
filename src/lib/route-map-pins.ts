/**
 * Stop pins for the Overview route and the Itinerary day-map city fallback.
 * A stop that already has coordinates is never geocoded.
 */

import { storedStopCoords } from '@/lib/place-confirmation';
import { deriveNightsFromStop, geocodeContextForStop } from '@/lib/trip-stops';
import type { TripStop } from '@/types/trip';

export interface RoutePinGeocode {
  lat: number;
  lon: number;
  country?: string;
  source: string;
}

export interface UnresolvedStop {
  stopId: string;
  city: string;
}

export interface BuiltRoutePin {
  stopId: string;
  city: string;
  country?: string;
  destination: string;
  lat: number;
  lon: number;
  nights: number;
  order: number;
  geocodeSource: string;
}

export async function buildRouteMapPins(
  stops: TripStop[],
  geocode: (city: string, country?: string) => Promise<RoutePinGeocode | null>
): Promise<{ pins: BuiltRoutePin[]; unresolved: UnresolvedStop[] }> {
  const pins: BuiltRoutePin[] = [];
  const unresolved: UnresolvedStop[] = [];

  await Promise.all(
    stops.map(async (stop, index) => {
      const { city, country } = geocodeContextForStop(stop, stops);
      const stored = storedStopCoords(stop);
      const base = {
        stopId: stop.id,
        city,
        destination: stop.destination,
        nights: deriveNightsFromStop(stop),
        order: index,
      };
      if (stored) {
        pins.push({
          ...base,
          country: stop.country?.trim() || country,
          lat: stored.lat,
          lon: stored.lon,
          geocodeSource: 'stored',
        });
        return;
      }
      const coords = await geocode(city, country);
      if (!coords) {
        unresolved.push({ stopId: stop.id, city });
        return;
      }
      pins.push({
        ...base,
        country: country ?? coords.country,
        lat: coords.lat,
        lon: coords.lon,
        geocodeSource: coords.source,
      });
    })
  );

  pins.sort((a, b) => a.order - b.order);
  return { pins, unresolved };
}
