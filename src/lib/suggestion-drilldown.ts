/**
 * Build country → city drill-down data for the suggestions page.
 * Reuses groupStopsByCountry() from trip-stops.ts — no duplicate grouping logic.
 */

import type { CompareSummary } from '@/lib/compare-summary';
import type { StopPreview } from '@/lib/trip-preview';
import {
  assignDatesAcrossStops,
  deriveNightsFromStop,
  groupStopsByCountry,
  normalizeStop,
  type CountryStopGroup,
} from '@/lib/trip-stops';
import type { TripStop } from '@/types/trip';
import type { TripSuggestion } from '@/hooks/useStreamingSuggestions';

export type DrillDownMode = 'multi-country' | 'single-country';

export interface DrillDownCity extends TripStop {
  preview?: StopPreview;
}

export interface DrillDownView {
  mode: DrillDownMode;
  countryGroups: CountryStopGroup[];
  /** Primary suggestion used for stopPreviews / context */
  sourceSuggestionId?: string;
}

/** Strip compare lane labels down to a place name, e.g. "Costa Rica, in depth" → "Costa Rica". */
function cleanLaneLabel(label: string): string {
  return label
    .replace(/,?\s*in depth$/i, '')
    .replace(/^both,?\s*split trip$/i, '')
    .replace(/^both$/i, '')
    .trim();
}

/** Country names from compare block (first two lane options). */
export function extractCompareCountries(summary: CompareSummary | null): string[] {
  if (!summary?.options?.length) return [];
  const countries: string[] = [];
  for (const option of summary.options.slice(0, 2)) {
    const name = cleanLaneLabel(option.label);
    if (name && !/both/i.test(name)) countries.push(name);
  }
  return countries;
}

/** "Costa Rica or Nicaragua" → ["Costa Rica", "Nicaragua"] */
export function extractCountriesFromText(text: string): string[] {
  if (!text.trim()) return [];
  const orMatch = text.match(
    /\b([A-Za-z][A-Za-z\s,'-]{1,40})\s+(?:or|vs\.?|versus)\s+([A-Za-z][A-Za-z\s,'-]{1,40})\b/i
  );
  if (orMatch) {
    return [orMatch[1].trim(), orMatch[2].trim()].filter(Boolean);
  }
  return [];
}

/** Which countries a compare lane focuses — null means show all. */
export function laneFocusCountries(
  activeLane: string | null,
  summary: CompareSummary | null
): string[] | null {
  if (!activeLane || !summary) return null;
  const lane = activeLane.toLowerCase();
  if (/\bboth\b/i.test(lane)) return null;

  const cleaned = cleanLaneLabel(activeLane);
  const compareCountries = extractCompareCountries(summary);
  const match = compareCountries.find(
    (c) =>
      cleaned.toLowerCase().includes(c.toLowerCase()) ||
      c.toLowerCase().includes(cleaned.toLowerCase())
  );
  if (match) return [match];

  if (cleaned && !/both/i.test(cleaned)) return [cleaned];
  return null;
}

function pickPrimarySuggestion(suggestions: TripSuggestion[]): TripSuggestion | null {
  if (!suggestions.length) return null;
  const withStops = suggestions.filter((s) => s.stops && s.stops.length >= 2);
  if (withStops.length === 0) return suggestions[0];
  return withStops.reduce((best, s) =>
    (s.stops?.length ?? 0) > (best.stops?.length ?? 0) ? s : best
  );
}

/** Union city names from all suggestions that include a stops array. */
function mergedStopNames(suggestions: TripSuggestion[]): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const s of suggestions) {
    for (const name of s.stops ?? []) {
      const trimmed = name.trim();
      const key = trimmed.toLowerCase();
      if (trimmed && !seen.has(key)) {
        seen.add(key);
        names.push(trimmed);
      }
    }
  }
  return names;
}

