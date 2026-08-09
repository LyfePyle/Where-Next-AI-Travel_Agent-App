/**
 * OpenAI tool definitions + system prompt for trip dashboard chat.
 */

import {
  getStopPreviewForDestination,
  parseStoredSuggestions,
  type TripPreview,
} from '@/lib/trip-preview';
import { deriveNightsFromStop } from '@/lib/trip-stops';
import type { TripStop } from '@/types/trip';
import { tripTotalNights } from '@/types/trip';

export const TRIP_CHAT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'swap_stop',
      description:
        'Replace one stop with a different place, keeping its position and nights unless resize is also requested.',
      parameters: {
        type: 'object',
        properties: {
          stop_id: { type: 'string', description: 'ID of the stop to replace' },
          new_place: { type: 'string', description: "City name, e.g. 'Chiang Rai'" },
          new_country: { type: 'string', description: 'Country of the new place' },
        },
        required: ['stop_id', 'new_place', 'new_country'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'resize_stop_nights',
      description: 'Change the number of nights at a stop. Downstream dates cascade automatically.',
      parameters: {
        type: 'object',
        properties: {
          stop_id: { type: 'string' },
          new_nights: { type: 'integer', minimum: 1 },
        },
        required: ['stop_id', 'new_nights'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_stop',
      description: 'Insert a new stop into the trip at a given position.',
      parameters: {
        type: 'object',
        properties: {
          place: { type: 'string' },
          country: { type: 'string' },
          position: { type: 'integer', description: '0-indexed position in the stop order' },
          nights: { type: 'integer', minimum: 1 },
        },
        required: ['place', 'country', 'position', 'nights'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'remove_stop',
      description: 'Remove a stop from the trip. Downstream stops shift earlier automatically.',
      parameters: {
        type: 'object',
        properties: {
          stop_id: { type: 'string' },
        },
        required: ['stop_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'reorder_stops',
      description:
        'REQUIRED when the user asks to change stop order (e.g. "end in X", "put X last", "move X before Y", "start in X"). Pass the full ordered list of stop IDs in the new sequence. Dates recompute from trip start.',
      parameters: {
        type: 'object',
        properties: {
          ordered_stop_ids: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['ordered_stop_ids'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'regenerate_day',
      description:
        'Regenerate one day\'s itinerary blocks for a stop via AI. Use when the user wants a fresh plan for a specific day.',
      parameters: {
        type: 'object',
        properties: {
          stop_id: { type: 'string', description: 'ID of the stop' },
          day_index: { type: 'integer', minimum: 1, description: '1-based day within that stop' },
          guidance: {
            type: 'string',
            description: 'Optional focus, e.g. "more food-focused, less temples"',
          },
        },
        required: ['stop_id', 'day_index'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_itinerary_block',
      description:
        'Add an activity block to a specific day. Check the current itinerary first — do NOT add a block if a similar activity already exists on that day (same activity type/title). If the user says "keep X", ensure X is present before adding new items.',
      parameters: {
        type: 'object',
        properties: {
          stop_id: { type: 'string' },
          day_index: { type: 'integer', minimum: 1 },
          block: {
            type: 'object',
            properties: {
              time_of_day: { type: 'string', enum: ['morning', 'afternoon', 'evening'] },
              title: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['time_of_day', 'title', 'description'],
          },
        },
        required: ['stop_id', 'day_index', 'block'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'remove_itinerary_block',
      description: 'Remove one itinerary activity block by its block id.',
      parameters: {
        type: 'object',
        properties: {
          block_id: { type: 'string' },
        },
        required: ['block_id'],
      },
    },
  },
];

export function buildTripJsonForPrompt(stops: TripStop[], tripStart: string): string {
  const payload = {
    trip_start: tripStart,
    stops: stops.map((s, i) => ({
      id: s.id,
      order: i,
      country: s.country ?? '',
      city: s.city ?? s.destination.split(',')[0]?.trim() ?? s.destination,
      nights: deriveNightsFromStop(s),
      arrive_date: s.startDate,
      leave_date: s.endDate,
      destination: s.destination,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

function finiteNum(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function midBand(band: { min: number; max: number } | undefined): number | null {
  if (!band) return null;
  return Math.round((band.min + band.max) / 2);
}

function aggregateHotelBand(
  stops: TripStop[],
  stopPreviews: ReturnType<typeof parseStoredSuggestions>['stopPreviews'],
  overview: TripPreview
): { min: number; max: number; perStop: Array<{ destination: string; min: number; max: number }> } | null {
  const perStop: Array<{ destination: string; min: number; max: number }> = [];

  for (const stop of stops) {
    const preview = getStopPreviewForDestination(stopPreviews, stop.destination);
    const band = preview?.hotelBand ?? (stopPreviews.length === 0 ? overview.hotelBand : undefined);
    if (band) {
      perStop.push({ destination: stop.destination, min: band.min, max: band.max });
    }
  }

  if (perStop.length === 0 && overview.hotelBand) {
    perStop.push({ destination: 'trip overview', min: overview.hotelBand.min, max: overview.hotelBand.max });
  }

  if (perStop.length === 0) return null;

  const min = Math.round(perStop.reduce((s, b) => s + b.min, 0) / perStop.length);
  const max = Math.round(perStop.reduce((s, b) => s + b.max, 0) / perStop.length);
  return { min, max, perStop };
}

function estimatedTotalFromSuggestions(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const top = finiteNum(o.estimatedTotal);
  if (top != null) return top;
  if (o.overview && typeof o.overview === 'object') {
    return finiteNum((o.overview as Record<string, unknown>).estimatedTotal);
  }
  return null;
}

/** Fallback nightly lodging when suggestions have no hotel band (matches suggestion-card defaults). */
function defaultNightlyLodging(vibe: string | null | undefined): number {
  const v = (vibe ?? '').toLowerCase();
  if (v.includes('luxury') || v.includes('premium')) return 300;
  if (v.includes('budget') || v.includes('backpack')) return 100;
  return 175;
}

export interface TripBudgetRow {
  budget_amount?: unknown;
  adults?: unknown;
  kids?: unknown;
  vibe?: unknown;
  suggestions?: unknown;
}

/** Budget + cost context for chat (total budget, travelers, $/night bands from saved suggestions). */
export function buildTripBudgetContextForPrompt(trip: TripBudgetRow, stops: TripStop[]): string {
  const budgetAmount = finiteNum(trip.budget_amount);
  const adults = finiteNum(trip.adults) ?? 1;
  const kids = finiteNum(trip.kids) ?? 0;
  const totalTravelers = adults + kids;
  const vibe = typeof trip.vibe === 'string' ? trip.vibe : null;
  const totalNights = tripTotalNights(stops);

  const { overview, stopPreviews } = parseStoredSuggestions(trip.suggestions);
  const estimatedTotal = estimatedTotalFromSuggestions(trip.suggestions);
  const hotelBand = aggregateHotelBand(stops, stopPreviews, overview);
  const flightMid = midBand(overview.flightBand);

  const hotelMid =
    hotelBand != null
      ? Math.round((hotelBand.min + hotelBand.max) / 2)
      : estimatedTotal != null && totalNights > 0
        ? Math.round((estimatedTotal * 0.4) / totalNights)
        : budgetAmount != null && totalNights > 0
          ? Math.round((budgetAmount * 0.35) / totalNights)
          : defaultNightlyLodging(vibe);

  const hotelSource =
    hotelBand != null
      ? 'saved suggestion hotel bands'
      : estimatedTotal != null && totalNights > 0
        ? 'derived from AI estimated trip total (~40% lodging)'
        : budgetAmount != null && totalNights > 0
          ? 'derived from total budget (~35% lodging share)'
          : 'default mid-range estimate for this vibe';

  const lodgingBudget =
    budgetAmount != null
      ? flightMid != null
        ? Math.max(0, budgetAmount - flightMid)
        : Math.round(budgetAmount * 0.85)
      : null;

  const affordableNights =
    lodgingBudget != null && hotelMid > 0 ? Math.floor(lodgingBudget / hotelMid) : null;

  const budgetPerNightAllIn =
    budgetAmount != null && totalNights > 0 ? Math.round(budgetAmount / totalNights) : null;

  const payload = {
    totalBudgetUsd: budgetAmount,
    travelers: { adults, kids, total: totalTravelers },
    vibe,
    plannedNights: totalNights,
    aiEstimatedTripTotalUsd: estimatedTotal,
    flightEstimateUsd: overview.flightBand ?? null,
    hotelNightlyUsd: hotelBand
      ? { min: hotelBand.min, max: hotelBand.max, perStop: hotelBand.perStop }
      : { estimatedMid: hotelMid, source: hotelSource },
    derived: {
      budgetPerNightAllInUsd: budgetPerNightAllIn,
      estimatedLodgingBudgetUsd: lodgingBudget,
      affordableNightsAtMidHotelEstimate: affordableNights,
      formula:
        'affordable nights ≈ (total budget − mid flight estimate, or 85% of budget) ÷ mid nightly hotel estimate',
    },
  };

  return JSON.stringify(payload, null, 2);
}

export function buildTripChatSystemPrompt(
  stops: TripStop[],
  tripStart: string,
  itinerarySummary?: string,
  budgetContext?: string
): string {
  const tripJson = buildTripJsonForPrompt(stops, tripStart);
  const itinerarySection = itinerarySummary
    ? `\nCurrent itinerary (for day-level edits):\n${itinerarySummary}\n`
    : '';
  const budgetSection = budgetContext
    ? `\nTrip budget & cost context (already known — do NOT ask the user to re-supply these):\n${budgetContext}\n`
    : '';

  return `You are the trip-editing assistant for Where Next, embedded in a trip dashboard chat panel.

The user's current trip:
${tripJson}
${budgetSection}${itinerarySection}
Rules:
- Use stop tools (swap_stop, resize_stop_nights, add_stop, remove_stop, reorder_stops) for route/date/city changes.
- Use itinerary tools (regenerate_day, add_itinerary_block, remove_itinerary_block) for day-by-day plan edits.
- Only modify the trip using the provided tools. Never describe changes in prose without calling a tool.
- Positional stop requests ALWAYS need reorder_stops: "end in X", "put X last/first", "move X before Y", "finish in X instead". If you add or swap stops AND the user asked for a new order, call reorder_stops with the complete final stop order.
- Before add_itinerary_block, read that day's existing blocks in the itinerary summary. Skip adding duplicates. If the user says "keep X and add Y", only add Y when missing; do not re-add X if it is already listed.
- If a request is ambiguous (e.g. "make it shorter" with no amount), make one small reasonable change (default: -1 night, or the minimum viable adjustment) and say what you assumed in your reply so the user can correct it.
- Budget & cost questions (e.g. "how many nights can I afford?", "is this within budget?", "what's my nightly budget?"): answer using Trip budget & cost context above. Do the math yourself (total budget, hotel $/night bands, flight estimates, derived.affordableNightsAtMidHotelEstimate). Never ask the user for their total budget or nightly rate when those values are already in context. Only ask a clarifying question if a genuinely unknown variable is missing — and prefer the estimatedMid / default mid-range nightly from context over asking.
- If a request can't be resolved to a real place, don't guess — ask a clarifying question instead of calling a tool.
- A single message may require multiple tool calls (e.g. swap + resize together).
- After tool calls, reply with a short, natural confirmation of exactly what changed — no filler.`;
}
