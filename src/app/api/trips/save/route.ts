import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { TripStop, tripDestinationSummary, tripStartDate, tripEndDate } from '@/types/trip';
import { serializeStopsForDb } from '@/lib/trip-stops';

/**
 * POST /api/trips/save — writes to `trips` (must match /saved page query).
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    let userId: string | null = null;

    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: () => {},
        remove: () => {},
      },
    });
    const { data: sessionUser } = await supabaseAuth.auth.getUser();
    userId = sessionUser?.user?.id ?? null;

    const authHeader = req.headers.get('authorization');
    if (!userId && authHeader?.startsWith('Bearer ')) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
      userId = data?.user?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Sign in to save trips to your account' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    let stops: TripStop[] = [];

    if (Array.isArray(body.stops) && body.stops.length > 0) {
      stops = body.stops;
    } else if (body.destination || body.tripDetail?.destination) {
      const d = body.tripDetail ?? body;
      stops = [
        {
          id: 'stop-0',
          destination: d.destination ?? body.destination ?? '',
          startDate: d.dates?.startDate ?? body.startDate ?? body.preferences?.startDate ?? '',
          endDate: d.dates?.endDate ?? body.endDate ?? body.preferences?.endDate ?? '',
        },
      ];
    }

    if (stops.length === 0) {
      return NextResponse.json({ error: 'No stops provided' }, { status: 400 });
    }

    const stopsForDb = serializeStopsForDb(stops) ?? stops;

    const destination = body.title ?? tripDestinationSummary(stops);
    const startDate = tripStartDate(stops);
    const endDate = tripEndDate(stops);
    const prefs = body.preferences ?? body;

    const insertPayload: Record<string, unknown> = {
      title: destination,
      destination,
      start_date: startDate || null,
      end_date: endDate || null,
      travelers: (body.adults ?? prefs?.adults ?? 1) + (body.kids ?? prefs?.kids ?? 0),
      adults: body.adults ?? prefs?.adults ?? 1,
      kids: body.kids ?? prefs?.kids ?? 0,
      budget_amount: body.budgetAmount ?? prefs?.budgetAmount ?? body.tripDetail?.estimatedTotal ?? null,
      vibe: body.vibe ?? prefs?.vibes?.[0] ?? null,
      stops: stopsForDb,
      status: 'saved',
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('trips')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('[trips/save] insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ trip: data, id: data.id });
  } catch (err) {
    console.error('[trips/save] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ trips: [] });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: (n, v, o) => {
          try {
            cookieStore.set({ name: n, value: v, ...o });
          } catch {
            /* server component context */
          }
        },
        remove: (n, o) => {
          try {
            cookieStore.set({ name: n, value: '', ...o });
          } catch {
            /* server component context */
          }
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', trips: [] },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[trips/save] GET error:', error);
      return NextResponse.json({ trips: [] });
    }

    return NextResponse.json({ trips: data ?? [] });
  } catch (err) {
    console.error('[trips/save] GET error:', err);
    return NextResponse.json({ trips: [] });
  }
}
