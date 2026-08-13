import OpenAI from 'openai';

export type TourStop = {
  name: string;
  description: string;
  local_tip: string;
  known_for?: string;
  best_time?: string;
  time_to_spend?: string;
  categories?: string[];
  lat: number;
  lng: number;
  order: number;
};

const VALID_CATEGORIES = new Set(['food', 'scenic', 'historic', 'kid-friendly']);

export function normalizeStop(raw: Record<string, unknown>, index: number): TourStop {
  const categories = Array.isArray(raw.categories)
    ? raw.categories
        .map((c) => (typeof c === 'string' ? c.toLowerCase().trim() : ''))
        .filter((c) => VALID_CATEGORIES.has(c))
    : [];

  return {
    name: typeof raw.name === 'string' ? raw.name.trim() : `Stop ${index + 1}`,
    description: typeof raw.description === 'string' ? raw.description.trim() : '',
    local_tip: typeof raw.local_tip === 'string' ? raw.local_tip.trim() : '',
    known_for: typeof raw.known_for === 'string' ? raw.known_for.trim() : undefined,
    best_time: typeof raw.best_time === 'string' ? raw.best_time.trim() : undefined,
    time_to_spend: typeof raw.time_to_spend === 'string' ? raw.time_to_spend.trim() : undefined,
    categories: categories.length ? categories : undefined,
    lat: Number(raw.lat) || 0,
    lng: Number(raw.lng) || 0,
    order: typeof raw.order === 'number' ? raw.order : index + 1,
  };
}

function parseJsonContent(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

export async function generateSingleTour(
  openai: OpenAI,
  city: string,
  country: string,
  preferences?: string
): Promise<{ title: string; stops: TourStop[] }> {
  const prompt = `You are a local travel guide. Generate a walking tour for ${city}, ${country}.
${preferences ? `Preferences: ${preferences}` : ''}

Return a JSON object with:
- "title": string (short tour title)
- "stops": array of 6–8 stops. Each stop must have:
  - "name": string
  - "description": string (2–3 sentences)
  - "local_tip": string (one insider tip)
  - "known_for": string (what this place is famous for, one short phrase)
  - "best_time": string (best time of day or season to visit this stop)
  - "time_to_spend": string (suggested duration, e.g. "45–60 min")
  - "categories": array of 1–3 tags from ONLY: "food", "scenic", "historic", "kid-friendly"
  - "lat": number (latitude, use realistic coordinates for the city)
  - "lng": number (longitude)
  - "order": number (1, 2, 3, ...)

Output only valid JSON, no markdown or extra text.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a JSON API. Respond with raw JSON only (no markdown, no code fences, no explanation).',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.6,
    max_tokens: 3500,
  });

  const raw = completion.choices[0]?.message?.content ?? '';
  if (!raw.trim()) throw new Error('OpenAI returned empty content');

  const parsed = parseJsonContent(raw) as { title?: string; stops?: unknown[] };
  const rawStops = Array.isArray(parsed.stops) ? parsed.stops : [];
  const stops = rawStops.map((stop, index) =>
    normalizeStop(stop && typeof stop === 'object' ? (stop as Record<string, unknown>) : {}, index)
  );
  const title = typeof parsed.title === 'string' ? parsed.title : `Walking tour: ${city}`;
  return { title, stops };
}

export type TourOption = {
  title: string;
  summary: string;
  theme: string;
  stops: TourStop[];
};

export async function generateTourOptions(
  openai: OpenAI,
  city: string,
  country: string,
  preferences?: string
): Promise<TourOption[]> {
  const prompt = `You are a local travel guide for ${city}, ${country}.
${preferences ? `Traveler preferences: ${preferences}` : 'No specific preferences — tailor options to what this destination is best known for.'}

Generate 2–4 DISTINCT walking tour options a traveler could choose from. Each should feel meaningfully different (e.g. food-focused, historic core, scenic viewpoints, neighborhood immersion — pick themes that fit THIS city, do not force generic themes).

Return JSON:
{
  "options": [
    {
      "title": "short catchy tour name",
      "summary": "one sentence hook for the card preview",
      "theme": "2-4 word theme label",
      "stops": [ /* 5–7 stops each, same stop schema as below */ ]
    }
  ]
}

Each stop must have: name, description (2 sentences max for card context), local_tip, known_for, best_time, time_to_spend, categories (from ONLY: food, scenic, historic, kid-friendly), lat, lng, order.

Use realistic coordinates for ${city}. Output only valid JSON.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a JSON API. Respond with raw JSON only (no markdown, no code fences, no explanation).',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.75,
    max_tokens: 8000,
  });

  const raw = completion.choices[0]?.message?.content ?? '';
  if (!raw.trim()) throw new Error('OpenAI returned empty content');

  const parsed = parseJsonContent(raw) as { options?: unknown[] };
  const options = Array.isArray(parsed.options) ? parsed.options : [];

  return options
    .map((opt) => {
      if (!opt || typeof opt !== 'object') return null;
      const o = opt as Record<string, unknown>;
      const rawStops = Array.isArray(o.stops) ? o.stops : [];
      const stops = rawStops.map((stop, index) =>
        normalizeStop(
          stop && typeof stop === 'object' ? (stop as Record<string, unknown>) : {},
          index
        )
      );
      if (!stops.length) return null;
      return {
        title: typeof o.title === 'string' ? o.title.trim() : `Walking tour: ${city}`,
        summary: typeof o.summary === 'string' ? o.summary.trim() : '',
        theme: typeof o.theme === 'string' ? o.theme.trim() : 'Walking tour',
        stops,
      };
    })
    .filter((o): o is TourOption => o !== null);
}
