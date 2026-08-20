/**
 * Build a walking-tour suggestion for an itinerary day. Never writes days.
 */

import OpenAI from 'openai';
import { attachCoordsToBlocks } from '@/lib/geocode-itinerary-block';
import { generateSingleTour, generateTourOptions, type TourStop } from '@/lib/tour-generate-core';
import { tourStopsToItineraryBlocks } from '@/lib/tour-to-itinerary-blocks';
import type { ItineraryBlock } from '@/types/itinerary';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface TourDaySuggestion {
  title: string;
  summary?: string;
  theme?: string;
  stopCount: number;
  extraStopNames: string[];
  blocks: ItineraryBlock[];
}

function preferenceLine(vibes?: string | null, additionalDetails?: string | null): string | undefined {
  const parts = [vibes?.trim(), additionalDetails?.trim()].filter(Boolean);
  return parts.length ? parts.join('. ') : undefined;
}

async function locateBlocks(
  blocks: ItineraryBlock[],
  city: string,
  country: string
): Promise<ItineraryBlock[]> {
  return attachCoordsToBlocks(blocks, city, country);
}

export function suggestionFromStops(
  title: string,
  stops: TourStop[],
  extra?: { summary?: string; theme?: string }
): Omit<TourDaySuggestion, 'blocks'> & { blocks: ItineraryBlock[] } {
  const { blocks, extraStopNames } = tourStopsToItineraryBlocks(stops);
  return {
    title,
    summary: extra?.summary,
    theme: extra?.theme,
    stopCount: stops.filter((s) => s.name?.trim()).length,
    extraStopNames,
    blocks,
  };
}

export async function buildTourDaySuggestion(input: {
  city: string;
  country: string;
  vibes?: string | null;
  additionalDetails?: string | null;
  geocode?: boolean;
}): Promise<TourDaySuggestion> {
  if (!openai) throw new Error('OpenAI not configured');
  const { title, stops } = await generateSingleTour(
    openai,
    input.city,
    input.country,
    preferenceLine(input.vibes, input.additionalDetails)
  );
  const suggestion = suggestionFromStops(title, stops);
  if (input.geocode === false) return suggestion;
  return {
    ...suggestion,
    blocks: await locateBlocks(suggestion.blocks, input.city, input.country),
  };
}

export async function buildTourDayAlternatives(input: {
  city: string;
  country: string;
  vibes?: string | null;
  additionalDetails?: string | null;
}): Promise<TourDaySuggestion[]> {
  if (!openai) throw new Error('OpenAI not configured');
  const options = await generateTourOptions(
    openai,
    input.city,
    input.country,
    preferenceLine(input.vibes, input.additionalDetails)
  );
  return options.map((opt) =>
    suggestionFromStops(opt.title, opt.stops, { summary: opt.summary, theme: opt.theme })
  );
}

export async function locateSuggestionBlocks(
  blocks: ItineraryBlock[],
  city: string,
  country: string
): Promise<ItineraryBlock[]> {
  return locateBlocks(blocks, city, country);
}
