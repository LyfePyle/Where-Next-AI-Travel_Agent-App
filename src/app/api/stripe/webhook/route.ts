import { headers } from "next/headers";
import Stripe from "stripe";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { confirmBookingsForOrder } from "@/lib/booking-worker";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const sig = headers().get("stripe-signature")!;
  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body, sig, process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = createServiceSupabaseClient();

    try {
      const { user_id, cart_id } = session.metadata!;
      
      // Fetch cart and items
      const { data: cart } = await supabase
        .from("carts")
        .select("*")
        .eq("id", cart_id)
        .single();

      const { data: items } = await supabase
        .from("cart_items")
        .select("*")
        .eq("cart_id", cart_id);

      if (!cart || !items) {
        throw new Error("Cart or items not found");
      }

      // Calculate total
      const total_cents = items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
      const currency = items[0]?.currency || 'USD';

      // Create trip booking (final source of truth)
      const { data: tripBooking } = await supabase
        .from("trip_bookings")
        .insert({
          user_id,
          trip_id: null, // Will be set if linked to a saved trip
          booking_type: 'bundle', // or determine from items
          status: 'paid',
          total_amount_cents: total_cents,
          currency: currency.toLowerCase(),
          payment_intent_id: session.payment_intent as string,
          confirmation_code: `WN${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          metadata: {
            cart_id,
            items: items.map(item => ({
              type: item.item_type,
              name: item.name,
              price_cents: item.price_cents,
              quantity: item.quantity
            }))
          }
        })
        .select("*")
        .single();

      // Update payment session status
      await supabase
        .from("payment_sessions")
        .update({ status: 'paid' })
        .eq("stripe_checkout_session_id", session.id);

      // Create booking confirmation
      await supabase
        .from("booking_confirmations")
        .insert({
          booking_id: tripBooking!.id,
          user_id,
          confirmation_payload: {
            session_id: session.id,
            payment_intent: session.payment_intent,
            total_cents,
            currency,
            items: items.map(item => ({
              type: item.item_type,
              name: item.name,
              price_cents: item.price_cents,
              quantity: item.quantity
            }))
          }
        });

      // Also create order for backward compatibility
      const { data: order } = await supabase
        .from("orders")
        .insert({
          user_id,
          total_cents,
          currency,
          status: 'paid'
        })
        .select("*")
        .single();

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order!.id,
        item_type: item.item_type,
        external_id: item.external_id,
        name: item.name,
        price_cents: item.price_cents,
        currency: item.currency,
        quantity: item.quantity,
        meta: item.meta
      }));

      await supabase.from("order_items").insert(orderItems);

      // Create payment record
      await supabase.from("payments").insert({
        order_id: order!.id,
        stripe_payment_intent: session.payment_intent as string,
        status: 'succeeded'
      });

      // Mark cart as converted
      await supabase
        .from("carts")
        .update({ status: 'converted' })
        .eq("id", cart_id);

      // Trigger booking confirmations
      await confirmBookingsForOrder(order!.id);

      console.log(`Trip booking ${tripBooking!.id} and order ${order!.id} created successfully for user ${user_id}`);
    } catch (error) {
      console.error('Error processing checkout session:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return new Response(null, { status: 200 });
}