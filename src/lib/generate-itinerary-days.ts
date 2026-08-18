/**
 * GPT-4o generation for light day-by-day starting-point plans — one call per stop.
 */

import OpenAI from 'openai';
import { parseItineraryBlock } from '@/lib/itinerary-blocks';
import type { GeneratedItineraryDay, ItineraryBlock } from '@/types/itinerary';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface StopGenerationInput {
  city: string;
  country: string;
  nights: number;
  vibes?: string | null;
  additionalDetails?: string | null;
  isFirstStop?: boolean;
  isLastStop?: boolean;
}

export interface RegenerateDayInput extends StopGenerationInput {
  dayIndex: number;
  currentBlocks: ItineraryBlock[];
  guidance?: string | null;
}

function blockId(): string {
  return `blk-${Math.random().toString(36).slice(2, 10)}`;
}

function buildSystemPrompt(): string {
  return `You are generating a starting-point day-by-day plan for one stop on a traveler's trip. This is a DRAFT the traveler will personally edit, add to, and remove from — not a finished product. Write it that way: light, concrete, and easy to change, not exhaustive or padded.

RULES
- Generate exactly the requested number of days.
- Each day gets 2-3 blocks. Never more than 3. A quiet arrival day or a slow last day can have just 1-2.
- Each block has a time_of_day (morning, afternoon, or evening), a short title (5-8 words, concrete), and a 1-2 sentence description that's specific but short.
- Each block MUST include a "place" — a real, geocodable named location in this city (landmark, neighborhood, market, museum, park, or a specific restaurant/street). Never "the area", "downtown", or the city name alone.
- Each block MUST include numeric "lat" and "lng" (WGS84) for that place. Prefer the actual site, not the city centroid.
- No filler language. Never write "explore the vibrant streets of" or "discover the magic of".
- Don't repeat the same activity type two days running unless the place genuinely calls for it.
- Day 1 should account for arrival (lighter); if this is the last stop, the final day should account for departure.
- Reflect traveler notes and vibes where specific, but don't force every block to reference them.
- Ground every suggestion in something real about the city — neighborhoods, dish names, landmarks.

OUTPUT — strict JSON, no prose, no markdown fences:
{
  "days": [
    {
      "day_index": 1,
      "blocks": [
        {
          "time_of_day": "morning",
          "title": "string",
          "description": "string",
          "place": "string",
          "lat": 0,
          "lng": 0
        }
      ]
    }
  ]
}`;
}

function buildUserPrompt(input: StopGenerationInput): string {
  const lines = [
    `City: ${input.city.trim()}`,
    `Country: ${input.country.trim()}`,
    `Nights: ${input.nights}`,
    input.vibes ? `Trip vibes: ${input.vibes}` : null,
    input.additionalDetails ? `Traveler notes: ${input.additionalDetails}` : null,
    input.isFirstStop ? 'This is the first stop on the trip (account for arrival).' : null,
    input.isLastStop ? 'This is the final stop on the trip (account for departure on the last day).' : null,
    `Generate exactly ${input.nights} days.`,
  ].filter(Boolean);

  return lines.join('\n');
}

function buildRegenerateUserPrompt(input: RegenerateDayInput): string {
  const base = buildUserPrompt({ ...input, nights: 1 });
  const current = JSON.stringify(
    input.currentBlocks.map(({ time_of_day, title, description, place, lat, lng }) => ({
      time_of_day,
      title,
      description,
      ...(place ? { place } : {}),
      ...(typeof lat === 'number' ? { lat } : {}),
      ...(typeof lng === 'number' ? { lng } : {}),
    }))
  );
  return [
    base,
    `Regenerate ONLY day ${input.dayIndex} for ${input.city}, ${input.country}.`,
    `CURRENT BLOCKS: ${current}`,
    input.guidance ? `USER GUIDANCE: ${input.guidance}` : null,
    'Revise this day only. Keep what works; change what the guidance asks for.',
    'Return JSON with a single day: { "days": [{ "day_index": 1, "blocks": [...] }] }',
  ]
    .filter(Boolean)
    .join('\n');
}

function normalizeBlocks(raw: unknown): Omit<ItineraryBlock, 'id'>[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 3)
    .map((b) => {
      const parsed = parseItineraryBlock(b);
      if (!parsed?.title) return null;
      const { id: _id, ...rest } = parsed;
      if (!rest.description) rest.description = rest.title;
      return rest;
    })
    .filter((b): b is Omit<ItineraryBlock, 'id'> => b !== null);
}

