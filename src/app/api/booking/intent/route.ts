import { NextResponse } from 'next/server';
import { z } from 'zod';

const Schema = z.object({
  tripId: z.string(),
  type: z.enum(['flight', 'hotel']),
  provider: z.string(),
  partnerUrl: z.string().url(),
  payload: z.any().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json({ id: 'temp_intent', partnerUrl: parsed.data.partnerUrl });
}
