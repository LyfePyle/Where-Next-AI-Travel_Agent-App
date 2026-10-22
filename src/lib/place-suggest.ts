/** Shown beside a row that is not a city or a town. */
export type PlaceSuggestionType =
  | 'City'
  | 'Town'
  | 'Village'
  | 'Hamlet'
  | 'Area'
  | 'District'
  | 'Island'
  | 'Locality'
  | 'National park'
  | 'Protected area'
  | 'Nature reserve'
  | 'Beach'
  | 'Bay'
  | 'Peninsula'
  | 'Volcano'
  | 'Landmark';

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
  /** City and Town are stored but not shown as a tag. */
  type?: PlaceSuggestionType;
};

export type PlaceBias = { lat: number; lng: number };

export const PLACE_SUGGEST_LIMIT = 5;
export const PLACE_SUGGEST_MIN_CHARS = 3;
/**
 * Wider than the five rows we show. Fifteen still missed Vancouver, Washington
 * under a Vancouver bias, because Photon filled that window with facilities.
 * Twenty includes the city.
 */
export const PHOTON_SUGGEST_FETCH_LIMIT = 20;

/**
 * Photon still needs the other layer for national parks. Facilities arrive on
 * the locality layer, so the OSM tags below decide what is kept.
 */
export const PHOTON_PLACE_LAYERS = [
  'city',
  'locality',
  'district',
  'county',
  'state',
  'country',
  'other',
] as const;

const PLACE_TYPES: Record<string, PlaceSuggestionType> = {
  city: 'City',
  town: 'Town',
  village: 'Village',
  hamlet: 'Hamlet',
  suburb: 'Area',
  quarter: 'Area',
  island: 'Island',
  islet: 'Island',
  archipelago: 'Island',
  locality: 'Locality',
};

/** Two rows this close, with the same name and region, are one place. */
const DUPLICATE_KM = 5;

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

function suggestionTier(item: PlaceSuggestion): number {
  if (item.type === 'City' || item.type === 'Town') return 0;
  if (item.type === 'District') return 1;
  return 2;
}

/**
 * Cities and towns come first, then a matching district, then everything else.
 * Distance breaks ties, so a Costa Rica bias still prefers the nearer town.
 */
export function orderSuggestionsByBias(
  items: PlaceSuggestion[],
  bias?: PlaceBias | null
): PlaceSuggestion[] {
  const hasBias = !!bias && Number.isFinite(bias.lat) && Number.isFinite(bias.lng);
  return [...items].sort((a, b) => {
    const tier = suggestionTier(a) - suggestionTier(b);
    if (tier !== 0) return tier;
    if (!hasBias || !bias) return 0;
    return distanceKm(bias, a) - distanceKm(bias, b);
  });
}

/** Drop a second row only when the name, region, and spot are the same. */
export function dedupePlaceSuggestions(items: PlaceSuggestion[]): PlaceSuggestion[] {
  const out: PlaceSuggestion[] = [];
  for (const item of items) {
    const name = item.city.trim().toLowerCase();
    const region = (item.region || '').trim().toLowerCase();
    const country = item.country.trim().toLowerCase();
    const duplicate = out.some(
      (kept) =>
        kept.city.trim().toLowerCase() === name &&
        (kept.region || '').trim().toLowerCase() === region &&
        kept.country.trim().toLowerCase() === country &&
        distanceKm(kept, item) < DUPLICATE_KM
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
      Number.isFinite(item.lng) &&
      (item.type !== 'District' || nameCloselyMatches(item.city, q))
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
    /** Photon copies OSM admin_level here for boundary=administrative. */
    extra?: { admin_level?: string | number };
  };
};

/** OSM admin_level 8 is a district or municipality. Larger numbers are smaller areas. */
const LOCAL_ADMIN_LEVEL = 8;

function adminLevel(props: NonNullable<PhotonFeature['properties']>): number | null {
  const raw = props.extra?.admin_level;
  const level = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(level)) return null;
  return level;
}

/**
 * The typed text has to be the name, or almost all of it. "monteverde"
 * matches Monteverde. "vancou" does not match Vancouver.
 */
function nameCloselyMatches(name: string, query: string): boolean {
  const place = name.trim().toLowerCase();
  const typed = query.trim().toLowerCase();
  if (!place || !typed || !place.startsWith(typed)) return false;
  return typed.length / place.length >= 0.85;
}

/** A suburb row whose name is a mall or a shopping building, not a place to stay. */
function isShoppingBuilding(name: string): boolean {
  return /\b(mall|shopping centre|shopping center|outlet)\b/i.test(name);
}

/**
 * A tourism=attraction stays only when its name is a landscape or a landmark.
 * Museums, shops, and fuel sites use the same OSM value, so the name is the
 * only signal Photon gives us.
 */
function isNamedLandmark(name: string): boolean {
  return /\b(national park|nature reserve|park|beach|bay|volcano|waterfall|falls|canyon|cave|reef|ruins|temple|palace|fortress|monument|citadel|pyramid|archaeological)\b/i.test(
    name
  );
}

/**
 * Suburb and quarter stay as areas a person would name, such as Vancouver
 * Heights. A mall tagged as a suburb is dropped. A district or municipality
 * (admin_level 8 or more local) is kept and tagged District. The Photon layer
 * is not used.
 */
export function placeKindFromOsm(
  props: NonNullable<PhotonFeature['properties']>
): PlaceSuggestionType | null {
  const key = (props.osm_key || '').toLowerCase();
  const value = (props.osm_value || '').toLowerCase();
  const name = props.name?.trim() ?? '';
  if (!key || !value) return null;

  if (key === 'place') {
    const kind = PLACE_TYPES[value];
    if (!kind) return null;
    if ((value === 'suburb' || value === 'quarter') && isShoppingBuilding(name)) return null;
    return kind;
  }
  if (key === 'boundary' && value === 'administrative') {
    const level = adminLevel(props);
    if (level == null || level < LOCAL_ADMIN_LEVEL) return null;
    return 'District';
  }
  if (key === 'boundary' && value === 'national_park') return 'National park';
  if (key === 'boundary' && value === 'protected_area') return 'Protected area';
  if (key === 'leisure' && value === 'nature_reserve') return 'Nature reserve';
  if (key === 'natural' && value === 'beach') return 'Beach';
  if (key === 'natural' && value === 'bay') return 'Bay';
  if (key === 'natural' && value === 'peninsula') return 'Peninsula';
  if (key === 'natural' && value === 'volcano') return 'Volcano';
  if (key === 'natural' && (value === 'island' || value === 'islet' || value === 'archipelago')) {
    return 'Island';
  }
  if (key === 'tourism' && value === 'attraction' && isNamedLandmark(name)) return 'Landmark';
  return null;
}

export function isSuggestablePhotonPlace(
  props: NonNullable<PhotonFeature['properties']>
): boolean {
  return placeKindFromOsm(props) !== null;
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
    const type = placeKindFromOsm(props);
    if (!type) continue;
    out.push({
      label: placeSuggestionLabel(city, region, country),
      city,
      region,
      country,
      lat,
      lng,
      storable: true,
      type,
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
