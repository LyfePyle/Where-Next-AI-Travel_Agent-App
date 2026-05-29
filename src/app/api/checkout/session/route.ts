import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: (n, v, o) => cookieStore.set({ name: n, value: v, ...o }),
        remove: (n, o) => cookieStore.set({ name: n, value: "", ...o }),
      },
    }
  );

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { tripId, amount_cents, currency = "USD" } = body;

  if (!amount_cents || amount_cents <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // bookings.trip_id is UUID; only set if tripId looks like a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const tripIdUuid = tripId && uuidRegex.test(String(tripId).trim()) ? tripId : null;

  // Create booking record with status 'pending'
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      trip_id: tripIdUuid,
      status: "pending",
      currency,
      total_amount_cents: amount_cents,
    })
    .select("*")
    .single();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  // Create Stripe checkout session
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: tripId ? `Trip Booking` : "Travel Booking",
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/booking/confirmation?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/booking?tripId=${tripId || ""}`,
      metadata: {
        booking_id: booking.id,
        user_id: user.id,
        trip_id: tripId || "",
      },
    });

    // Update booking with Stripe session ID
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", booking.id);

    if (updateError) {
      console.error(
        "[checkout/session] Failed to set stripe_checkout_session_id on booking:",
        updateError
      );
    }

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
      booking_id: booking.id,
    });
  } catch (error: any) {
    console.error("Stripe error:", error);
    return NextResponse.json({ error: error.message || "Payment setup failed" }, { status: 500 });
  }
}
