import {
  attachSuggestionPlaceToStops,
  knownNightsFromStop,
  tripKnownNights,
} from '@/lib/trip-stops';
import { applyDurationNights, evenSplitNights } from '@/lib/split-stop-nights';
import type { TripStop } from '@/types/trip';

function stop(partial: Partial<TripStop> & { destination: string }): TripStop {
  return {
    id: partial.id ?? 'stop-0',
    destination: partial.destination,
    startDate: partial.startDate ?? '',
    endDate: partial.endDate ?? '',
    city: partial.city,
    country: partial.country,
    nights: partial.nights,
    order: partial.order ?? 0,
  };
}

describe('knownNightsFromStop', () => {
  it('returns null when a stop has no nights and no dates (does not invent 3)', () => {
    expect(
      knownNightsFromStop(stop({ destination: 'Swiss Alps Nature Retreat' }))
    ).toBeNull();
  });

  it('uses stored nights without requiring calendar dates', () => {
    expect(
      knownNightsFromStop(stop({ destination: 'Zermatt', nights: 5 }))
    ).toBe(5);
  });

  it('uses the date span when nights are unset', () => {
    expect(
      knownNightsFromStop(
        stop({ destination: 'Bali', startDate: '2026-10-01', endDate: '2026-10-08' })
      )
    ).toBe(7);
  });
});

describe('tripKnownNights', () => {
  it('is null if any stop is still length-less', () => {
    expect(
      tripKnownNights([
        stop({ id: 'a', destination: 'Zurich', nights: 2 }),
        stop({ id: 'b', destination: 'Zermatt' }),
      ])
    ).toBeNull();
  });

  it('sums known nights across stops', () => {
    expect(
      tripKnownNights([
        stop({ id: 'a', destination: 'Zurich', nights: 2 }),
        stop({ id: 'b', destination: 'Zermatt', nights: 3 }),
      ])
    ).toBe(5);
  });
});

describe('applyDurationNights', () => {
  it('persists an even split without inventing start/end dates', () => {
    const next = applyDurationNights(
      [
        stop({ id: 'a', destination: 'Zurich' }),
        stop({ id: 'b', destination: 'Zermatt' }),
      ],
      5
    );
    expect(evenSplitNights(5, 2)).toEqual([3, 2]);
    expect(next.map((s) => s.nights)).toEqual([3, 2]);
    expect(next.every((s) => s.startDate === '' && s.endDate === '')).toBe(true);
  });
});

describe('attachSuggestionPlaceToStops', () => {
  it('keeps the evocative title and fills city/country on a single stop', () => {
    const [next] = attachSuggestionPlaceToStops(
      [stop({ destination: 'Swiss Alps Nature Retreat' })],
      { city: 'Zermatt', country: 'Switzerland' }
    );
    expect(next.destination).toBe('Swiss Alps Nature Retreat');
    expect(next.city).toBe('Zermatt');
    expect(next.country).toBe('Switzerland');
  });

  it('does not overwrite an existing city', () => {
    const [next] = attachSuggestionPlaceToStops(
      [stop({ destination: 'Family Fun in Bali', city: 'Ubud', country: 'Indonesia' })],
      { city: 'Denpasar', country: 'Indonesia' }
    );
    expect(next.city).toBe('Ubud');
  });
});
