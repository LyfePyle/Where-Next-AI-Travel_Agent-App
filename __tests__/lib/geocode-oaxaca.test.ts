import { disambiguatedCountry } from '@/lib/geocode-disambiguation';
import { resolvePlace } from '@/lib/geocode-place';
import type { PlaceCandidate } from '@/lib/geocode-place';
import { pickConfidentMatch } from '@/lib/validate-place';

function cand(
  name: string,
  country: string,
  countryCode: string,
  score: number,
  lat: number,
  lon: number,
  state?: string
): PlaceCandidate {
  return {
    name,
    country,
    countryCode,
    score,
    lat,
    lon,
    state,
    source: 'nominatim',
  };
}

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body };
}

const OAXACA_CITY = { name: 'Oaxaca City', country: 'MX', state: 'Oaxaca', lat: 17.0605, lon: -96.7254 };
const OAXACA_SONORA = { name: 'Oaxaca', country: 'MX', state: 'Sonora', lat: 29.8228, lon: -110.9543 };
const OAXACA_VERACRUZ = { name: 'Oaxaca', country: 'MX', state: 'Veracruz', lat: 18.8184, lon: -96.723 };

describe('resolvePlace prominence', () => {
  const previousKey = process.env.OPENWEATHER_API_KEY;

  beforeEach(() => {
    process.env.OPENWEATHER_API_KEY = 'test-key';
  });

  afterEach(() => {
    process.env.OPENWEATHER_API_KEY = previousKey;
    (global.fetch as jest.Mock).mockReset();
  });

  function mockGeocoders(openWeather: unknown, nominatim: unknown = []) {
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      const href = String(url);
      if (href.includes('openweathermap')) return jsonResponse(openWeather);
      if (href.includes('nominatim')) return jsonResponse(nominatim);
      throw new Error(`unexpected fetch ${href}`);
    });
  }

  it('pins bare oaxaca on Oaxaca City, not the Sonora hamlet', async () => {
    mockGeocoders(
      [OAXACA_CITY, OAXACA_SONORA, OAXACA_VERACRUZ],
      [
        {
          lat: '29.8228',
          lon: '-110.9543',
          name: 'Oaxaca',
          importance: 0.1,
          place_rank: 20,
          type: 'hamlet',
          address: { village: 'Oaxaca', state: 'Sonora', country: 'Mexico', country_code: 'mx' },
        },
      ]
    );

    const result = await resolvePlace('oaxaca');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Oaxaca City');
    expect(result!.lat).toBeCloseTo(17.06, 1);
    expect(result!.lon).toBeCloseTo(-96.72, 1);
    expect(String(result!.countryCode)).toMatch(/mx/i);
  });

  it('keeps Penang on Malaysia when OpenWeather only returns the Indonesia namesake', async () => {
    mockGeocoders(
      [
        { name: 'Penang', country: 'ID', state: 'East Java', lat: -7.957, lon: 114.082 },
      ],
      [
        {
          lat: '5.4141',
          lon: '100.3288',
          name: 'George Town',
          importance: 0.53,
          place_rank: 16,
          class: 'place',
          type: 'city',
          address: {
            city: 'George Town',
            state: 'Penang',
            country: 'Malaysia',
            country_code: 'my',
          },
        },
      ]
    );

    const result = await resolvePlace('Penang');
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(5.41, 1);
    expect(result!.lon).toBeCloseTo(100.33, 1);
    expect(result!.country.toLowerCase()).toContain('malaysia');
  });

  it('keeps george town in Penang rather than a later exact namesake', async () => {
    mockGeocoders([
      { name: 'North-East', country: 'MY', state: 'Penang', lat: 5.414, lon: 100.329 },
      { name: 'George Town', country: 'IN', state: 'Tamil Nadu', lat: 13.092, lon: 80.282 },
      { name: 'George Town', country: 'AU', state: 'Tasmania', lat: -41.105, lon: 146.824 },
    ]);

    const result = await resolvePlace('george town');
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(5.41, 1);
    expect(result!.lon).toBeCloseTo(100.33, 1);
    expect(String(result!.countryCode)).toMatch(/my/i);
  });

  it('keeps Liberia, Costa Rica when that country is requested', async () => {
    mockGeocoders([
      { name: 'Liberia', country: 'CR', lat: 10.633, lon: -85.436 },
      { name: 'Liberia', country: 'LR', lat: 6.428, lon: -9.429 },
    ]);

    const result = await resolvePlace('Liberia', 'Costa Rica');
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(10.63, 1);
    expect(result!.lon).toBeCloseTo(-85.44, 1);
    expect(String(result!.countryCode)).toMatch(/cr/i);
  });

  it('prefers prominent Bali over an exact-name match in Bhutan', async () => {
    mockGeocoders(
      [
        { name: 'Paris', country: 'FR', lat: 48.859, lon: 2.32 },
        { name: 'Pulau Bali', country: 'ID', state: 'Bali', lat: -8.456, lon: 115.27 },
        { name: 'Bali', country: 'BT', state: 'Punakha District', lat: 27.663, lon: 89.791 },
      ],
      [
        {
          lat: '-8.227',
          lon: '115.192',
          name: 'Bali',
          importance: 0.646,
          place_rank: 8,
          class: 'boundary',
          type: 'administrative',
          address: { state: 'Bali', country: 'Indonesia', country_code: 'id' },
        },
      ]
    );

    const result = await resolvePlace('Bali');
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(-8.4, 0);
    expect(result!.lon).toBeCloseTo(115.2, 0);
    expect(String(result!.countryCode)).toMatch(/id/i);
  });

  it('keeps Berlin on the German capital when OpenWeather lists it first', async () => {
    mockGeocoders([
      { name: 'Berlin', country: 'DE', lat: 52.511, lon: 13.399 },
      { name: 'Berlin', country: 'US', state: 'New Hampshire', lat: 44.47, lon: -71.181 },
    ]);

    const result = await resolvePlace('Berlin');
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(52.51, 1);
    expect(result!.lon).toBeCloseTo(13.4, 1);
    expect(String(result!.countryCode)).toMatch(/de/i);
  });
});

