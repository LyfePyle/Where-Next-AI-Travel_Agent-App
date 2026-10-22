import {
  dedupePlaceSuggestions,
  isSuggestablePhotonPlace,
  mergePlaceSuggestions,
  orderSuggestionsByBias,
  photonSearchUrl,
  placeSuggestionLabel,
  suggestionsFromPhoton,
  type PlaceSuggestion,
} from '@/lib/place-suggest';

function feature(
  name: string,
  state: string,
  country: string,
  lng: number,
  lat: number,
  osmKey: string,
  osmValue: string,
  type: string
) {
  return {
    geometry: { coordinates: [lng, lat] },
    properties: {
      name,
      state,
      country,
      type,
      osm_key: osmKey,
      osm_value: osmValue,
    },
  };
}

function item(
  partial: Partial<PlaceSuggestion> & Pick<PlaceSuggestion, 'city' | 'country'>
): PlaceSuggestion {
  const region = partial.region;
  return {
    label: placeSuggestionLabel(partial.city, region, partial.country),
    lat: partial.lat ?? 1,
    lng: partial.lng ?? 2,
    storable: partial.storable ?? true,
    ...partial,
    label: partial.label ?? placeSuggestionLabel(partial.city, region, partial.country),
  };
}

describe('mergePlaceSuggestions', () => {
  it('ignores queries shorter than 3 characters', () => {
    expect(
      mergePlaceSuggestions('va', [item({ city: 'Vancouver', country: 'Canada' })])
    ).toEqual([]);
  });

  it('keeps a small beach town', () => {
    const merged = mergePlaceSuggestions('Zipolite', [
      item({
        city: 'Zipolite',
        region: 'Oaxaca',
        country: 'Mexico',
        lat: 15.66,
        lng: -96.52,
      }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].storable).toBe(true);
    expect(merged[0].label).toBe('Zipolite, Oaxaca, Mexico');
  });

  it('drops a second row for the same place', () => {
    const dominical = item({
      city: 'Liberia',
      region: 'Guanacaste',
      country: 'Costa Rica',
      lat: 10.63,
      lng: -85.44,
    });
    const county = { ...dominical, region: 'Guanacaste', lat: 10.64, lng: -85.45 };
    expect(dedupePlaceSuggestions([dominical, county])).toHaveLength(1);
  });
});

describe('orderSuggestionsByBias', () => {
  it('moves Costa Rica Dominical ahead of Panama when the bias is near Quepos', () => {
    const panama = item({
      city: 'Dominical',
      region: 'Chiriquí',
      country: 'Panama',
      lat: 8.53,
      lng: -82.72,
    });
    const costaRica = item({
      city: 'Dominical',
      region: 'Puntarenas',
      country: 'Costa Rica',
      lat: 9.25,
      lng: -83.86,
    });
    const ordered = orderSuggestionsByBias([panama, costaRica], { lat: 9.43, lng: -84.16 });
    expect(ordered[0].country).toBe('Costa Rica');
    expect(mergePlaceSuggestions('Dominical', [panama, costaRica], { lat: 9.43, lng: -84.16 })[0].country).toBe(
      'Costa Rica'
    );
  });
});

describe('suggestionsFromPhoton', () => {
  it('keeps a town and a national park, and drops a house', () => {
    const hits = suggestionsFromPhoton([
      {
        geometry: { coordinates: [-96.52, 15.66] },
        properties: {
          name: 'Zipolite',
          state: 'Oaxaca',
          country: 'Mexico',
          type: 'district',
          osm_key: 'place',
          osm_value: 'hamlet',
        },
      },
      {
        geometry: { coordinates: [98.53, 8.94] },
        properties: {
          name: 'Khao Sok National Park',
          state: 'Surat Thani',
          country: 'Thailand',
          type: 'other',
          osm_key: 'boundary',
          osm_value: 'national_park',
        },
      },
      {
        geometry: { coordinates: [-3.7, 40.4] },
        properties: { name: 'Zipolite', state: 'Madrid', country: 'Spain', type: 'house' },
      },
    ]);
    expect(hits.map((h) => h.city)).toEqual(['Zipolite', 'Khao Sok National Park']);
    expect(hits[0].type).toBe('Hamlet');
    expect(hits[1].type).toBe('National park');
    expect(hits[1].label).toBe('Khao Sok National Park, Surat Thani, Thailand');
    expect(hits.every((h) => h.storable)).toBe(true);
  });

  it('keeps both Vancouvers and drops facilities that used the locality layer', () => {
    const features = [
      feature('Vancouver', 'British Columbia', 'Canada', -123.11, 49.26, 'place', 'city', 'city'),
      feature(
        'Vancouver Fire and Rescue Services Training Grounds',
        'British Columbia',
        'Canada',
        -123.08,
        49.27,
        'landuse',
        'industrial',
        'locality'
      ),
      feature(
        'Vancouver Transit Centre',
        'British Columbia',
        'Canada',
        -123.14,
        49.2,
        'landuse',
        'industrial',
        'locality'
      ),
      feature(
        'Vancouver Airport Fuel Facilities Corporation Fuel Receiving Facility',
        'British Columbia',
        'Canada',
        -123.05,
        49.14,
        'landuse',
        'industrial',
        'locality'
      ),
      feature(
        'Vancouver Landfill Gas Conditioning Facility',
        'British Columbia',
        'Canada',
        -123.02,
        49.1,
        'landuse',
        'industrial',
        'locality'
      ),
      feature('Vancouver', 'Washington', 'United States', -122.67, 45.63, 'place', 'city', 'city'),
    ];
    const merged = mergePlaceSuggestions('vancou', suggestionsFromPhoton(features), {
      lat: 49.28,
      lng: -123.12,
    });
    expect(merged.map((row) => row.label)).toEqual([
      'Vancouver, British Columbia, Canada',
      'Vancouver, Washington, United States',
    ]);
    const text = merged.map((row) => row.label).join(' ');
    expect(text).not.toMatch(/Facility|Training Grounds|Transit Centre|Landfill/i);
  });

  it('keeps Monteverde district, drops a province and a mall, and tags an area', () => {
    const hits = suggestionsFromPhoton([
      {
        geometry: { coordinates: [-84.82, 10.28] },
        properties: {
          name: 'Monteverde',
          state: 'Puntarenas Province',
          country: 'Costa Rica',
          osm_key: 'boundary',
          osm_value: 'administrative',
          extra: { admin_level: '8' },
        },
      },
      {
        geometry: { coordinates: [-84.0, 9.9] },
        properties: {
          name: 'Puntarenas',
          state: 'Puntarenas Province',
          country: 'Costa Rica',
          osm_key: 'boundary',
          osm_value: 'administrative',
          extra: { admin_level: '4' },
        },
      },
      feature('Vancouver Mall', 'Washington', 'United States', -122.59, 45.65, 'place', 'suburb', 'district'),
      feature('Vancouver Heights', 'Washington', 'United States', -122.6, 45.62, 'place', 'suburb', 'district'),
      {
        geometry: { coordinates: [-122.67, 45.63] },
        properties: {
          name: 'Vancouver',
          state: 'Washington',
          country: 'United States',
          osm_key: 'boundary',
          osm_value: 'administrative',
          extra: { admin_level: '8' },
        },
      },
    ]);
    expect(hits.map((row) => [row.city, row.type])).toEqual([
      ['Monteverde', 'District'],
      ['Vancouver Heights', 'Area'],
      ['Vancouver', 'District'],
    ]);
    const merged = mergePlaceSuggestions('monteverde', hits, { lat: 9.43, lng: -84.16 });
    expect(merged[0]).toMatchObject({
      city: 'Monteverde',
      country: 'Costa Rica',
      type: 'District',
    });
    expect(mergePlaceSuggestions('vancou', hits).map((row) => row.city)).toEqual(['Vancouver Heights']);
  });

  it('ranks a district behind a city or town', () => {
    const district = item({
      city: 'Monteverde',
      region: 'Puntarenas',
      country: 'Costa Rica',
      lat: 10.28,
      lng: -84.82,
      type: 'District',
    });
    const town = item({
      city: 'Monteverde',
      region: 'Puntarenas',
      country: 'Costa Rica',
      lat: 8.0,
      lng: -83.0,
      type: 'Town',
    });
    const ordered = orderSuggestionsByBias([district, town], { lat: 10.28, lng: -84.82 });
    expect(ordered.map((row) => row.type)).toEqual(['Town', 'District']);
  });

  it('rejects streets', () => {
    expect(isSuggestablePhotonPlace({ type: 'street', osm_key: 'highway', osm_value: 'residential' })).toBe(
      false
    );
  });
});

describe('photonSearchUrl', () => {
  it('asks Photon for place layers and a lat/lon bias', () => {
    const url = new URL(photonSearchUrl('Dominical', { lat: 9.93, lng: -84.09 }));
    expect(url.searchParams.get('lang')).toBe('en');
    expect(url.searchParams.get('lat')).toBe('9.93');
    expect(url.searchParams.get('lon')).toBe('-84.09');
    expect(url.searchParams.get('location_bias_scale')).toBe('0');
    expect(url.searchParams.getAll('layer')).toEqual(
      expect.arrayContaining(['city', 'locality', 'other'])
    );
    expect(url.searchParams.getAll('layer')).not.toContain('street');
    expect(url.searchParams.getAll('layer')).not.toContain('house');
    expect(url.searchParams.get('limit')).toBe('20');
  });
});
