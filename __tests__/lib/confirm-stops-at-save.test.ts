import { confirmUnpinnedStops } from '@/lib/confirm-stops-at-save';
import type { PlaceValidationBody } from '@/lib/place-confirmation';
import type { TripStop } from '@/types/trip';

function stop(partial: Partial<TripStop> & Pick<TripStop, 'destination'>): TripStop {
  return {
    id: partial.id ?? 'stop-0',
    destination: partial.destination,
    city: partial.city,
    country: partial.country,
    lat: partial.lat,
    lng: partial.lng,
    startDate: '',
    endDate: '',
  };
}

function confident(name: string, country: string, state?: string): PlaceValidationBody {
  return {
    ok: true,
    validated: {
      place: name,
      name,
      country,
      state,
      lat: -8.506,
      lng: 115.262,
    },
  };
}

describe('confirmUnpinnedStops', () => {
  it('stores coordinates and the display name when the geocoder is confident', async () => {
    const [saved] = await confirmUnpinnedStops(
      [stop({ destination: 'Ubud', city: 'Ubud', country: 'Indonesia' })],
      {
        validate: async () => confident('Ubud', 'Indonesia', 'Bali'),
      }
    );
    expect(saved).toMatchObject({
      city: 'Ubud',
      country: 'Indonesia',
      destination: 'Ubud, Bali, Indonesia',
      lat: -8.506,
      lng: 115.262,
    });
  });

  it('leaves an ambiguous city without coordinates', async () => {
    const original = stop({
      destination: 'Springfield',
      city: 'Springfield',
      country: 'United States',
    });
    const [saved] = await confirmUnpinnedStops([original], {
      validate: async () => ({
        ok: false,
        ambiguous: true,
        error: 'Which Springfield?',
        candidates: [
          { place: 'Springfield', name: 'Springfield', country: 'USA', lat: 39.78, lng: -89.64 },
          { place: 'Springfield', name: 'Springfield', country: 'USA', state: 'Massachusetts', lat: 42.1, lng: -72.58 },
        ],
      }),
    });
    expect(saved.lat).toBeUndefined();
    expect(saved.lng).toBeUndefined();
    expect(saved.destination).toBe('Springfield');
  });

  it('saves the stop when the geocoder fails', async () => {
    const original = stop({ destination: 'Ubud', city: 'Ubud', country: 'Indonesia' });
    const [saved] = await confirmUnpinnedStops([original], {
      validate: async () => {
        throw new Error('geocoder down');
      },
    });
    expect(saved).toEqual(original);
  });

  it('saves the stop when the geocoder is too slow', async () => {
    const original = stop({ destination: 'Kahului', city: 'Kahului', country: 'United States' });
    const started = Date.now();
    let release: (value: PlaceValidationBody) => void = () => {};
    const hung = new Promise<PlaceValidationBody>((resolve) => {
      release = resolve;
    });
    const [saved] = await confirmUnpinnedStops([original], {
      budgetMs: 40,
      validate: () => hung,
    });
    expect(Date.now() - started).toBeLessThan(500);
    expect(saved.lat).toBeUndefined();
    expect(saved).toEqual(original);
    release(confident('Kahului', 'United States', 'Hawaii'));
  });

  it('does not restore coordinates after the place text was edited', async () => {
    let calls = 0;
    const edited = stop({ destination: 'Zipolite beach' });
    const [saved] = await confirmUnpinnedStops([edited], {
      validate: async () => {
        calls += 1;
        return confident('Zipolite', 'Mexico', 'Oaxaca');
      },
    });
    expect(calls).toBe(0);
    expect(saved).toEqual(edited);
  });

  it('does not look up a stop that already has coordinates', async () => {
    let calls = 0;
    const pinned = stop({
      destination: 'Zipolite, Oaxaca, Mexico',
      city: 'Zipolite',
      country: 'Mexico',
      lat: 15.665,
      lng: -96.527,
    });
    const [saved] = await confirmUnpinnedStops([pinned], {
      validate: async () => {
        calls += 1;
        return confident('Somewhere', 'Mexico');
      },
    });
    expect(calls).toBe(0);
    expect(saved).toEqual(pinned);
  });

  it('looks up several unpinned stops together', async () => {
    const seen: string[] = [];
    const saved = await confirmUnpinnedStops(
      [
        stop({ id: 'a', destination: 'Ubud', city: 'Ubud', country: 'Indonesia' }),
        stop({ id: 'b', destination: 'Kahului', city: 'Kahului', country: 'United States' }),
      ],
      {
        validate: async (item) => {
          seen.push(item.city ?? '');
          return {
            ok: true,
            validated: {
              place: item.city ?? '',
              name: item.city ?? '',
              country: item.country ?? '',
              lat: item.city === 'Ubud' ? -8.5 : 20.89,
              lng: item.city === 'Ubud' ? 115.26 : -156.47,
            },
          };
        },
      }
    );
    expect(seen.sort()).toEqual(['Kahului', 'Ubud']);
    expect(saved.map((item) => item.lat)).toEqual([-8.5, 20.89]);
  });
});
