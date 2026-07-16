/**
 * src/lib/trip-preview.ts
 * Normalizes the AI-generated "preview" content for a trip (description, why-it-fits,
 * highlights, cost bands, crowd/weather/seasonality) into a stable shape.
 *
 * This content used to travel only through URL query params, so a saved trip lost it
 * the moment its details page was reopened by ID. We now persist this blob in the
 * trips.suggestions jsonb column and rehydrate from it, so saved trips render fully
 * regardless of how they're opened.
 */

export interface TripPreview {
  description?: string;
  whyItFits?: string;
  highlights?: string[];
  fitScore?: number;
  crowdLevel?: 'Low' | 'Medium' | 'High';
  seasonality?: string;
  weatherTemp?: number;
  weatherIcon?: string;
  flightBand?: { min: number; max: number };
  hotelBand?: { min: number; max: number; style?: string; area?: string };
  from?: string;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Build a normalized TripPreview from a loose source object. Accepts common field
 * aliases so it works with both a raw AI `suggestion` object and the flatter payloads
 * the save endpoints receive (e.g. `reason` for whyItFits, `bestTime` for seasonality).
 */
export function buildTripPreview(src: Record<string, unknown> | null | undefined): TripPreview {
  if (!src || typeof src !== 'object') return {};
  const p: TripPreview = {};

  const description = str(src.description);
  if (description) p.description = description;

  const whyItFits = str(src.whyItFits) ?? str(src.reason);
  if (whyItFits) p.whyItFits = whyItFits;

  const rawHighlights = src.highlights;
  if (Array.isArray(rawHighlights)) {
    const cleaned = rawHighlights
      .map((h) => (typeof h === 'string' ? h.trim() : ''))
      .filter(Boolean);
    if (cleaned.length) p.highlights = cleaned;
  } else if (typeof rawHighlights === 'string' && rawHighlights.trim()) {
    const cleaned = rawHighlights
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);
    if (cleaned.length) p.highlights = cleaned;
  }

  const fitScore = num(src.fitScore);
  if (fitScore != null && fitScore > 0) p.fitScore = fitScore;

  const crowd = str(src.crowdLevel);
  if (crowd === 'Low' || crowd === 'Medium' || crowd === 'High') p.crowdLevel = crowd;

  const seasonality = str(src.seasonality) ?? str(src.bestTime);
  if (seasonality) p.seasonality = seasonality;

  const weather = (src.weather as Record<string, unknown> | undefined) ?? undefined;
  const weatherTemp = num(src.weatherTemp) ?? num(weather?.temp);
  if (weatherTemp != null) p.weatherTemp = weatherTemp;
  const weatherIcon = str(src.weatherIcon) ?? str(weather?.icon);
  if (weatherIcon) p.weatherIcon = weatherIcon;

  const flightBand = src.flightBand as Record<string, unknown> | undefined;
  const fbMin = num(flightBand?.min) ?? num(src.flightMin);
  const fbMax = num(flightBand?.max) ?? num(src.flightMax);
  if (fbMin != null && fbMax != null) p.flightBand = { min: fbMin, max: fbMax };

  const hotelBand = src.hotelBand as Record<string, unknown> | undefined;
  const hbMin = num(hotelBand?.min) ?? num(src.hotelMin);
  const hbMax = num(hotelBand?.max) ?? num(src.hotelMax);
  if (hbMin != null && hbMax != null) {
    p.hotelBand = {
      min: hbMin,
      max: hbMax,
      style: str(hotelBand?.style) ?? str(src.hotelStyle),
      area: str(hotelBand?.area) ?? str(src.hotelArea),
    };
  }

  const from = str(src.from);
  if (from) p.from = from;

  return p;
}

/** True when the preview carries no usable content (so we can skip storing an empty blob). */
export function isPreviewEmpty(p: TripPreview): boolean {
  return Object.keys(p).length === 0;
}
