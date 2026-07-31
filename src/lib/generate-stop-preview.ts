/**
 * Generate AI preview content for a single stop (add/swap in chat or editor).
 */

import OpenAI from 'openai';
import { buildStopPreview, type StopPreview } from '@/lib/trip-preview';
import { formatStopDestination } from '@/lib/trip-mutations';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function fallbackPreview(place: string, country: string): StopPreview {
  const destination = formatStopDestination(place, country);
  return {
    destination,
    description: `Explore ${place.trim()} — local culture, food, and hidden gems.`,
    highlights: [`Discover ${place.trim()}`, 'Local cuisine', 'Neighbourhood walks'],
    crowdLevel: 'Medium',
    seasonality: 'Varies by season',
    hotelBand: { min: 80, max: 180, style: 'Mid-range', area: 'City centre' },
  };
}

export async function generateStopPreview(
  place: string,
  country: string,
  context?: { vibe?: string; budgetAmount?: number }
): Promise<StopPreview> {
  const destination = formatStopDestination(place, country);

  if (!openai) {
    return fallbackPreview(place, country);
  }

  const system = `You write concise travel preview blurbs for one city stop.
Output ONLY raw JSON — no markdown.
Fields: destination (full "City, Country"), description (max 100 chars, unique to THIS city),
highlights (3 short strings), crowdLevel ("Low"|"Medium"|"High"), seasonality (short phrase),
hotelBand {min, max, style, area} in USD per night.`;

  const user = [
    `City: ${place.trim()}, ${country.trim()}`,
    context?.vibe ? `Trip vibe: ${context.vibe}` : null,
    context?.budgetAmount ? `Trip budget: $${context.budgetAmount}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 400,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    return buildStopPreview({ ...parsed, destination });
  } catch (err) {
    console.error('generateStopPreview failed:', err);
    return fallbackPreview(place, country);
  }
}
