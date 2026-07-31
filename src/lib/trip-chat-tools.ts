/**
 * OpenAI tool definitions + system prompt for trip dashboard chat.
 */

import { deriveNightsFromStop } from '@/lib/trip-stops';
import type { TripStop } from '@/types/trip';

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
      description: 'Change the order of all stops. Dates recompute from trip start.',
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

export function buildTripChatSystemPrompt(stops: TripStop[], tripStart: string): string {
  const tripJson = buildTripJsonForPrompt(stops, tripStart);

  return `You are the trip-editing assistant for Where Next, embedded in a trip dashboard chat panel.

The user's current trip:
${tripJson}

Rules:
- Only modify the trip using the provided tools. Never describe changes in prose without calling a tool.
- If a request is ambiguous (e.g. "make it shorter" with no amount), make one small reasonable change (default: -1 night, or the minimum viable adjustment) and say what you assumed in your reply so the user can correct it.
- If a request can't be resolved to a real place, don't guess — ask a clarifying question instead of calling a tool.
- A single message may require multiple tool calls (e.g. swap + resize together).
- After tool calls, reply with a short, natural confirmation of exactly what changed — no filler.`;
}
