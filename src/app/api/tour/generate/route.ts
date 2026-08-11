import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const TourGenerateSchema = z.object({
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  preferences: z.string().optional(),
  trip_id: z.string().uuid().optional(),
});

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

export type TourGenerateResponse = {
  stops: TourStop[];
  title: string;
};

const VALID_CATEGORIES = new Set(['food', 'scenic', 'historic', 'kid-friendly']);

function normalizeStop(raw: Record<string, unknown>, index: number): TourStop {
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

/**
 * POST /api/tour/generate
 * Auth optional. Body: { city, country, preferences?, trip_id? }
 * Returns 6–8 stops with coordinates. Saves to Supabase only when trip_id + signed-in user.
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }
    if (!openaiKey) {
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const { data: userData } = await supabase.auth.getUser(authHeader.slice(7));
      userId = userData?.user?.id ?? null;
    }

    const body = await req.json();
    const { city, country, preferences, trip_id } = TourGenerateSchema.parse(body);

    const openai = new OpenAI({ apiKey: openaiKey });
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

    // Strip markdown code fences if the model wraps its response anyway.
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsed: TourGenerateResponse;
    try {
      parsed = JSON.parse(cleaned) as TourGenerateResponse;
    } catch (parseErr) {
      const detail = `Failed to parse OpenAI JSON. Raw (first 500 chars): ${raw
        .trim()
        .slice(0, 500)}`;
      throw new Error(detail);
    }
    const rawStops = Array.isArray(parsed.stops) ? parsed.stops : [];
    const stops = rawStops.map((stop, index) =>
      normalizeStop(stop && typeof stop === 'object' ? (stop as Record<string, unknown>) : {}, index)
    );
    const title = typeof parsed.title === 'string' ? parsed.title : `Walking tour: ${city}`;

    if (trip_id && userId) {
      const tourId = `tour_${Date.now()}`;
      const { error } = await supabase.from('walking_tours').insert({
        id: tourId,
        user_id: userId,
        trip_id,
        city,
        country: country ?? null,
        title,
        stops,
      });
      if (error) {
        console.error('Tour save error:', error);
      }
    }

    return NextResponse.json({
      ok: true,
      data: { title, stops },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid input', details: err.errors }, { status: 400 });
    }
    const anyErr = err as any;
    const message =
      anyErr?.error?.message ||
      (err instanceof Error ? err.message : 'Failed to generate tour');

    console.error('Tour generate error:', err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
