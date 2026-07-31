/**
 * src/lib/trip-preview.ts
 * Normalizes the AI-generated "preview" content for a trip (description, why-it-fits,
 * highlights, cost bands, crowd/weather/seasonality) into a stable shape.
 *
 * This content used to travel only through URL query params, so a saved trip lost it
 * the moment its details page was reopened by ID. We now persist this blob in the
 * trips.suggestions jsonb column and rehydrate from it, so saved trips render fully
 * regardless of how they're opened.
 *
 * Multi-stop trips use `{ multiStop: true, overview, stopPreviews[] }` so each city
 * keeps its own AI content when reopened from Saved Trips (not just URL params).
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

export interface StopPreview extends TripPreview {
  destination: string;
}

export interface MultiStopSuggestionsBlob {
  multiStop: true;
  overview: TripPreview;
  stopPreviews: StopPreview[];
}

export type StoredSuggestions = TripPreview | MultiStopSuggestionsBlob;

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

export function buildStopPreview(src: Record<string, unknown>): StopPreview {
  const destination = str(src.destination) ?? '';
  return { destination, ...buildTripPreview(src) };
}

export function isMultiStopBlob(raw: unknown): raw is MultiStopSuggestionsBlob {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    (raw as MultiStopSuggestionsBlob).multiStop === true &&
    Array.isArray((raw as MultiStopSuggestionsBlob).stopPreviews)
  );
}

/** Parse a stored suggestions blob (single- or multi-stop) for rehydration. */
export function parseStoredSuggestions(raw: unknown): {
  overview: TripPreview;
  stopPreviews: StopPreview[];
  isMultiStop: boolean;
} {
  if (isMultiStopBlob(raw)) {
    const overview = buildTripPreview(
      raw.overview && typeof raw.overview === 'object'
        ? (raw.overview as Record<string, unknown>)
        : {}
    );
    const stopPreviews = raw.stopPreviews
      .map((sp) =>
        buildStopPreview(
          sp && typeof sp === 'object' ? (sp as Record<string, unknown>) : { destination: '' }
        )
      )
      .filter((sp) => sp.destination);
    return { overview, stopPreviews, isMultiStop: true };
  }

  const overview = buildTripPreview(
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null
  );
  return { overview, stopPreviews: [], isMultiStop: false };
}

/** City token for matching "Granada" ↔ "Granada, Nicaragua". */
function cityKeyFromDestination(destination: string): string {
  const d = destination.trim();
  if (!d) return '';
  const city = d.split(',')[0]?.trim();
  return (city || d).toLowerCase();
}

/** Match a stop preview by destination / city name. Never falls back to array index. */
export function getStopPreviewForDestination(
  stopPreviews: StopPreview[],
  destination: string,
  _index?: number
): StopPreview | undefined {
  if (!destination.trim() || stopPreviews.length === 0) return undefined;

  const norm = destination.toLowerCase().trim();
  const stopCity = cityKeyFromDestination(destination);

  const byName = stopPreviews.find((sp) => sp.destination.toLowerCase().trim() === norm);
  if (byName) return byName;

  if (stopCity) {
    const byCity = stopPreviews.find(
      (sp) => cityKeyFromDestination(sp.destination) === stopCity
    );
    if (byCity) return byCity;
  }

  return undefined;
}

/**
 * Build the suggestions blob for persistence. Multi-stop trips get a structured blob
 * with per-stop previews; single-stop trips stay a flat TripPreview for compatibility.
 */
