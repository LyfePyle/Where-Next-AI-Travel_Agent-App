import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Find booking by session ID
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("stripe_checkout_session_id", session.id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found for session:", session.id);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Update booking status to 'paid'
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "paid",
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error("Error updating booking:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Optionally clear cart items for this user
    if (booking.trip_id) {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", booking.user_id)
        .eq("trip_id", booking.trip_id);
    }
  }

  return NextResponse.json({ received: true });
}
