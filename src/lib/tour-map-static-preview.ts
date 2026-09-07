/** Web Mercator helpers for walking-tour browse-card static map previews. */

export type PreviewStop = {
  lat: number;
  lng: number;
  order?: number;
};

export type ProjectedPreviewPoint = {
  x: number;
  y: number;
  order: number;
};

/** Card thumbnail is ~2:1 (h-36 on a 2–3 column grid). Keep URL size under Mapbox's 1280px cap. */
export const TOUR_PREVIEW_IMAGE_WIDTH = 600;
export const TOUR_PREVIEW_IMAGE_HEIGHT = 288;
const PAD_FRACTION = 0.14;
const COORD_DECIMALS = 5;
const MIN_MERC_SPAN = 0.0002;

export function lngToMercX(lng: number): number {
  return (lng + 180) / 360;
}

export function latToMercY(lat: number): number {
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const latRad = (clamped * Math.PI) / 180;
  return (1 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / Math.PI) / 2;
}

export function mercXToLng(x: number): number {
  return x * 360 - 180;
}

export function mercYToLat(y: number): number {
  const n = Math.PI * (1 - 2 * y);
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

export function validPreviewStops(stops: PreviewStop[]): PreviewStop[] {
  return stops
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng) && s.lat !== 0 && s.lng !== 0)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function roundCoord(n: number): number {
  const f = 10 ** COORD_DECIMALS;
  return Math.round(n * f) / f;
}

export type PreviewBbox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

/** Padded stop bounds, expanded in mercator space to match the static image aspect. */
export function previewBboxForStops(
  stops: PreviewStop[],
  imageWidth = TOUR_PREVIEW_IMAGE_WIDTH,
  imageHeight = TOUR_PREVIEW_IMAGE_HEIGHT
): PreviewBbox | null {
  const valid = validPreviewStops(stops);
  if (valid.length === 0) return null;

  const lats = valid.map((s) => s.lat);
  const lngs = valid.map((s) => s.lng);
  let minMx = lngToMercX(Math.min(...lngs));
  let maxMx = lngToMercX(Math.max(...lngs));
  let northMy = latToMercY(Math.max(...lats));
  let southMy = latToMercY(Math.min(...lats));

  if (maxMx - minMx < MIN_MERC_SPAN) {
    const mid = (minMx + maxMx) / 2;
    minMx = mid - MIN_MERC_SPAN / 2;
    maxMx = mid + MIN_MERC_SPAN / 2;
  }
  if (southMy - northMy < MIN_MERC_SPAN) {
    const mid = (northMy + southMy) / 2;
    northMy = mid - MIN_MERC_SPAN / 2;
    southMy = mid + MIN_MERC_SPAN / 2;
  }

  const padX = (maxMx - minMx) * PAD_FRACTION;
  const padY = (southMy - northMy) * PAD_FRACTION;
  minMx -= padX;
  maxMx += padX;
  northMy -= padY;
  southMy += padY;

  let mercW = maxMx - minMx;
  let mercH = southMy - northMy;
  const targetAspect = imageWidth / imageHeight;
  const currentAspect = mercW / mercH;
  if (currentAspect < targetAspect) {
    const extra = (mercH * targetAspect - mercW) / 2;
    minMx -= extra;
    maxMx += extra;
  } else if (currentAspect > targetAspect) {
    const extra = (mercW / targetAspect - mercH) / 2;
    northMy -= extra;
    southMy += extra;
  }

  return {
    west: roundCoord(mercXToLng(minMx)),
    east: roundCoord(mercXToLng(maxMx)),
    north: roundCoord(mercYToLat(northMy)),
    south: roundCoord(mercYToLat(southMy)),
  };
}

export function projectTourStopsToPreview(
  stops: PreviewStop[],
  bbox?: PreviewBbox | null
): ProjectedPreviewPoint[] {
  const valid = validPreviewStops(stops);
  const box = bbox ?? previewBboxForStops(valid);
  if (!box || valid.length === 0) return [];

  const minMx = lngToMercX(box.west);
  const maxMx = lngToMercX(box.east);
  const northMy = latToMercY(box.north);
  const southMy = latToMercY(box.south);
  const mercW = maxMx - minMx || MIN_MERC_SPAN;
  const mercH = southMy - northMy || MIN_MERC_SPAN;

  return valid.map((stop, index) => ({
    x: ((lngToMercX(stop.lng) - minMx) / mercW) * 100,
    y: ((latToMercY(stop.lat) - northMy) / mercH) * 100,
    order: stop.order ?? index + 1,
  }));
}

export function buildTourPreviewStaticUrl(
  stops: PreviewStop[],
  token: string | undefined,
  imageWidth = TOUR_PREVIEW_IMAGE_WIDTH,
  imageHeight = TOUR_PREVIEW_IMAGE_HEIGHT
): string | null {
  if (!token?.trim()) return null;
  const bbox = previewBboxForStops(stops, imageWidth, imageHeight);
  if (!bbox) return null;

  const params = new URLSearchParams({
    padding: '0',
    logo: 'false',
    attribution: 'false',
    access_token: token.trim(),
  });

  // Mapbox 404s if the bbox brackets are percent-encoded.
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/[${bbox.west},${bbox.south},${bbox.east},${bbox.north}]/${imageWidth}x${imageHeight}@2x?${params.toString()}`;
}
