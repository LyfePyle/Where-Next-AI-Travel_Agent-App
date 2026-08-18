import { itineraryDayMapPoints } from '@/lib/itinerary-map-points';
import type { ItineraryBlock } from '@/types/itinerary';

const PARIS_PIN = { lat: 48.8566, lon: 2.3522, city: 'Paris' };

function block(
  partial: Partial<ItineraryBlock> & { id: string; title: string }
): ItineraryBlock {
  return {
    time_of_day: 'morning',
    description: '',
    ...partial,
  };
}

describe('itineraryDayMapPoints', () => {
  it('plots located blocks and skips the city pin when every block has coords', () => {
    const points = itineraryDayMapPoints(
      {
        id: 'day-1',
        blocks: [
          block({
            id: 'a',
            title: 'Louvre',
            time_of_day: 'afternoon',
            lat: 48.86,
            lng: 2.337,
          }),
          block({ id: 'b', title: 'Sacré-Cœur', lat: 48.8867, lng: 2.3431 }),
        ],
      },
      PARIS_PIN
    );

    expect(points.map((p) => p.kind)).toEqual(['block', 'block']);
    expect(points[0]).toMatchObject({ id: 'b', order: 1 });
    expect(points[1]).toMatchObject({ id: 'a', order: 2 });
  });

  it('adds one city pin when any block is missing coords', () => {
    const points = itineraryDayMapPoints(
      {
        id: 'day-2',
        blocks: [
          block({ id: 'a', title: 'Louvre', lat: 48.86, lng: 2.337 }),
          block({ id: 'b', title: 'Easy first dinner' }),
        ],
      },
      PARIS_PIN
    );

    expect(points).toHaveLength(2);
    expect(points.some((p) => p.kind === 'city' && p.id === 'city-day-2')).toBe(true);
    expect(points.some((p) => p.kind === 'block' && p.id === 'a')).toBe(true);
  });

  it('falls back to only the city pin when the day has no located blocks', () => {
    const points = itineraryDayMapPoints(
      {
        id: 'day-old',
        blocks: [block({ id: 'x', title: 'Wander the neighborhood' })],
      },
      PARIS_PIN
    );

    expect(points).toEqual([
      {
        id: 'city-day-old',
        lat: 48.8566,
        lng: 2.3522,
        label: 'Paris',
        sublabel: 'City center',
        kind: 'city',
      },
    ]);
  });

  it('returns an empty list when there is no day and no city pin', () => {
    expect(itineraryDayMapPoints(null, null)).toEqual([]);
  });
});
