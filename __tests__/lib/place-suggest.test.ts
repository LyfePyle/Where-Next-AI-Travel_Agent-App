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
    expect(hits[1].label).toBe('Khao Sok National Park, Surat Thani, Thailand');
    expect(hits.every((h) => h.storable)).toBe(true);
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
  });
});