describe('pickConfidentMatch same-country regions', () => {
  it('asks which Oaxaca when a same-country hamlet is far away and scores are close', () => {
    const picked = pickConfidentMatch('oaxaca', [
      cand('Oaxaca City', 'Mexico', 'MX', 180, 17.0605, -96.7254, 'Oaxaca'),
      cand('Oaxaca', 'Mexico', 'MX', 160, 29.8228, -110.9543, 'Sonora'),
    ]);
    expect(picked.type).toBe('ambiguous');
    if (picked.type === 'ambiguous') {
      const states = picked.candidates.map((candidate) => candidate.state);
      expect(states).toEqual(expect.arrayContaining(['Oaxaca', 'Sonora']));
    }
  });

  it('keeps Oaxaca City when it is a clear prominence winner', () => {
    const picked = pickConfidentMatch('oaxaca', [
      cand('Oaxaca City', 'Mexico', 'MX', 300, 17.0605, -96.7254, 'Oaxaca'),
      cand('Oaxaca', 'Mexico', 'MX', 160, 29.8228, -110.9543, 'Sonora'),
    ]);
    expect(picked.type).toBe('single');
    if (picked.type === 'single') {
      expect(picked.candidate.name).toBe('Oaxaca City');
      expect(picked.candidate.lat).toBeCloseTo(17.06, 1);
    }
  });

  it('does not split nearby same-country duplicates', () => {
    const picked = pickConfidentMatch('Berlin', [
      cand('Berlin', 'Germany', 'DE', 200, 52.52, 13.4),
      cand('Berlin', 'Germany', 'DE', 180, 52.5, 13.38),
    ]);
    expect(picked.type).toBe('single');
  });

  it('still forces george town to Malaysia', () => {
    const picked = pickConfidentMatch('george town', [
      cand('George Town', 'India', 'IN', 300, 13.09, 80.28, 'Tamil Nadu'),
      cand('George Town', 'Malaysia', 'MY', 120, 5.414, 100.329, 'Penang'),
    ]);
    expect(picked.type).toBe('single');
    if (picked.type === 'single') expect(picked.candidate.countryCode).toBe('MY');
  });

  it('still treats cross-country Liberia as ambiguous', () => {
    const picked = pickConfidentMatch('Liberia', [
      cand('Liberia', 'Liberia', 'LR', 200, 6.43, -9.43),
      cand('Liberia', 'Costa Rica', 'CR', 150, 10.63, -85.44),
    ]);
    expect(picked.type).toBe('ambiguous');
  });

  it('keeps a prominent Bali without asking', () => {
    const picked = pickConfidentMatch('Bali', [
      cand('Bali', 'Indonesia', 'ID', 400, -8.34, 115.09),
      cand('Bali', 'Bhutan', 'BT', 200, 27.66, 89.79),
    ]);
    expect(picked.type).toBe('single');
    if (picked.type === 'single') expect(picked.candidate.countryCode).toBe('ID');
  });

  it('keeps a prominent Berlin without asking', () => {
    const picked = pickConfidentMatch('Berlin', [
      cand('Berlin', 'Germany', 'DE', 400, 52.52, 13.4),
      cand('Berlin', 'United States', 'US', 180, 44.47, -71.18),
    ]);
    expect(picked.type).toBe('single');
    if (picked.type === 'single') expect(picked.candidate.countryCode).toBe('DE');
  });
});

describe('disambiguation overrides still apply', () => {
  it.each(['Penang', 'george town', 'Langkawi', 'Kuala Lumpur', 'Malacca', 'Ipoh'])(
    'forces %s to Malaysia',
    (city) => {
      expect(disambiguatedCountry(city)).toBe('Malaysia');
    }
  );
});
