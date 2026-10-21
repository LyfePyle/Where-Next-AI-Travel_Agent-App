import { buildRouteMapPins } from '@/lib/route-map-pins';
import type { TripStop } from '@/types/trip';

function stop(partial: Partial<TripStop> & { id: string; destination: string }): TripStop {
  return {
    startDate: '2026-12-04',
    endDate: '2026-12-10',
    order: 0,
    ...partial,
  };
}

describe('buildRouteMapPins', () => {
  it('uses stored coordinates and does not geocode a mixed-country trip', async () => {
    const geocode = jest.fn(async () => ({
      lat: 19.43,
      lon: -99.13,
      country: 'Mexico',
      source: 'nominatim',
    }));

    const { pins } = await buildRouteMapPins(
      [
        stop({
          id: 'zip',
          destination: 'Zipolite, Oaxaca, Mexico',
          city: 'Zipolite',
          country: 'Mexico',
          lat: 15.664,
          lng: -96.52,
        }),
        stop({
          id: 'dom',
          destination: 'Dominical, Puntarenas, Costa Rica',
          city: 'Dominical',
          country: 'Costa Rica',
          lat: 9.254,
          lng: -83.861,
          order: 1,
        }),
        stop({
          id: 'khao',
          destination: 'Khao Sok, Surat Thani, Thailand',
          city: 'Khao Sok',
          country: 'Thailand',
          lat: 8.94,
          lng: 98.53,
          order: 2,
        }),
      ],
      geocode
    );

    expect(geocode).not.toHaveBeenCalled();
    expect(pins.map((p) => [p.city, p.country, p.lat])).toEqual([
      ['Zipolite', 'Mexico', 15.664],
      ['Dominical', 'Costa Rica', 9.254],
      ['Khao Sok', 'Thailand', 8.94],
    ]);
  });

  it('geocodes a stop that has no coordinates, using that stop’s country', async () => {
    const geocode = jest.fn(async (city: string, country?: string) => ({
      lat: city === 'Dominical' ? 9.254 : 15.664,
      lon: city === 'Dominical' ? -83.861 : -96.52,
      country,
      source: 'nominatim',
    }));

    const { pins } = await buildRouteMapPins(
      [
        stop({
          id: 'zip',
          destination: 'Zipolite, Mexico',
          city: 'Zipolite',
          country: 'Mexico',
          lat: 15.664,
          lng: -96.52,
        }),
        stop({
          id: 'dom',
          destination: 'Dominical, Costa Rica',
          city: 'Dominical',
          country: 'Costa Rica',
          order: 1,
        }),
      ],
      geocode
    );

    expect(geocode).toHaveBeenCalledTimes(1);
    expect(geocode).toHaveBeenCalledWith('Dominical', 'Costa Rica');
    expect(pins.find((p) => p.stopId === 'dom')).toMatchObject({
      lat: 9.254,
      lon: -83.861,
      country: 'Costa Rica',
      geocodeSource: 'nominatim',
    });
  });

  it('omits a pin when the place cannot be geocoded', async () => {
    const { pins, unresolved } = await buildRouteMapPins(
      [
        stop({
          id: 'dom',
          destination: 'Dominical, Costa Rica',
          city: 'Dominical',
          country: 'Costa Rica',
        }),
      ],
      async () => null
    );

    expect(pins).toEqual([]);
    expect(unresolved).toEqual([{ stopId: 'dom', city: 'Dominical' }]);
  });
});
