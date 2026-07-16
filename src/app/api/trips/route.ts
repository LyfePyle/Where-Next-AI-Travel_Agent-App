import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { buildTripPreview, isPreviewEmpty } from '@/lib/trip-preview';

type TripPayload = {
  title?: string;
  destination: string;
  startDate?: string | null;
  endDate?: string | null;
  budgetAmount?: number | null;
  from?: string;
  vibe?: string;
  travelers?: {
    adults?: number;
    children?: number;
    kids?: number;
  };
  suggestion?: any;
  selections?: any;
};

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

    const title =
      body.title ||
      body.destination ||
      body.suggestion?.title ||
      body.suggestion?.destination ||
      'Trip';

    const destination =
      body.destination || body.suggestion?.destination || 'Unknown';

    const startDate =
      body.startDate || body.suggestion?.startDate || null;

    const endDate =
      body.endDate || body.suggestion?.endDate || null;

    const budgetAmount =
      body.budgetAmount ??
      body.suggestion?.estimatedTotal ??
      body.suggestion?.budgetAmount ??
      null;

    const adults =
      body.travelers?.adults ??
      body.suggestion?.adults ??
      2;

    const kids =
      body.travelers?.kids ??
      body.travelers?.children ??
      body.suggestion?.kids ??
      0;

    const travelersCount = adults + kids;
    const budgetCents =
      budgetAmount != null && Number.isFinite(Number(budgetAmount))
        ? Math.round(Number(budgetAmount) * 100)
        : null;
    const budgetDollars =
      budgetAmount != null && Number.isFinite(Number(budgetAmount))
        ? Number(budgetAmount)
        : null;
    const vibe = body.vibe ?? body.suggestion?.vibe ?? null;

    // Persist the AI preview content (description / whyItFits / highlights / cost bands)
    // into the `suggestions` jsonb column so the trip renders fully when reopened by ID
    // — not just when arriving fresh from a suggestion click with URL params.
    const preview = buildTripPreview({ ...(body.suggestion ?? {}), from: body.from });

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
        status: 'saved',
        suggestions: isPreviewEmpty(preview) ? {} : preview,
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
            budget_cents: budgetAmount ? Math.round(budgetAmount * 100) : null,
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