/** Build city list from per-card city/country fields (compare / flat suggestions). */
function citiesFromSuggestionCards(suggestions: TripSuggestion[]): TripStop[] {
  const seen = new Set<string>();
  const stops: TripStop[] = [];
  for (const s of suggestions) {
    const city = s.city?.trim();
    const country = s.country?.trim();
    if (!city || !country) continue;
    const key = `${city}|${country}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const normalized = normalizeStop(
      {
        id: `city-${stops.length}`,
        destination: `${city}, ${country}`,
        city,
        country,
        order: stops.length,
      },
      stops.length
    );
    if (normalized) stops.push(normalized);
  }
  return stops;
}

function cityNamesFromContext(
  urlStops: TripStop[],
  primary: TripSuggestion | null
): string[] {
  const fromUrl = urlStops.map((s) => s.city || s.destination.split(',')[0].trim()).filter(Boolean);
  if (fromUrl.length >= 2) return fromUrl;

  if (primary?.stops?.length) return primary.stops.map((s) => s.trim()).filter(Boolean);

  return [];
}

function previewForCity(
  previews: StopPreview[] | undefined,
  cityName: string,
  index: number
): StopPreview | undefined {
  if (!previews?.length) return undefined;
  const norm = cityName.toLowerCase().trim();
  return (
    previews.find((p) => p.destination.toLowerCase().trim() === norm) ??
    previews[index]
  );
}

/**
 * Assign country to each city when not explicitly known.
 * Prefers URL stop country fields, then compare-country ordering heuristics.
 */
function assignCountriesToCities(
  cityNames: string[],
  urlStops: TripStop[],
  compareCountries: string[],
  primary: TripSuggestion | null
): TripStop[] {
  const urlByCity = new Map<string, TripStop>();
  for (const s of urlStops) {
    const key = (s.city || s.destination.split(',')[0]).toLowerCase().trim();
    urlByCity.set(key, s);
  }

  const countries =
    compareCountries.length >= 2
      ? compareCountries
      : extractCountriesFromText(primary?.destination ?? '');

  // Single known country on suggestion → all cities inherit it
  const singleCountry =
    primary?.country &&
    !/[/&]| and | or | versus | vs\.?/i.test(primary.country)
      ? primary.country.trim()
      : undefined;

  return cityNames.map((cityName, index) => {
    const urlMatch = urlByCity.get(cityName.toLowerCase().trim());
    if (urlMatch?.country) {
      return normalizeStop(
        {
          id: urlMatch.id || `city-${index}`,
          destination: urlMatch.destination || `${cityName}, ${urlMatch.country}`,
          city: cityName,
          country: urlMatch.country,
          startDate: urlMatch.startDate,
          endDate: urlMatch.endDate,
          order: index,
        },
        index
      )!;
    }

    let country = urlMatch?.country;
    if (!country && countries.length === 2 && cityNames.length >= 2) {
      // Ordered split: first half → first compare country (common AI ordering)
      const midpoint = Math.ceil(cityNames.length / 2);
      country = index < midpoint ? countries[0] : countries[1];
    } else if (!country && singleCountry) {
      country = singleCountry;
    }

    const destination = country ? `${cityName}, ${country}` : cityName;
    return normalizeStop(
      {
        id: `city-${index}`,
        destination,
        city: cityName,
        country,
        order: index,
      },
      index
    )!;
  });
}

/**
 * Build drill-down view, or null when grouping data is insufficient (caller shows flat list only).
 */
export function buildDrillDownView(
  urlStops: TripStop[],
  suggestions: TripSuggestion[],
  compareSummary: CompareSummary | null,
  destinationText: string
): DrillDownView | null {
  const primary = pickPrimarySuggestion(suggestions);
  const compareCountries = [
    ...extractCompareCountries(compareSummary),
    ...extractCountriesFromText(destinationText),
  ].filter((c, i, arr) => arr.findIndex((x) => x.toLowerCase() === c.toLowerCase()) === i);

  let cityNames = cityNamesFromContext(urlStops, primary);
  if (cityNames.length < 2) {
    cityNames = mergedStopNames(suggestions);
  }

  let stops: TripStop[] = [];
  if (cityNames.length >= 2) {
    stops = assignCountriesToCities(cityNames, urlStops, compareCountries, primary);
  } else {
    stops = citiesFromSuggestionCards(suggestions);
  }

  if (stops.length < 2) return null;

  const groups = groupStopsByCountry(stops);

  const realCountries = groups.filter((g) => g.country !== 'Other');
  if (realCountries.length >= 2) {
    return {
      mode: 'multi-country',
      countryGroups: groups.filter((g) => g.country !== 'Other' || groups.length === 1),
      sourceSuggestionId: primary?.id,
    };
  }

  if (groups.length === 1 && groups[0].stops.length >= 2) {
    return {
      mode: 'single-country',
      countryGroups: groups,
      sourceSuggestionId: primary?.id,
    };
  }

  return null;
}

/** Attach stopPreviews from the primary suggestion onto grouped stops. */
export function enrichGroupsWithPreviews(
  groups: CountryStopGroup[],
  primary: TripSuggestion | null
): DrillDownCity[] {
  const previews = primary?.stopPreviews;
  const cities: DrillDownCity[] = [];
  let idx = 0;
  for (const group of groups) {
    for (const stop of group.stops) {
      const cityName = stop.city || stop.destination.split(',')[0].trim();
      cities.push({
        ...stop,
        preview: previewForCity(previews, cityName, idx),
      });
      idx++;
    }
  }
  return cities;
}

export function citiesForGroups(
  groups: CountryStopGroup[],
  primary: TripSuggestion | null
): Map<string, DrillDownCity[]> {
  const previews = primary?.stopPreviews;
  const map = new Map<string, DrillDownCity[]>();
  let idx = 0;
  for (const group of groups) {
    const list: DrillDownCity[] = group.stops.map((stop) => {
      const cityName = stop.city || stop.destination.split(',')[0].trim();
      const city: DrillDownCity = {
        ...stop,
        preview: previewForCity(previews, cityName, idx),
      };
      idx++;
      return city;
    });
    map.set(group.country, list);
  }
  return map;
}

/**
 * Turn selected drill-down cities into dated TripStop[] ready for save.
 * Returns null when selection is empty or stops cannot be normalized.
 */
export function buildStopsFromSelection(
  countryGroups: CountryStopGroup[],
  selectedCityIds: Set<string>,
  primary: TripSuggestion | null,
  tripStart: string,
  tripEnd: string
): TripStop[] | null {
  const citiesByCountry = citiesForGroups(countryGroups, primary);
  const selected: DrillDownCity[] = [];

  for (const group of countryGroups) {
    for (const city of citiesByCountry.get(group.country) ?? []) {
      if (selectedCityIds.has(city.id)) selected.push(city);
    }
  }

  if (selected.length === 0) return null;

  const rawStops: TripStop[] = [];
  for (let i = 0; i < selected.length; i++) {
    const c = selected[i];
    const normalized = normalizeStop(
      {
        id: `stop-${i}`,
        destination: c.destination,
        city: c.city,
        country: c.country,
        startDate: '',
        endDate: '',
        order: i,
      },
      i
    );
    if (!normalized) return null;
    rawStops.push(normalized);
  }

  return assignDatesAcrossStops(rawStops, tripStart, tripEnd);
}

export interface MultiStopSelectionPreview {
  stops: TripStop[];
  routeTitle: string;
  estimatedTotal: number;
  currency: string;
  fitScore?: number;
  crowdLevel?: string;
  seasonality?: string;
  weather?: { icon?: string; temp?: number };
  nightSplit: Array<{ city: string; nights: number; country?: string }>;
  sampleDays: string[];
  highlights: string[];
  whyItFits?: string;
  flightBand?: TripSuggestion['flightBand'];
  hotelBand?: TripSuggestion['hotelBand'];
}

/** Client-side composite preview for multi-stop selection (no extra API). */
export function buildMultiStopSelectionPreview(
  countryGroups: CountryStopGroup[],
  selectedCityIds: Set<string>,
  primary: TripSuggestion | null,
  tripStart: string,
  tripEnd: string
): MultiStopSelectionPreview | null {
  if (selectedCityIds.size < 2 || !primary) return null;

  const builtStops = buildStopsFromSelection(
    countryGroups,
    selectedCityIds,
    primary,
    tripStart,
    tripEnd
  );
  if (!builtStops || builtStops.length < 2) return null;

  const payload = suggestionPayloadForSelection(primary, builtStops) as TripSuggestion;
  const previews = payload.stopPreviews ?? primary.stopPreviews ?? [];

  const nightSplit = builtStops.map((stop) => ({
    city: stop.city || stop.destination.split(',')[0].trim(),
    nights: deriveNightsFromStop(stop),
    country: stop.country,
  }));

  const sampleDays = builtStops.map((stop, index) => {
    const city = stop.city || stop.destination.split(',')[0].trim();
    const nights = deriveNightsFromStop(stop);
    const preview = previewForCity(previews, city, index);
    if (preview?.highlights?.[0]) {
      return `${city} (${nights}n): ${preview.highlights[0]}`;
    }
    if (preview?.description) {
      return `${city} (${nights}n): ${preview.description}`;
    }
    return `${city} — ${nights} ${nights === 1 ? 'night' : 'nights'}`;
  });

  const highlights = previews
    .flatMap((preview) => preview.highlights ?? [])
    .filter(Boolean)
    .slice(0, 6);

  const routeTitle = builtStops
    .map((stop) => stop.city || stop.destination.split(',')[0].trim())
    .join(' → ');

  return {
    stops: builtStops,
    routeTitle,
    estimatedTotal: primary.estimatedTotal ?? 0,
    currency: primary.currency ?? 'USD',
    fitScore: primary.fitScore,
    crowdLevel: primary.crowdLevel,
    seasonality: primary.seasonality,
    weather: primary.weather,
    nightSplit,
    sampleDays,
    highlights: highlights.length > 0 ? highlights : primary.highlights.slice(0, 4),
    whyItFits: primary.whyItFits,
    flightBand: primary.flightBand,
    hotelBand: primary.hotelBand,
  };
}

/** Narrow primary suggestion stopPreviews to selected cities for storage. */
export function suggestionPayloadForSelection(
  primary: TripSuggestion | null,
  stops: TripStop[]
): TripSuggestion | Record<string, unknown> {
  if (!primary) return {};

  const cityKeys = new Set(
    stops.map((s) => (s.city || s.destination.split(',')[0]).toLowerCase().trim())
  );

  const stopPreviews = primary.stopPreviews?.filter((p) =>
    cityKeys.has(p.destination.toLowerCase().trim())
  );

  return {
    ...primary,
    stops: stops.map((s) => s.city || s.destination.split(',')[0].trim()),
    stopPreviews: stopPreviews?.length ? stopPreviews : primary.stopPreviews,
  };
}
