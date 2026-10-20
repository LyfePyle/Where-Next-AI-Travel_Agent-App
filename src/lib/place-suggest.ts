/** One row in the place dropdown. Coordinates come from Photon and may be stored. */
export type PlaceSuggestion = {
  label: string;
  city: string;
  region?: string;
  country: string;
  lat: number;
  lng: number;
  /** Photon/OpenStreetMap results may be stored. */
  storable: boolean;
};

export type PlaceBias = { lat: number; lng: number };

export const PLACE_SUGGEST_LIMIT = 5;
export const PLACE_SUGGEST_MIN_CHARS = 3;
export const PHOTON_SUGGEST_FETCH_LIMIT = 10;

/** Photon layers that are places, regions, or parks. Streets and houses stay out. */
export const PHOTON_PLACE_LAYERS = [
  'city',
  'locality',
  'district',
  'county',
  'state',
  'country',
  'other',
] as const;

const DROPPED_TYPES = new Set(['house', 'street']);
const KEPT_TYPES = new Set(['city', 'locality', 'district', 'county', 'state', 'country']);

export function placeSuggestionLabel(city: string, region?: string, country?: string): string {
  const area =
    region?.trim() && region.trim().toLowerCase() !== city.trim().toLowerCase()
      ? region.trim()
      : undefined;
  return [city.trim(), area, country?.trim()].filter(Boolean).join(', ');
}

function distanceKm(a: PlaceBias, b: PlaceBias): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Prefer places nearer the bias point. Photon alone does not move every wrong-country hit. */
export function orderSuggestionsByBias(
  items: PlaceSuggestion[],
  bias?: PlaceBias | null
): PlaceSuggestion[] {
  if (!bias || !Number.isFinite(bias.lat) || !Number.isFinite(bias.lng)) return items;
  return [...items].sort((a, b) => distanceKm(bias, a) - distanceKm(bias, b));
}

/** Drop a second row with the same name and country sitting on the same spot. */
export function dedupePlaceSuggestions(items: PlaceSuggestion[]): PlaceSuggestion[] {
  const out: PlaceSuggestion[] = [];
  for (const item of items) {
    const name = item.city.trim().toLowerCase();
    const country = item.country.trim().toLowerCase();
    const duplicate = out.some(
      (kept) =>
        kept.city.trim().toLowerCase() === name &&
        kept.country.trim().toLowerCase() === country &&
        distanceKm(kept, item) < 30
    );
    if (!duplicate) out.push(item);
  }
  return out;
}

export function mergePlaceSuggestions(
  query: string,
  photon: PlaceSuggestion[],
  bias?: PlaceBias | null
): PlaceSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < PLACE_SUGGEST_MIN_CHARS) return [];

  const matched = photon.filter(
    (item) =>
      item.city.toLowerCase().startsWith(q) &&
      item.country.trim() &&
      Number.isFinite(item.lat) &&
      Number.isFinite(item.lng)
  );
  return dedupePlaceSuggestions(orderSuggestionsByBias(matched, bias)).slice(
    0,
    PLACE_SUGGEST_LIMIT
  );
}

export type PhotonFeature = {
  geometry?: { coordinates?: number[] };
  properties?: {
    name?: string;
    state?: string;
    county?: string;
    country?: string;
    type?: string;
    osm_key?: string;
    osm_value?: string;
  };
};

export function isSuggestablePhotonPlace(
  props: NonNullable<PhotonFeature['properties']>
): boolean {
  const type = (props.type || '').toLowerCase();
  if (DROPPED_TYPES.has(type)) return false;
  const key = (props.osm_key || '').toLowerCase();
  const value = (props.osm_value || '').toLowerCase();
  if (key === 'place') return true;
  if (
    key === 'boundary' &&
    (value === 'national_park' || value === 'protected_area' || value === 'administrative')
  ) {
    return true;
  }
  if (key === 'natural' && (value === 'island' || value === 'archipelago')) return true;
  if (value === 'national_park' || value === 'island') return true;
  return KEPT_TYPES.has(type);
}

export function suggestionsFromPhoton(features: PhotonFeature[] | undefined): PlaceSuggestion[] {
  if (!features) return [];
  const out: PlaceSuggestion[] = [];
  for (const feature of features) {
    const props = feature.properties ?? {};
    if (!isSuggestablePhotonPlace(props)) continue;
    const city = props.name?.trim() ?? '';
    const country = props.country?.trim() ?? '';
    const lng = feature.geometry?.coordinates?.[0];
    const lat = feature.geometry?.coordinates?.[1];
    if (!city || !country || typeof lat !== 'number' || typeof lng !== 'number') continue;
    const state = props.state?.trim();
    const county = props.county?.trim();
    const region = state || county;
    out.push({
      label: placeSuggestionLabel(city, region, country),
      city,
      region,
      country,
      lat,
      lng,
      storable: true,
    });
  }
  return out;
}

export function photonSearchUrl(query: string, bias?: PlaceBias | null): string {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(PHOTON_SUGGEST_FETCH_LIMIT));
  url.searchParams.set('lang', 'en');
  for (const layer of PHOTON_PLACE_LAYERS) url.searchParams.append('layer', layer);
  if (bias && Number.isFinite(bias.lat) && Number.isFinite(bias.lng)) {
    url.searchParams.set('lat', String(bias.lat));
    url.searchParams.set('lon', String(bias.lng));
    url.searchParams.set('zoom', '6');
    url.searchParams.set('location_bias_scale', '0');
  }
  return url.toString();
}
