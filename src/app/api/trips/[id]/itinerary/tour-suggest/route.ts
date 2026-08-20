import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { normalizeTripStopsFromRow } from '@/lib/trip-stops';
import {
  extractTripItineraryContext,
  fetchItineraryDays,
} from '@/lib/trip-itinerary';
import { isFreeTimeDay } from '@/lib/itinerary-free-time';
import {
  buildTourDayAlternatives,
  buildTourDaySuggestion,
  locateSuggestionBlocks,
  suggestionFromStops,
} from '@/lib/itinerary-tour-suggest';
import { normalizeStop } from '@/lib/tour-generate-core';
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

function cityFromStop(stop: { city?: string; destination: string; country?: string }): string {
  return stop.city || stop.destination.split(',')[0]?.trim() || stop.destination;
}

function countryFromStop(stop: { city?: string; destination: string; country?: string }): string {
  return stop.country || stop.destination.split(',').pop()?.trim() || '';
}

/**
 * POST — generate or convert a walking-tour suggestion for one day.
 * Never writes itinerary rows. Accept happens via the existing PATCH.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const loaded = await loadOwnedTrip(supabase, id);
  if ('error' in loaded && loaded.error) return loaded.error;

  const { trip } = loaded as { trip: Record<string, unknown> };

  let body: { dayId?: string; alternatives?: boolean; stops?: unknown; blocks?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const dayId = typeof body.dayId === 'string' ? body.dayId.trim() : '';
  if (!dayId) {
    return NextResponse.json({ error: 'dayId is required' }, { status: 400 });
  }

  const stops = normalizeTripStopsFromRow(trip);
  const days = await fetchItineraryDays(supabase, id);
  const day = days.find((d) => d.id === dayId);
  if (!day) {
    return NextResponse.json({ error: 'Day not found' }, { status: 404 });
  }

  const stop = stops.find((s) => s.id === day.stop_id);
  if (!stop) {
    return NextResponse.json({ error: 'Stop not found' }, { status: 404 });
  }

  const stopDayCount = days.filter((d) => d.stop_id === day.stop_id).length;
  const locatingExisting = Array.isArray(body.blocks);
  const convertingStops = Array.isArray(body.stops);
  if (!body.alternatives && !convertingStops && !locatingExisting && !isFreeTimeDay(day, stopDayCount)) {
    return NextResponse.json(
      { error: 'This day is not eligible for a walking-tour suggestion' },
      { status: 409 }
    );
  }

  const context = extractTripItineraryContext(trip);
  const city = cityFromStop(stop);
  const country = countryFromStop(stop);

  try {
    if (locatingExisting) {
      const parsed = (body.blocks as unknown[])
        .map((b) => parseItineraryBlock(b))
        .filter((b): b is ItineraryBlock => b !== null);
      const blocks = await locateSuggestionBlocks(parsed, city, country);
      return NextResponse.json({ ok: true, suggestion: { title: '', blocks, stopCount: blocks.length, extraStopNames: [] } });
    }

    if (convertingStops) {
      const tourStops = (body.stops as unknown[]).map((raw, i) =>
        normalizeStop(raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}, i)
      );
      const suggestion = suggestionFromStops('Walking tour', tourStops);
      suggestion.blocks = await locateSuggestionBlocks(suggestion.blocks, city, country);
      return NextResponse.json({ ok: true, suggestion });
    }

    if (body.alternatives) {
      const options = await buildTourDayAlternatives({
        city,
        country,
        vibes: context.vibes,
        additionalDetails: context.additionalDetails,
      });
      return NextResponse.json({ ok: true, options });
    }

    const suggestion = await buildTourDaySuggestion({
      city,
      country,
      vibes: context.vibes,
      additionalDetails: context.additionalDetails,
    });
    return NextResponse.json({ ok: true, suggestion });
  } catch (err) {
    console.error('itinerary tour-suggest failed:', err);
    return NextResponse.json({ error: 'Failed to generate walking tour suggestion' }, { status: 500 });
  }
}
