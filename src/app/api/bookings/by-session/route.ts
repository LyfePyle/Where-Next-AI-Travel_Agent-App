import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

/**
 * GET /api/bookings/by-session
 *
 * Query params (at least one required):
 *   ?booking_id=<uuid>
 *   ?session_id=<stripe_checkout_session_id>
 *
 * Strategy:
 *   1. Try booking_id first (fast, DB only)
 *   2. Fall back to session_id lookup in bookings table
 *   3. Fetch Stripe session to get receipt_url (only Stripe has this)
 *   4. If booking is still 'pending', mark it 'confirmed' and set confirmed_at
 *      (lightweight fallback when webhook hasn't fired yet)
 *
 * Auth: optional Bearer token. If present, enforces ownership. Works for guests too.
 */
export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
      const { data } = await supabaseAuth.auth.getUser(authHeader.slice(7));
      userId = data?.user?.id ?? null;
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('booking_id');
    const sessionId = searchParams.get('session_id');

    if (!bookingId && !sessionId) {
      return NextResponse.json(
        { error: 'booking_id or session_id required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('bookings')
      .select(`
        id,
        status,
        total_amount_cents,
        currency,
        stripe_checkout_session_id,
        created_at,
        user_id,
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
          vibe,
          budget_amount
        )
      `);

    if (bookingId) {
      query = query.eq('id', bookingId);
    } else {
      query = query.eq('stripe_checkout_session_id', sessionId!);
    }

    const { data: bookingRowInit, error: bookingError } = await query.maybeSingle();

    if (bookingError) {
      console.error('[by-session] DB error:', bookingError);
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    let bookingRow: any = bookingRowInit;

    // Fallback: sometimes stripe_checkout_session_id might not be set yet.
    // If we have a Stripe Checkout Session id, use it to fetch session metadata
    // and locate the booking by metadata.booking_id.
    if (!bookingRow && !bookingId && sessionId) {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (stripeKey) {
        try {
          const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });
          const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
          const metaBookingId = checkoutSession.metadata?.booking_id;

          if (metaBookingId) {
            const { data: metaBookingRow, error: metaBookingError } = await supabase
              .from('bookings')
              .select(`
                id,
                status,
                total_amount_cents,
                currency,
                stripe_checkout_session_id,
                created_at,
                user_id,
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
                  vibe,
                  budget_amount
                )
              `)
              .eq('id', metaBookingId)
              .maybeSingle();

            if (!metaBookingError && metaBookingRow) {
              bookingRow = metaBookingRow;
            }
          }
        } catch (fallbackErr) {
          console.warn('[by-session] fallback lookup via stripe metadata failed:', fallbackErr);
        }
      }
    }

    if (!bookingRow) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingRow as any;

    if (userId && booking.user_id && booking.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (booking.status === 'pending') {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', booking.id);

      if (updateError) {
        console.error('[by-session] failed to confirm booking:', updateError);
      } else {
        booking.status = 'confirmed';
      }
    }

    let receiptUrl: string | null = null;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const stripeSessionId = booking.stripe_checkout_session_id ?? sessionId;

    if (stripeKey && stripeSessionId) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });
        const session = await stripe.checkout.sessions.retrieve(stripeSessionId, {
          expand: ['payment_intent'],
        });

        const pi = session.payment_intent as Stripe.PaymentIntent | null;
        if (pi && typeof pi !== 'string') {
          const charges = await stripe.charges.list({
            payment_intent: pi.id,
            limit: 1,
          });
          receiptUrl = charges.data[0]?.receipt_url ?? null;
        }
      } catch (stripeErr) {
        console.warn('[by-session] Stripe receipt fetch failed:', stripeErr);
      }
    }

    const trip = booking.trips;

    return NextResponse.json({
      booking: {
        id: booking.id,
        status: booking.status,
        totalAmountCents: booking.total_amount_cents,
        currency: booking.currency ?? 'USD',
        stripeSessionId: booking.stripe_checkout_session_id,
        createdAt: booking.created_at,
        receiptUrl,
      },
      trip: trip
        ? {
            id: trip.id,
            destination: trip.destination ?? trip.title ?? null,
            startDate: trip.start_date ?? null,
            endDate: trip.end_date ?? null,
            stops: trip.stops ?? null,
            adults: trip.adults ?? 1,
            kids: trip.kids ?? 0,
            vibe: trip.vibe ?? null,
            budgetAmount: trip.budget_amount ?? null,
          }
        : null,
    });
  } catch (err) {
    console.error('[by-session] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
