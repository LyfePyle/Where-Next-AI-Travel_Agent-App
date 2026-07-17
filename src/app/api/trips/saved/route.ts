import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { parseDestinationToStops } from '@/lib/stop-parser';
import { buildMultiStopSuggestionsBlob, isStoredSuggestionsEmpty } from '@/lib/trip-preview';

interface SavedTrip {
  id: string;
  destination: string;
  estimatedCost: number;
  reason?: string;
  fitScore?: number;
  bestTime?: string;
  source: string;
  savedAt: string;
  tripDuration?: number;
  travelers?: number;
}

async function getSupabaseClient() {
  const cookieStore = await cookies(); // ✅ FIXED: await required in Next.js 15
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore cookie setting errors in middleware
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignore cookie removal errors in middleware
          }
        },
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = await getSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
    }
    
    if (!user) {
      return NextResponse.json([]);
    }

    const { data: savedTrips, error } = await supabase
      .from('saved_trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json([]);
    }

    const transformedTrips = savedTrips?.map((trip) => {
      const budgetCents = typeof trip.budget_cents === 'number' ? trip.budget_cents : null;
      const estimatedCost = typeof trip.estimated_cost === 'number'
        ? trip.estimated_cost
        : budgetCents !== null
          ? Math.round(budgetCents / 100)
          : null;

      const preferences = trip.preferences || {};

      return {
        id: trip.id,
        destination: trip.destination,
        estimatedCost: estimatedCost ?? 0,
        reason: trip.reason ?? preferences.reason,
        fitScore: trip.fit_score ?? preferences.fitScore,
        source: trip.source || preferences.source || 'saved',
        savedAt: trip.created_at,
        tripDuration: trip.trip_duration ?? preferences.tripDuration,
        travelers: trip.travelers ?? preferences.travelers
      };
    }) || [];
    
    return NextResponse.json(transformedTrips);
  } catch (error) {
    console.error('Error fetching saved trips:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const body = await request.json();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error in POST:', authError);
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to save trips' },
        { status: 401 }
      );
    }

    const destination = body.destination;
    const source = body.source || 'manual';
    const { reason, fitScore, tripDuration, travelers } = body;

    // User's stated budget from plan-trip — NOT the AI itinerary estimate.
    const userBudget =
      typeof body.budgetAmount === 'number' && Number.isFinite(body.budgetAmount)
        ? body.budgetAmount
        : body.budget != null && Number.isFinite(Number(body.budget))
          ? Number(body.budget)
          : null;
    const aiEstimate =
      body.estimatedCost ??
      (typeof body.suggestion?.estimatedTotal === 'number'
        ? body.suggestion.estimatedTotal
        : null);

    if (!destination) {
      return NextResponse.json(
        { error: 'Missing required field: destination' },
        { status: 400 }
      );
    }

    if (userBudget == null && aiEstimate == null) {
      return NextResponse.json(
        { error: 'Missing budget: provide budgetAmount (user budget) or estimatedCost (AI estimate)' },
        { status: 400 }
      );
    }

    const budgetToPersist = userBudget ?? aiEstimate!;

    const MAX_SAVED_TRIPS = 50;
    const { count } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count || 0) >= MAX_SAVED_TRIPS) {
      return NextResponse.json(
        { error: `You can save up to ${MAX_SAVED_TRIPS} trips. Delete an old trip to save a new one.` },
        { status: 429 }
      );
    }

    const { data: existingTrip } = await supabase
      .from('trips')
      .select('id')
      .eq('user_id', user.id)
      .ilike('destination', destination)
      .maybeSingle();

    if (existingTrip) {
      return NextResponse.json(
        { error: 'This destination is already in your saved trips' },
        { status: 409 }
      );
    }

    const title = body.title || `${destination.split(',')[0]?.trim() || destination} Trip`;
    const startDate = body.startDate || null;
    const endDate = body.endDate || null;
    const budgetCents = Math.round(Number(budgetToPersist) * 100);
    const adultsCount =
      typeof body.adults === 'number'
        ? body.adults
        : travelers
          ? Math.max(1, Math.floor(Number(travelers)))
          : 2;
    const kidsCount = typeof body.kids === 'number' ? body.kids : 0;

    // Prefer explicit stops sent by the client (e.g. suggestion.stops for a
    // multi-city trip). Otherwise split the destination string conservatively
    // so "Singapore, Bali & Yogyakarta" becomes 3 stops while "Bangkok,
    // Thailand" stays one.
    const stops =
      Array.isArray(body.stops) && body.stops.length > 0
        ? body.stops
        : parseDestinationToStops(destination, startDate || '', endDate || '');

    // Persist AI preview content (including per-stop previews for multi-city trips)
    // so trip hub / trip-details render fully when reopened by ID.
    const suggestionsBlob = buildMultiStopSuggestionsBlob(
      body.suggestion ?? {},
      stops,
      body
    );

    const { data: newTrip, error } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        title,
        destination,
        start_date: startDate,
        end_date: endDate,
        budget_amount: Number.isFinite(budgetCents) ? budgetCents / 100 : Number(budgetToPersist),
        adults: adultsCount,
        kids: kidsCount,
        travelers: adultsCount + kidsCount,
        vibe: body.vibe ?? null,
        stops: stops.length > 0 ? stops : null,
        status: 'saved',
        suggestions: isStoredSuggestionsEmpty(suggestionsBlob) ? {} : suggestionsBlob,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error saving trip:', error);
      return NextResponse.json(
        { error: `Failed to save trip: ${error.message || 'Database error'}` },
        { status: 500 }
      );
    }

    const transformedTrip = {
      id: newTrip.id,
      destination: newTrip.destination,
      estimatedCost: Number.isFinite(budgetCents) ? Math.round(budgetCents / 100) : 0,
      reason,
      fitScore: fitScore ? Number(fitScore) : null,
      source,
      savedAt: newTrip.created_at,
      tripDuration: tripDuration ? Number(tripDuration) : null,
      travelers: travelers ? Number(travelers) : null
    };

    return NextResponse.json({ 
      success: true, 
      trip: transformedTrip,
      message: 'Trip saved successfully!'
    });

  } catch (error: any) {
    console.error('Error saving trip:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save trip. Please try again.' },
      { status: 500 }
    );
  }
}
