import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { normalizeTripStopsFromRow } from '@/lib/trip-stops';
import {
  extractTripItineraryContext,
  fetchItineraryDays,
  generateItineraryForTrip,
  itineraryIsComplete,
} from '@/lib/trip-itinerary';
import type { ItineraryBlock } from '@/types/itinerary';

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
    .map((b) => {
      if (!b || typeof b !== 'object') return null;
      const o = b as Record<string, unknown>;
      const blockId =
        typeof o.id === 'string' && o.id.trim()
          ? o.id.trim()
          : `blk-${Math.random().toString(36).slice(2, 10)}`;
      const time = typeof o.time_of_day === 'string' ? o.time_of_day : 'afternoon';
      const time_of_day =
        time === 'morning' || time === 'afternoon' || time === 'evening'
          ? time
          : 'afternoon';
      return {
        id: blockId,
        time_of_day,
        title: typeof o.title === 'string' ? o.title : '',
        description: typeof o.description === 'string' ? o.description : '',
      };
    })
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

/** POST — generate itinerary for all stops (also used after save) */
export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const loaded = await loadOwnedTrip(supabase, id);
  if ('error' in loaded && loaded.error) return loaded.error;

  const { trip } = loaded as { trip: Record<string, unknown> };
  const stops = normalizeTripStopsFromRow(trip);
  if (stops.length === 0) {
    return NextResponse.json({ error: 'Trip has no stops' }, { status: 400 });
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
    });
  } catch (err) {
    console.error('itinerary POST generate failed:', err);
    return NextResponse.json({ error: 'Failed to generate itinerary' }, { status: 500 });
  }
}
