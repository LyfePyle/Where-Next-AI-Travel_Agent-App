import {
  buildDrillDownView,
  buildStopsFromSelection,
} from '@/lib/suggestion-drilldown';
import { attachSuggestionPlaceToStops, serializeStopsForDb } from '@/lib/trip-stops';
import { stopsFromSearchParams, type TripStop } from '@/types/trip';

const picked: TripStop[] = [
  {
    id: 'stop-0',
    destination: 'Zipolite, Oaxaca, Mexico',
    city: 'Zipolite',
    country: 'Mexico',
    lat: 15.665,
    lng: -96.527,
    startDate: '2026-12-04',
    endDate: '2026-12-10',
    order: 0,
  },
  {
    id: 'stop-1',
    destination: 'Dominical, Puntarenas, Costa Rica',
    city: 'Dominical',
    country: 'Costa Rica',
    lat: 9.248,
    lng: -83.859,
    startDate: '2026-12-10',
    endDate: '2026-12-16',
    order: 1,
  },
  {
    id: 'stop-2',
    destination: 'Khao Sok, Surat Thani, Thailand',
    city: 'Khao Sok',
    country: 'Thailand',
    lat: 8.916,
    lng: 98.53,
    startDate: '2026-12-16',
    endDate: '2026-12-22',
    order: 2,
  },
];

function placeFields(stops: TripStop[]) {
  return stops.map((stop) => ({
    city: stop.city,
    country: stop.country,
    destination: stop.destination,
    lat: stop.lat,
    lng: stop.lng,
  }));
}

describe('picked coordinates through the suggestions save', () => {
  it('keeps lat, lng, and the region-bearing name on every stop of a three-country trip', () => {
    const view = buildDrillDownView(picked, [], null, '');
    expect(view).not.toBeNull();
    const ids = new Set(view!.countryGroups.flatMap((group) => group.stops.map((stop) => stop.id)));
    const rebuilt = buildStopsFromSelection(view!.countryGroups, ids, null, '2026-12-04', '2026-12-22');
    const saved = serializeStopsForDb(rebuilt);

    expect(placeFields(saved ?? [])).toEqual(placeFields(picked));
    for (const stop of saved ?? []) {
      expect(stop.destination.split(',').length).toBeGreaterThanOrEqual(3);
    }
  });

  it('stores the same place fields on the card save path and the drill-down save path', () => {
    const view = buildDrillDownView(picked, [], null, '');
    const ids = new Set(view!.countryGroups.flatMap((group) => group.stops.map((stop) => stop.id)));
    const drillDown = serializeStopsForDb(
      buildStopsFromSelection(view!.countryGroups, ids, null, '2026-12-04', '2026-12-22')
    );
    const card = serializeStopsForDb(
      attachSuggestionPlaceToStops(picked, { city: 'Zipolite', country: 'Mexico' })
    );

    expect(placeFields(card ?? [])).toEqual(placeFields(drillDown ?? []));
    expect(card?.every((stop) => typeof stop.lat === 'number' && typeof stop.lng === 'number')).toBe(
      true
    );
  });

  it('keeps an older URL that has no stops parameter', () => {
    const params = new URLSearchParams({
      destination: 'Oaxaca, Mexico',
      startDate: '2026-12-04',
      endDate: '2026-12-10',
    });
    const stops = stopsFromSearchParams(params);
    expect(stops).toHaveLength(1);
    expect(stops[0].destination).toBe('Oaxaca, Mexico');
    expect(stops[0].lat).toBeUndefined();
    expect(stops[0].lng).toBeUndefined();
  });
});
