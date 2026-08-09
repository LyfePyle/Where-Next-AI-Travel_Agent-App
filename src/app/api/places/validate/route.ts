import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validatePlace } from '@/lib/validate-place';

const BodySchema = z.object({
  place: z.string().min(1),
  country: z.string().min(1),
});

/** POST — validate a city/country via geocoding (OpenWeather + Nominatim). */
export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    const result = await validatePlace(body.place, body.country);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, validated: result.validated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: 'Validation failed' }, { status: 500 });
  }
}
