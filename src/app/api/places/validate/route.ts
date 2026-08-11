import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateDestinationInput, validatePlace } from '@/lib/validate-place';

const BodySchema = z
  .object({
    destination: z.string().min(1).optional(),
    place: z.string().min(1).optional(),
    country: z.string().optional(),
  })
  .refine(
    (body) =>
      Boolean(body.destination?.trim()) ||
      Boolean(body.place?.trim() && body.country?.trim()),
    { message: 'Provide destination or place + country' }
  );

/** POST — validate a destination via geocoding (OpenWeather + Nominatim). */
export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());

    const result = body.destination?.trim()
      ? await validateDestinationInput(body.destination)
      : await validatePlace(body.place!, body.country!);

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          ambiguous: result.ambiguous ?? false,
          candidates: result.candidates,
        },
        { status: result.ambiguous ? 409 : 400 }
      );
    }

    return NextResponse.json({ ok: true, validated: result.validated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: 'Validation failed' }, { status: 500 });
  }
}
