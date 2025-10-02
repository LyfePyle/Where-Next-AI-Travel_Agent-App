import { headers } from "next/headers";
import Stripe from "stripe";
import { supabaseService } from "@/lib/supabase-server";
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
    const supabase = supabaseService();

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

      // Create order
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

      console.log(`Order ${order!.id} created successfully for user ${user_id}`);
    } catch (error) {
      console.error('Error processing checkout session:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return new Response(null, { status: 200 });
}