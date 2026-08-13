import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { generateTourOptions } from '@/lib/tour-generate-core';

const OptionsSchema = z.object({
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  preferences: z.string().optional(),
});

/**
 * POST /api/tour/generate-options
 * Returns 2–4 distinct walking tour variations for a destination (one AI call).
 */
export async function POST(req: NextRequest) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { city, country, preferences } = OptionsSchema.parse(body);

    const openai = new OpenAI({ apiKey: openaiKey });
    const options = await generateTourOptions(openai, city, country, preferences);

    if (!options.length) {
      return NextResponse.json(
        { ok: false, error: 'No tour options generated — try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data: { options } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid input', details: err.errors }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Failed to generate tour options';
    console.error('Tour generate-options error:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