export function buildMultiStopSuggestionsBlob(
  suggestion: Record<string, unknown> | null | undefined,
  stops: Array<{ destination: string }>,
  extra?: Record<string, unknown>
): StoredSuggestions {
  const overview = buildTripPreview({ ...(suggestion ?? {}), ...(extra ?? {}) });
  const resolvedStops = stops.map((s) => s.destination?.trim()).filter(Boolean);

  if (resolvedStops.length <= 1) {
    return overview;
  }

  const aiStopPreviews = suggestion?.stopPreviews;
  let stopPreviews: StopPreview[];

  if (Array.isArray(aiStopPreviews) && aiStopPreviews.length > 0) {
    stopPreviews = resolvedStops.map((dest, i) => {
      const match =
        aiStopPreviews.find(
          (sp) =>
            typeof sp === 'object' &&
            sp !== null &&
            str((sp as Record<string, unknown>).destination)?.toLowerCase() === dest.toLowerCase()
        ) ?? aiStopPreviews[i];
      return buildStopPreview({
        ...(match && typeof match === 'object' ? (match as Record<string, unknown>) : {}),
        destination: dest,
      });
    });
  } else {
    const cityNames = Array.isArray(suggestion?.stops)
      ? (suggestion!.stops as unknown[]).map((n) => str(n) ?? '').filter(Boolean)
      : [];
    const highlights = overview.highlights ?? [];

    stopPreviews = resolvedStops.map((dest, i) => {
      const cityLabel = cityNames[i] ?? dest.split(',')[0]?.trim() ?? dest;
      const sliceStart = i * 2;
      const stopHighlights = highlights.slice(sliceStart, sliceStart + 2);
      if (stopHighlights.length === 0 && highlights.length) {
        stopHighlights.push(highlights[i % highlights.length]!);
      }

      return {
        destination: dest,
        description: overview.description
          ? `${cityLabel}: ${overview.description}`
          : `Explore ${cityLabel} on your multi-city itinerary.`,
        whyItFits: overview.whyItFits,
        highlights:
          stopHighlights.length > 0 ? stopHighlights : [`Discover ${cityLabel}`, 'Local culture', 'Hidden gems'],
        crowdLevel: overview.crowdLevel,
        seasonality: overview.seasonality,
        weatherTemp: overview.weatherTemp,
        weatherIcon: overview.weatherIcon,
        hotelBand: overview.hotelBand,
      };
    });
  }

  return {
    multiStop: true,
    overview,
    stopPreviews,
  };
}

/** True when the preview carries no usable content (so we can skip storing an empty blob). */
export function isPreviewEmpty(p: TripPreview): boolean {
  return Object.keys(p).length === 0;
}

/** True when a stored blob has no usable content. */
export function isStoredSuggestionsEmpty(blob: StoredSuggestions): boolean {
  if (isMultiStopBlob(blob)) {
    return isPreviewEmpty(blob.overview) && blob.stopPreviews.every((sp) => isPreviewEmpty(sp));
  }
  return isPreviewEmpty(blob);
}

/** Upsert one stop preview into a stored suggestions blob (add/swap in chat). */
export function upsertStopPreviewInSuggestions(
  suggestions: unknown,
  preview: StopPreview,
  removeDestination?: string
): StoredSuggestions {
  const { overview, stopPreviews, isMultiStop } = parseStoredSuggestions(suggestions);
  const removeKey = removeDestination ? cityKeyFromDestination(removeDestination) : '';

  let next = stopPreviews.filter(
    (sp) => !removeKey || cityKeyFromDestination(sp.destination) !== removeKey
  );

  const previewKey = cityKeyFromDestination(preview.destination);
  const existingIdx = next.findIndex(
    (sp) => cityKeyFromDestination(sp.destination) === previewKey
  );
  if (existingIdx >= 0) {
    next = next.map((sp, i) => (i === existingIdx ? preview : sp));
  } else {
    next = [...next, preview];
  }

  if (!isMultiStop && next.length <= 1) {
    return buildTripPreview({ ...overview, ...preview });
  }

  return { multiStop: true, overview, stopPreviews: next };
}

/** Remove preview for a destination (remove_stop in chat). */
export function removeStopPreviewFromSuggestions(
  suggestions: unknown,
  destination: string
): StoredSuggestions {
  const { overview, stopPreviews, isMultiStop } = parseStoredSuggestions(suggestions);
  const key = cityKeyFromDestination(destination);
  const next = stopPreviews.filter((sp) => cityKeyFromDestination(sp.destination) !== key);

  if (!isMultiStop) {
    return overview;
  }

  return { multiStop: true, overview, stopPreviews: next };
}
