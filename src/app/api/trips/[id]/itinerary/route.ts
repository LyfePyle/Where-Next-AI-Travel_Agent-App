import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { normalizeTripStopsFromRow, serializeStopsForDb, tripKnownNights } from '@/lib/trip-stops';
import { applyDurationNights } from '@/lib/split-stop-nights';
import {
  extractTripItineraryContext,
  fetchItineraryDays,
  generateItineraryForTrip,
  itineraryIsComplete,
} from '@/lib/trip-itinerary';
import type { ItineraryBlock } from '@/types/itinerary';
import { parseItineraryBlock } from '@/lib/itinerary-blocks';

async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: (n, v, o) => cookieStore.set({ name: n, value: v, ...o }),
        remove: (n, o) => cookieStore.set({ name: n, value: '', ...o }),
      },
    }
  );
}

async function loadOwnedTrip(supabase: Awaited<ReturnType<typeof supabaseServer>>, id: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: trip, error } = await supabase.from('trips').select('*').eq('id', id).single();
  if (error || !trip) {
    return { error: NextResponse.json({ error: 'Trip not found' }, { status: 404 }) };
  }
  if (trip.user_id !== user.id) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user, trip };
}

function tableMissingResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        'Itinerary is not set up yet — run supabase/migrations/add-itinerary-days.sql in the Supabase SQL Editor.',
      days: [],
      complete: false,
    },
    { status: 503 }
  );
}

/** GET — fetch itinerary days for a trip */
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const loaded = await loadOwnedTrip(supabase, id);
  if ('error' in loaded && loaded.error) return loaded.error;

  const { trip } = loaded as { trip: Record<string, unknown> };
  const stops = normalizeTripStopsFromRow(trip);

  const { data, error } = await supabase
    .from('trip_itinerary_days')
    .select('*')
    .eq('trip_id', id)
    .order('stop_id')
    .order('day_index');

  if (error) {
    if (error.message?.includes('trip_itinerary_days') || error.code === 'PGRST205') {
      return tableMissingResponse();
    }
    console.error('itinerary GET failed:', error);
    return NextResponse.json({ error: 'Failed to load itinerary' }, { status: 500 });
  }

  const days = await fetchItineraryDays(supabase, id);

  return NextResponse.json({
    days,
    complete: itineraryIsComplete(stops, days),
    needsDayCount: tripKnownNights(stops) == null,
    stops: stops.map((s) => ({ id: s.id, destination: s.destination })),
  });
}

/** PATCH — update blocks for one day (client-side add/remove/edit) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const loaded = await loadOwnedTrip(supabase, id);
  if ('error' in loaded && loaded.error) return loaded.error;

  let body: { dayId?: string; blocks?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const dayId = typeof body.dayId === 'string' ? body.dayId.trim() : '';
  if (!dayId) {
    return NextResponse.json({ error: 'dayId is required' }, { status: 400 });
  }
  if (!Array.isArray(body.blocks)) {
    return NextResponse.json({ error: 'blocks must be an array' }, { status: 400 });
  }

  const blocks: ItineraryBlock[] = body.blocks
    .map((b) => parseItineraryBlock(b))
    .filter((b): b is ItineraryBlock => b !== null)
    .slice(0, 6);

  const { data: existing, error: fetchError } = await supabase
    .from('trip_itinerary_days')
    .select('id, trip_id')
    .eq('id', dayId)
    .eq('trip_id', id)
    .maybeSingle();

  if (fetchError?.message?.includes('trip_itinerary_days') || fetchError?.code === 'PGRST205') {
    return tableMissingResponse();
  }
  if (!existing) {
    return NextResponse.json({ error: 'Day not found' }, { status: 404 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('trip_itinerary_days')
    .update({ blocks, updated_at: new Date().toISOString() })
    .eq('id', dayId)
    .select('*')
    .single();

  if (updateError || !updated) {
    console.error('itinerary PATCH failed:', updateError);
    return NextResponse.json({ error: 'Failed to update day' }, { status: 500 });
  }

  return NextResponse.json({ day: updated });
}

const MAX_ITINERARY_DAYS = 30;

function requestedTripDays(body: unknown): number | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  const n = Number(o.days ?? o.nights);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(MAX_ITINERARY_DAYS, Math.round(n));
}

/** POST — generate itinerary for all stops (also used after save) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const loaded = await loadOwnedTrip(supabase, id);
  if ('error' in loaded && loaded.error) return loaded.error;

  const { trip } = loaded as { trip: Record<string, unknown> };
  let stops = normalizeTripStopsFromRow(trip);
  if (stops.length === 0) {
    return NextResponse.json({ error: 'Trip has no stops' }, { status: 400 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const daysRequested = requestedTripDays(body);

  if (tripKnownNights(stops) == null) {
    if (daysRequested == null) {
      return NextResponse.json(
        {
          error: 'How many days is this trip?',
          code: 'NEEDS_DAY_COUNT',
          needsDayCount: true,
        },
        { status: 409 }
      );
    }
    const withLength = applyDurationNights(stops, daysRequested);
    const serialized = serializeStopsForDb(withLength);
    if (serialized) {
      const { error: persistError } = await supabase
        .from('trips')
        .update({ stops: serialized })
        .eq('id', id);
      if (persistError) {
        console.error('itinerary POST persist nights failed:', persistError);
        return NextResponse.json(
          { error: 'Failed to save trip length' },
          { status: 500 }
        );
      }
      stops = serialized;
    }
  }

  const probe = await supabase.from('trip_itinerary_days').select('id').limit(1);
  if (probe.error?.message?.includes('trip_itinerary_days') || probe.error?.code === 'PGRST205') {
    return tableMissingResponse();
  }

  try {
    const context = extractTripItineraryContext(trip);
    const days = await generateItineraryForTrip(supabase, id, stops, context);
    return NextResponse.json({
      days,
      complete: itineraryIsComplete(stops, days),
      needsDayCount: false,
    });
  } catch (err) {
    console.error('itinerary POST generate failed:', err);
    return NextResponse.json({ error: 'Failed to generate itinerary' }, { status: 500 });
  }
}
