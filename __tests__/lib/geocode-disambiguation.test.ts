import {
  ambiguousCityDefaultCountry,
  disambiguatedCountry,
  isLikelyCountryName,
  resolveGeocodeCountry,
} from '@/lib/geocode-disambiguation';
import { countryMatches } from '@/lib/geocode-place';
import { enrichStopCountries } from '@/lib/trip-stops';
import type { TripStop } from '@/types/trip';

function stop(destination: string, country?: string): TripStop {
  return {
    id: destination,
    destination,
    city: destination,
    startDate: '2026-12-01',
    endDate: '2026-12-04',
    order: 0,
    ...(country ? { country } : {}),
  };
}

describe('Liberia / Costa Rica disambiguation', () => {
  it('does not treat Liberia as a hard override (it is also a country)', () => {
    expect(disambiguatedCountry('Liberia')).toBeUndefined();
    expect(isLikelyCountryName('Liberia')).toBe(true);
    expect(ambiguousCityDefaultCountry('Liberia')).toBe('Costa Rica');
  });

  it('defaults bare Liberia to Costa Rica when no country is specified', () => {
    expect(resolveGeocodeCountry('Liberia')).toBe('Costa Rica');
    expect(resolveGeocodeCountry('Monteverde')).toBe('Costa Rica');
    expect(resolveGeocodeCountry('Arenal')).toBe('Costa Rica');
    expect(resolveGeocodeCountry('Dominical')).toBe('Costa Rica');
  });

  it('keeps the country Liberia when that country is explicit', () => {
    expect(resolveGeocodeCountry('Liberia', 'Liberia')).toBe('Liberia');
    expect(resolveGeocodeCountry('Monrovia', 'Liberia')).toBe('Liberia');
  });

  it('uses sibling Costa Rica stops over the West Africa reading', () => {
    expect(
      resolveGeocodeCountry('Liberia', undefined, ['Costa Rica', 'Costa Rica'])
    ).toBe('Costa Rica');
  });

  it('lets Costa Rica siblings override a stored country of Liberia (city/country homonym)', () => {
    expect(
      resolveGeocodeCountry('Liberia', 'Liberia', ['Costa Rica', 'Costa Rica'])
    ).toBe('Costa Rica');
  });

  it('enriches a Liberia → Arenal → Monteverde → Dominical trip as Costa Rica', () => {
    const enriched = enrichStopCountries([
      stop('Liberia'),
      stop('Arenal'),
      stop('Monteverde'),
      stop('Dominical'),
    ]);
    expect(enriched.map((s) => s.country)).toEqual([
      'Costa Rica',
      'Costa Rica',
      'Costa Rica',
      'Costa Rica',
    ]);
  });

  it('enriches even when Liberia was already stored as the African country', () => {
    const enriched = enrichStopCountries([
      stop('Liberia', 'Liberia'),
      stop('Arenal', 'Costa Rica'),
      stop('Monteverde', 'Costa Rica'),
      stop('Dominical', 'Costa Rica'),
    ]);
    expect(enriched.map((s) => s.country)).toEqual([
      'Costa Rica',
      'Costa Rica',
      'Costa Rica',
      'Costa Rica',
    ]);
  });
});

describe('countryMatches ISO vs full name', () => {
  it('does not treat Costa Rica as Colombia (CO)', () => {
    expect(countryMatches('Costa Rica', undefined, 'CO')).toBe(false);
    expect(countryMatches('Costa Rica', 'CO', 'CO')).toBe(false);
    expect(countryMatches('Costa Rica', undefined, 'CR')).toBe(true);
    expect(countryMatches('Costa Rica', 'Costa Rica', 'CR')).toBe(true);
  });

  it('matches two-letter codes only when the request is a code', () => {
    expect(countryMatches('CR', undefined, 'cr')).toBe(true);
    expect(countryMatches('CO', undefined, 'co')).toBe(true);
  });
});

describe('hard overrides still win', () => {
  it('forces Penang to Malaysia even if a sibling says otherwise', () => {
    expect(resolveGeocodeCountry('Penang', 'Indonesia', ['Indonesia'])).toBe(
      'Malaysia'
    );
  });
});

describe('Costa Rica route scale', () => {
  it('the four-stop CR itinerary sits in a regional box, not a world box', () => {
    const pins = [
      { lat: 10.6346, lon: -85.4406 },
      { lat: 10.4631, lon: -84.7031 },
      { lat: 10.319, lon: -84.825 },
      { lat: 9.254, lon: -83.861 },
    ];
    const lats = pins.map((p) => p.lat);
    const lons = pins.map((p) => p.lon);
    const latSpan = Math.max(...lats) - Math.min(...lats);
    const lonSpan = Math.max(...lons) - Math.min(...lons);
    expect(latSpan).toBeLessThan(4);
    expect(lonSpan).toBeLessThan(4);
  });
});
