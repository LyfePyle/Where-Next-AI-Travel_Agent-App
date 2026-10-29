import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import OpenAI from 'openai';
import {
  formatTripBrief,
  nextSuggestionChatCount,
  normalizeTripBrief,
  type TripBrief,
} from '@/lib/suggestion-chat';

export const dynamic = 'force-dynamic';

const COUNT_COOKIE = 'wn_suggest_chat';

type StoredCount = { n: number; userId: string | null };

function readCount(raw: string | undefined): StoredCount {
  try {
    const parsed = JSON.parse(raw ?? '') as StoredCount;
    if (typeof parsed.n === 'number') {
      return { n: parsed.n, userId: parsed.userId ?? null };
    }
  } catch {
    /* fresh visitor */
  }
  return { n: 0, userId: null };
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let userId: string | null = null;
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    });
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  }

  const previous = readCount(cookieStore.get(COUNT_COOKIE)?.value);
  const gate = nextSuggestionChatCount({
    previous: previous.n,
    previousUserId: previous.userId,
    userId,
  });
  if (!gate.allowed) {
    return NextResponse.json(
      {
        error: userId
          ? 'Chat limit reached for this visit.'
          : 'Sign in to keep planning. Free visitors get 5 messages.',
        signIn: !userId,
      },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => null)) as {
    message?: string;
    brief?: TripBrief;
    destination?: string;
  } | null;
  const message = body?.message?.trim() ?? '';
  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Chat is not configured' }, { status: 503 });
  }

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: [
          'You edit a trip request. Return JSON only.',
          'Shape: {"reply":"one short sentence","brief":{"regions":[],"party":"","pace":"","mustDo":[],"avoid":[],"notes":""},"destination":null,"vibes":null,"adults":null,"kids":null}',
          'Merge the new message into the existing brief. Keep earlier must-dos unless the user retracts them.',
          'destination is a place or region string when the user names where to go, otherwise null.',
          'vibes is an array of short vibe words or null. adults and kids are numbers or null.',
          'Do not invent a day-by-day itinerary.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify({
          currentDestination: body?.destination ?? '',
          currentBrief: body?.brief ?? null,
          message,
        }),
      },
    ],
  });

  const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}') as {
    reply?: string;
    brief?: unknown;
    destination?: string | null;
    vibes?: string[] | null;
    adults?: number | null;
    kids?: number | null;
  };
  const brief = normalizeTripBrief(parsed.brief);
  const response = NextResponse.json({
    reply: parsed.reply?.trim() || 'Updated your trip request.',
    brief,
    summary: formatTripBrief(brief),
    destination: typeof parsed.destination === 'string' ? parsed.destination.trim() : null,
    vibes: Array.isArray(parsed.vibes) ? parsed.vibes.map((v) => String(v).trim()).filter(Boolean) : null,
    adults: typeof parsed.adults === 'number' ? parsed.adults : null,
    kids: typeof parsed.kids === 'number' ? parsed.kids : null,
  });
  response.cookies.set(
    COUNT_COOKIE,
    JSON.stringify({ n: gate.count, userId } satisfies StoredCount),
    { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 }
  );
  return response;
}
