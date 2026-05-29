import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/bookings
 *
 * Returns the current user's bookings (from `bookings` table) and saved trips
 * (from `trips` table where status = 'saved' and no booking exists).
 * Auth via Supabase JWT Bearer token.
 *
 * Response: { upcoming, past, pending, saved, stats }
 */
export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: userData } = await supabase.auth.getUser(authHeader.slice(7));
    const userId = userData?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        total_amount_cents,
        currency,
        stripe_checkout_session_id,
        created_at,
        trip_id,
        trips (
          id,
          title,
          destination,
          start_date,
          end_date,
          stops,
          adults,
          kids,
          vibe
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('[api/bookings] bookings error:', bookingsError);
    }

    const allBookings = (bookings ?? []).map((b: any) => ({
      id: b.id,
      status: b.status,
      totalAmountCents: b.total_amount_cents,
      currency: b.currency ?? 'USD',
      stripeSessionId: b.stripe_checkout_session_id,
      createdAt: b.created_at,
      tripId: b.trip_id,
      destination: b.trips?.destination ?? b.trips?.title ?? 'Unknown destination',
      startDate: b.trips?.start_date ?? null,
      endDate: b.trips?.end_date ?? null,
      stops: b.trips?.stops ?? null,
      adults: b.trips?.adults ?? 1,
      kids: b.trips?.kids ?? 0,
      vibe: b.trips?.vibe ?? null,
    }));

    const confirmed = allBookings.filter((b) => b.status === 'confirmed');
    const upcoming = confirmed.filter((b) => !b.startDate || b.startDate >= now.slice(0, 10));
    const past = confirmed.filter((b) => b.startDate && b.startDate < now.slice(0, 10));
    const pending = allBookings.filter((b) => b.status === 'pending');

    const bookedTripIds = new Set(allBookings.map((b) => b.tripId).filter(Boolean));

    const { data: savedTrips, error: savedError } = await supabase
      .from('trips')
      .select('id, title, destination, start_date, end_date, stops, adults, kids, budget_amount, vibe, created_at')
      .eq('user_id', userId)
      .eq('status', 'saved')
      .order('created_at', { ascending: false });

    if (savedError) {
      console.error('[api/bookings] saved trips error:', savedError);
    }

    const saved = (savedTrips ?? [])
      .filter((t: any) => !bookedTripIds.has(t.id))
      .map((t: any) => ({
        id: t.id,
        destination: t.destination ?? t.title ?? 'Unknown destination',
        startDate: t.start_date ?? null,
        endDate: t.end_date ?? null,
        stops: t.stops ?? null,
        adults: t.adults ?? 1,
        kids: t.kids ?? 0,
        budgetAmount: t.budget_amount ?? null,
        vibe: t.vibe ?? null,
        createdAt: t.created_at,
      }));

    const totalSpentCents = confirmed.reduce((sum, b) => sum + (b.totalAmountCents ?? 0), 0);
    const destinations = past.map((b) => b.destination.split(',').pop()?.trim() ?? '');
    const countriesVisited = new Set(destinations.filter(Boolean)).size;

    const stats = {
      totalTrips: confirmed.length,
      totalSpentCents,
      upcomingCount: upcoming.length,
      countriesVisited,
      savedCount: saved.length,
      pendingCount: pending.length,
    };

    return NextResponse.json({ upcoming, past, pending, saved, stats });
  } catch (err) {
    console.error('[api/bookings] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
