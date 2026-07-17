import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import {
  buildMultiStopSuggestionsBlob,
  isStoredSuggestionsEmpty,
} from '@/lib/trip-preview';
import { distributeStops } from '@/lib/stop-parser';
import type { TripStop } from '@/types/trip';

type TripPayload = {
  title?: string;
  destination?: string;
  startDate?: string | null;
  endDate?: string | null;
  budgetAmount?: number | null;
  from?: string;
  vibe?: string;
  stops?: TripStop[];
  travelers?: {
    adults?: number;
    children?: number;
    kids?: number;
  };
  suggestion?: Record<string, unknown>;
  selections?: unknown;
};

function strField(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function numField(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function getSupabaseClient() {
  const cookieStore = await cookies(); // ✅ FIXED: await required in Next.js 15
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TripPayload;
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const suggestion = body.suggestion ?? {};

    const title =
      body.title ||
      body.destination ||
      strField(suggestion.title) ||
      strField(suggestion.destination) ||
      'Trip';

    const destination =
      body.destination || strField(suggestion.destination) || 'Unknown';

    const startDate =
      body.startDate ?? strField(suggestion.startDate) ?? null;

    const endDate =
      body.endDate ?? strField(suggestion.endDate) ?? null;

    const budgetAmount =
      body.budgetAmount != null && Number.isFinite(Number(body.budgetAmount))
        ? Number(body.budgetAmount)
        : null;

    const adults =
      body.travelers?.adults ?? numField(suggestion.adults, 2);

    const kids =
      body.travelers?.kids ??
      body.travelers?.children ??
      numField(suggestion.kids, 0);

    const travelersCount = adults + kids;
    const budgetCents =
      budgetAmount != null && Number.isFinite(Number(budgetAmount))
        ? Math.round(Number(budgetAmount) * 100)
        : null;
    const budgetDollars =
      budgetAmount != null && Number.isFinite(Number(budgetAmount))
        ? Number(budgetAmount)
        : null;
    const vibe = body.vibe ?? strField(suggestion.vibe) ?? null;

    const resolvedStops: TripStop[] =
      Array.isArray(body.stops) && body.stops.length > 0
        ? body.stops
        : Array.isArray(suggestion.stops) &&
            (suggestion.stops as unknown[]).length > 1
          ? distributeStops(
              suggestion.stops as string[],
              startDate ?? '',
              endDate ?? ''
            )
          : destination
            ? [
                {
                  id: 'stop-0',
                  destination,
                  startDate: startDate ?? '',
                  endDate: endDate ?? '',
                },
              ]
            : [];

    // Persist AI preview content (including per-stop previews for multi-city trips)
    // into trips.suggestions so reopening by ID shows full content — not URL-only.
    const suggestionsBlob = buildMultiStopSuggestionsBlob(suggestion, resolvedStops, {
      from: body.from,
      reason: suggestion.whyItFits,
      bestTime: suggestion.seasonality,
    });

    const { data, error } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        title,
        destination,
        start_date: startDate,
        end_date: endDate,
        travelers: travelersCount,
        budget_cents: budgetCents,
        budget_amount: budgetDollars,
        adults,
        kids,
        vibe,
        stops: resolvedStops.length > 0 ? resolvedStops : null,
        status: 'saved',
        suggestions: isStoredSuggestionsEmpty(suggestionsBlob) ? {} : suggestionsBlob,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting trip', error);
      // If trips table doesn't exist, fall back to saved_trips
      if (error.code === '42P01') {
        const { data: savedData, error: savedError } = await supabase
          .from('saved_trips')
          .insert({
            user_id: user.id,
            title,
            destination,
            start_date: startDate,
            end_date: endDate,
            budget_cents:
              budgetAmount != null && Number.isFinite(Number(budgetAmount))
                ? Math.round(Number(budgetAmount) * 100)
                : null,
            currency: 'usd',
            preferences: {
              suggestion: body.suggestion,
              travelers: { adults, kids },
            },
          })
          .select()
          .single();

        if (savedError) {
          return NextResponse.json({ error: savedError.message }, { status: 500 });
        }

        return NextResponse.json(savedData, { status: 201 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Unexpected error in /api/trips', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'my-trips';

    if (scope === 'my-trips') {
      let { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // If trips table doesn't exist, use saved_trips
      if (error && error.code === '42P01') {
        const { data: savedData, error: savedError } = await supabase
          .from('saved_trips')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (savedError) {
          return NextResponse.json({ error: savedError.message }, { status: 500 });
        }

        return NextResponse.json(savedData || [], { status: 200 });
      }

      if (error) {
        console.error('Error fetching trips', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data || [], { status: 200 });
    }

    return NextResponse.json({ error: 'Unsupported scope' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in GET /api/trips', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}