function normalizeDays(raw: unknown, expectedCount: number): GeneratedItineraryDay[] {
  const root =
    raw && typeof raw === 'object' && Array.isArray((raw as { days?: unknown }).days)
      ? (raw as { days: unknown[] }).days
      : Array.isArray(raw)
        ? raw
        : [];

  const days: GeneratedItineraryDay[] = [];
  for (let i = 0; i < expectedCount; i++) {
    const entry = root[i];
    const o = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
    const blocks = normalizeBlocks(o.blocks);
    days.push({
      day_index: i + 1,
      blocks:
        blocks.length > 0
          ? blocks
          : fallbackDayBlocks(i + 1, expectedCount).blocks,
    });
  }
  return days;
}

function fallbackDayBlocks(
  dayIndex: number,
  totalDays: number,
  city?: string
): GeneratedItineraryDay {
  const place = city?.trim() || 'the area';
  const isFirst = dayIndex === 1;
  const isLast = dayIndex === totalDays;
  const blocks: Omit<ItineraryBlock, 'id'>[] = [];

  if (isFirst) {
    blocks.push({
      time_of_day: 'afternoon',
      title: `Check in and settle near ${place}`,
      description: `Drop bags, grab a coffee nearby, and take a short walk to get oriented.`,
    });
    blocks.push({
      time_of_day: 'evening',
      title: `Easy first dinner in ${place}`,
      description: `Pick a well-reviewed local spot close to where you're staying — keep it low-key after travel.`,
    });
  } else if (isLast) {
    blocks.push({
      time_of_day: 'morning',
      title: `Last highlights around ${place}`,
      description: `Hit one must-see spot or market you haven't done yet, staying close to your base.`,
    });
    blocks.push({
      time_of_day: 'afternoon',
      title: 'Pack up and head out',
      description: `Light lunch, collect belongings, and allow buffer time for your onward transfer.`,
    });
  } else {
    blocks.push({
      time_of_day: 'morning',
      title: `Explore a key ${place} neighborhood`,
      description: `Walk the main streets, pop into a local café, and see what catches your eye.`,
    });
    blocks.push({
      time_of_day: 'afternoon',
      title: 'One signature experience',
      description: `Book or visit a standout attraction, viewpoint, or food market that's specific to this city.`,
    });
    blocks.push({
      time_of_day: 'evening',
      title: 'Dinner and an early night',
      description: `Try a local dish you've heard about — save energy for tomorrow.`,
    });
  }

  return { day_index: dayIndex, blocks };
}

function fallbackDaysForStop(input: StopGenerationInput): GeneratedItineraryDay[] {
  const city = input.city.trim() || 'town';
  return Array.from({ length: Math.max(1, input.nights) }, (_, i) =>
    fallbackDayBlocks(i + 1, input.nights, city)
  );
}

async function callOpenAI(userPrompt: string, expectedDays: number): Promise<GeneratedItineraryDay[]> {
  if (!openai) return [];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.6,
    max_tokens: 3000,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '';
  const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
  const parsed = JSON.parse(jsonStr) as unknown;
  return normalizeDays(parsed, expectedDays);
}

/** Generate all days for one stop in a single GPT-4o call. */
export async function generateItineraryDaysForStop(
  input: StopGenerationInput
): Promise<GeneratedItineraryDay[]> {
  const nights = Math.max(1, Math.round(input.nights));

  try {
    const days = await callOpenAI(buildUserPrompt({ ...input, nights }), nights);
    if (days.length > 0) return days;
  } catch (err) {
    console.error('generateItineraryDaysForStop failed:', err);
  }

  return fallbackDaysForStop({ ...input, nights });
}

/** Regenerate a single day with optional user guidance. */
export async function regenerateItineraryDay(
  input: RegenerateDayInput
): Promise<GeneratedItineraryDay> {
  try {
    const days = await callOpenAI(buildRegenerateUserPrompt(input), 1);
    if (days[0]?.blocks?.length) return { day_index: input.dayIndex, blocks: days[0].blocks };
  } catch (err) {
    console.error('regenerateItineraryDay failed:', err);
  }

  return fallbackDayBlocks(input.dayIndex, input.nights, input.city);
}

/** Attach stable block ids for DB persistence. */
export function withBlockIds(days: GeneratedItineraryDay[]): GeneratedItineraryDay[] {
  return days.map((day) => ({
    ...day,
    blocks: day.blocks.map((b) => ({ ...b, id: blockId() })),
  }));
}

export function newBlankBlock(): ItineraryBlock {
  return {
    id: blockId(),
    time_of_day: 'afternoon',
    title: '',
    description: '',
  };
}
