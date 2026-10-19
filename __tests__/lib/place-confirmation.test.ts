import {
  applyConfirmedPlace,
  gateForValidation,
  storedStopCoords,
} from '@/lib/place-confirmation';
import { bookableDestinationFromStop } from '@/lib/bookable-place';
import { normalizeStop } from '@/lib/trip-stops';
import type { ValidatedPlace } from '@/lib/validate-place';
import type { TripStop } from '@/types/trip';

function place(partial: Partial<ValidatedPlace> & Pick<ValidatedPlace, 'name' | 'country' | 'lat' | 'lng'>): ValidatedPlace {
  return {
    place: partial.place ?? partial.name,
    name: partial.name,
    country: partial.country,
    lat: partial.lat,
    lng: partial.lng,
    state: partial.state,
    countryCode: partial.countryCode,
  };
}

function stop(destination: string): TripStop {
  return {
    id: 's1',
    destination,
    startDate: '2026-12-01',
    endDate: '2026-12-04',
  };
}

describe('gateForValidation', () => {
  it('skips the prompt when the place is confident', () => {
    const confirmed = place({
      name: 'Berlin',
      country: 'Germany',
      lat: 52.52,
      lng: 13.4,
    });
    expect(gateForValidation({ ok: true, validated: confirmed }, 'Berlin').type).toBe(
      'confident'
    );
  });

  it('shows candidates for an ambiguous name', () => {
    const candidates = [
      place({ name: 'Oaxaca City', place: 'Oaxaca City, Oaxaca', state: 'Oaxaca', country: 'Mexico', lat: 17.06, lng: -96.72 }),
      place({ name: 'Oaxaca', place: 'Oaxaca, Sonora', state: 'Sonora', country: 'Mexico', lat: 29.82, lng: -110.95 }),
    ];
    const gate = gateForValidation(
      { ok: false, ambiguous: true, candidates },
      'oaxaca'
    );
    expect(gate.type).toBe('choose');
    if (gate.type === 'choose') expect(gate.candidates).toHaveLength(2);
  });

  it('asks the user to edit when the name is unknown', () => {
    const gate = gateForValidation({ ok: false, error: 'miss' }, 'ziploite');
    expect(gate.type).toBe('edit');
    if (gate.type === 'edit') {
      expect(gate.message).toContain('ziploite');
      expect(gate.message.toLowerCase()).toContain('edit');
    }
  });
});

describe('applyConfirmedPlace', () => {
  it('stores the confirmed city, country, coordinates, and display name', () => {
    const next = applyConfirmedPlace(
      stop('puerto escondido'),
      place({
        name: 'Puerto Escondido',
        state: 'Oaxaca',
        country: 'Mexico',
        lat: 15.86,
        lng: -97.07,
      })
    );
    expect(next.city).toBe('Puerto Escondido');
    expect(next.country).toBe('Mexico');
    expect(next.lat).toBeCloseTo(15.86, 2);
    expect(next.lng).toBeCloseTo(-97.07, 2);
    expect(next.destination).toBe('Puerto Escondido, Oaxaca, Mexico');
    expect(bookableDestinationFromStop(next)).toBe('Puerto Escondido, Mexico');
  });
});

describe('stored coordinates', () => {
  it('prefers coordinates saved on the stop over the typed text', () => {
    const saved = normalizeStop(
      {
        destination: 'Playa ziploite',
        city: 'Playa Zipolite',
        country: 'Mexico',
        lat: 15.66,
        lng: -96.5,
      },
      0
    );
    expect(saved).not.toBeNull();
    expect(storedStopCoords(saved!)).toEqual({ lat: 15.66, lon: -96.5 });
  });

  it('leaves older stops without coordinates for live geocoding', () => {
    const older = normalizeStop({ destination: 'oaxaca' }, 0);
    expect(storedStopCoords(older!)).toBeNull();
  });
});
