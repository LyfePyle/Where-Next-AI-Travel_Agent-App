import {
  attachCoordsToBlocks,
  CITY_CENTROID_KM,
  kmBetween,
  resolveBlockCoords,
} from '@/lib/geocode-itinerary-block';
import type { ItineraryBlock } from '@/types/itinerary';

const PARIS = { lat: 48.8566, lng: 2.3522 };
const LOUVRE = { lat: 48.8606, lng: 2.3376 };
const NYC = { lat: 40.7128, lng: -74.006 };

function block(partial: Partial<ItineraryBlock> & { title: string }): ItineraryBlock {
  return {
    id: 'blk-test',
    time_of_day: 'morning',
    description: '',
    ...partial,
  };
}

describe('kmBetween / city proximity', () => {
  it('treats the Louvre as near Paris and NYC as not', () => {
    expect(kmBetween(PARIS, LOUVRE)).toBeLessThan(5);
    expect(kmBetween(PARIS, NYC)).toBeGreaterThan(5000);
  });
});

describe('resolveBlockCoords', () => {
  it('prefers a geocoded named place over model coords', async () => {
    const point = await resolveBlockCoords(
      block({
        title: 'Louvre morning',
        place: 'Louvre Museum',
        lat: 48.85,
        lng: 2.3,
      }),
      'Paris',
      'France',
      PARIS,
      {
        geocodeVenueFn: async () => LOUVRE,
      }
    );
    expect(point).toEqual(LOUVRE);
  });

  it('uses model coords when geocode misses but they sit near the city', async () => {
    const point = await resolveBlockCoords(
      block({
        title: 'Hidden courtyard',
        place: 'Cour du Commerce Saint-André',
        lat: LOUVRE.lat,
        lng: LOUVRE.lng,
      }),
      'Paris',
      'France',
      PARIS,
      {
        geocodeVenueFn: async () => null,
      }
    );
    expect(point).toEqual(LOUVRE);
  });

  it('drops model coords in the wrong city', async () => {
    const point = await resolveBlockCoords(
      block({
        title: 'Statue of Liberty',
        place: 'Statue of Liberty',
        lat: NYC.lat,
        lng: NYC.lng,
      }),
      'Paris',
      'France',
      PARIS,
      {
        geocodeVenueFn: async () => null,
      }
    );
    expect(point).toBeNull();
  });

  it('omits city-centroid hits when the block has no named place', async () => {
    const point = await resolveBlockCoords(
      block({ title: 'Easy first dinner in Paris' }),
      'Paris',
      'France',
      PARIS,
      {
        geocodeVenueFn: async () => ({
          lat: PARIS.lat + 0.001,
          lng: PARIS.lng,
        }),
      }
    );
    expect(point).toBeNull();
    expect(kmBetween(PARIS, { lat: PARIS.lat + 0.001, lng: PARIS.lng })).toBeLessThan(
      CITY_CENTROID_KM
    );
  });
});

describe('attachCoordsToBlocks', () => {
  it('writes lat/lng onto blocks that resolve and strips misses', async () => {
    const [sacre, dinner] = await attachCoordsToBlocks(
      [
        block({ id: 'a', title: 'Sacré-Cœur', place: 'Sacré-Cœur', lat: NYC.lat, lng: NYC.lng }),
        block({ id: 'b', title: 'Easy first dinner in Paris' }),
      ],
      'Paris',
      'France',
      {
        geocodeCityFn: async () => PARIS,
        geocodeVenueFn: async (venue) => (venue.includes('Sacré') ? LOUVRE : PARIS),
      }
    );

    expect(sacre.lat).toBe(LOUVRE.lat);
    expect(sacre.lng).toBe(LOUVRE.lng);
    expect(dinner.lat).toBeUndefined();
    expect(dinner.lng).toBeUndefined();
  });
});
