import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { serializeStopsForDb, validateStopsForSave } from '@/lib/trip-stops';
import { tripDestinationSummary, tripEndDate, tripStartDate } from '@/types/trip';
import type { TripStop } from '@/types/trip';
import { normalizeFromTrips } from '@/lib/trip-normalize';

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

interface UndoSnapshot {
  stops: TripStop[];
  suggestions?: unknown;
  destination?: string;
  start_date?: string | null;
  end_date?: string | null;
  itinerary_days?: import('@/types/itinerary').TripItineraryDay[];
}

/** POST — restore pre-edit snapshot from last AI change */
export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: trip, error } = await supabase.from('trips').select('*').eq('id', id).single();
  if (error || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }
  if (trip.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const snapshot = trip.undo_snapshot as UndoSnapshot | null;
  const expiresAt = trip.undo_expires_at as string | null;

  if (!snapshot?.stops?.length) {
    return NextResponse.json({ error: 'Nothing to undo' }, { status: 400 });
  }

  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Undo window expired' }, { status: 400 });
  }

  const serialized = serializeStopsForDb(snapshot.stops);
  if (!serialized) {
    return NextResponse.json({ error: 'Invalid undo snapshot' }, { status: 500 });
  }

  const validation = validateStopsForSave(serialized);
  if (!validation.ok) {
    return NextResponse.json({ error: 'Undo snapshot failed validation' }, { status: 500 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('trips')
    .update({
      stops: serialized,
      suggestions: snapshot.suggestions ?? trip.suggestions,
      destination: snapshot.destination ?? tripDestinationSummary(serialized),
      start_date: snapshot.start_date ?? tripStartDate(serialized) ?? null,
      end_date: snapshot.end_date ?? tripEndDate(serialized) ?? null,
      undo_snapshot: null,
      undo_expires_at: null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError || !updated) {
    console.error('Undo restore failed:', updateError);
    return NextResponse.json({ error: 'Failed to undo' }, { status: 500 });
  }

  if (snapshot.itinerary_days && Array.isArray(snapshot.itinerary_days)) {
    await supabase.from('trip_itinerary_days').delete().eq('trip_id', id);
    const rows = snapshot.itinerary_days.map((day) => ({
      id: day.id,
      trip_id: id,
      stop_id: day.stop_id,
      day_index: day.day_index,
      date: day.date,
      blocks: day.blocks,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length > 0) {
      const { error: restoreError } = await supabase.from('trip_itinerary_days').insert(rows);
      if (restoreError) console.error('Itinerary undo restore failed:', restoreError);
    }
  }

  await supabase.from('trip_chat_messages').insert({
    trip_id: id,
    role: 'assistant',
    content: 'Reverted that change.',
    metadata: { undo_reversal: true },
  });

  return NextResponse.json({
    trip: normalizeFromTrips(updated),
    undoAvailable: false,
  });
}
