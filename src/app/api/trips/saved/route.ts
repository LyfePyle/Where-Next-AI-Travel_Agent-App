import { NextRequest, NextResponse } from 'next/server';

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

import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Try to get user from session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Return empty array for non-authenticated users instead of error
      return NextResponse.json([]);
    }

    // Fetch saved trips from database
    const { data: savedTrips, error } = await supabase
      .from('saved_trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      // Return fallback empty array instead of throwing error
      return NextResponse.json([]);
    }

    // Transform database format to match frontend expectations
    const transformedTrips = savedTrips?.map(trip => ({
      id: trip.id,
      destination: trip.destination,
      estimatedCost: trip.estimated_cost,
      reason: trip.reason,
      fitScore: trip.fit_score,
      bestTime: trip.best_time,
      source: trip.source || 'saved',
      savedAt: trip.created_at,
      tripDuration: trip.trip_duration,
      travelers: trip.travelers
    })) || [];
    
    return NextResponse.json(transformedTrips);
  } catch (error) {
    console.error('Error fetching saved trips:', error);
    // Return empty array as fallback
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    
    // Get user from session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to save trips' },
        { status: 401 }
      );
    }

    // Handle different field formats
    const destination = body.destination;
    const estimatedCost = body.estimatedCost || body.budget;
    const source = body.source || 'manual';
    const { reason, fitScore, bestTime, tripDuration, travelers } = body;

    // Validate required fields
    if (!destination || !estimatedCost) {
      return NextResponse.json(
        { error: 'Missing required fields: destination, estimatedCost (or budget)' },
        { status: 400 }
      );
    }

    // Check current saved trips count for free plan limit
    const { count } = await supabase
      .from('saved_trips')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count || 0) >= 3) {
      return NextResponse.json(
        { error: 'Free plan limit reached. Upgrade to Pro to save unlimited trips.' },
        { status: 429 }
      );
    }

    // Check if destination is already saved
    const { data: existingTrip } = await supabase
      .from('saved_trips')
      .select('id')
      .eq('user_id', user.id)
      .ilike('destination', destination)
      .single();

    if (existingTrip) {
      return NextResponse.json(
        { error: 'This destination is already in your saved trips' },
        { status: 409 }
      );
    }

    // Create new saved trip in database
    const { data: newTrip, error } = await supabase
      .from('saved_trips')
      .insert({
        user_id: user.id,
        destination,
        estimated_cost: Number(estimatedCost),
        reason,
        fit_score: fitScore ? Number(fitScore) : null,
        best_time: bestTime,
        source,
        trip_duration: tripDuration ? Number(tripDuration) : null,
        travelers: travelers ? Number(travelers) : null
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error saving trip:', error);
      return NextResponse.json(
        { error: 'Failed to save trip to database' },
        { status: 500 }
      );
    }

    // Transform to match frontend format
    const transformedTrip = {
      id: newTrip.id,
      destination: newTrip.destination,
      estimatedCost: newTrip.estimated_cost,
      reason: newTrip.reason,
      fitScore: newTrip.fit_score,
      bestTime: newTrip.best_time,
      source: newTrip.source,
      savedAt: newTrip.created_at,
      tripDuration: newTrip.trip_duration,
      travelers: newTrip.travelers
    };

    return NextResponse.json({ 
      success: true, 
      trip: transformedTrip,
      message: 'Trip saved successfully!'
    });

  } catch (error) {
    console.error('Error saving trip:', error);
    return NextResponse.json(
      { error: 'Failed to save trip' },
      { status: 500 }
    );
  }
}
