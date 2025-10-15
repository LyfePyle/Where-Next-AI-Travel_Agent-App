import Stripe from "stripe";
import { NextRequest } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // ensure no caching of webhook

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
    event = stripe.webhooks.constructEvent(raw, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Idempotency: store event.id
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: existing } = await admin.from("webhook_events").select("id").eq("id", event.id).maybeSingle();
  if (existing) return new Response("ok (duplicate)", { status: 200 });
  await admin.from("webhook_events").insert({ id: event.id });

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const userId = (s.metadata?.user_id as string) || null;
    const cartId = (s.metadata?.cart_id as string) || null;
    if (userId && cartId) {
      // 1) Mark payment_session paid
      await admin.from("payment_sessions").update({ status: "paid" }).eq("stripe_session_id", s.id);

      // 2) Create order
      const { data: order, error: orderErr } = await admin
        .from("orders")
        .insert({ user_id: userId, cart_id: cartId, status: "paid", stripe_session_id: s.id })
        .select("id")
        .single();
      if (orderErr) throw orderErr;

      // 3) Move items from cart_items -> order_items
      const { data: items } = await admin
        .from("cart_items")
        .select("sku, name, quantity, unit_amount, currency")
        .eq("cart_id", cartId);

      if (items && items.length) {
        const rows = items.map((it) => ({
          order_id: order.id,
          sku: it.sku,
          name: it.name,
          quantity: it.quantity,
          unit_amount: it.unit_amount,
          currency: it.currency ?? "usd",
        }));
        await admin.from("order_items").insert(rows);
      }

      // 4) Record payment
      await admin.from("payments").insert({
        order_id: order.id,
        user_id: userId,
        amount: s.amount_total ?? 0,
        currency: s.currency ?? "usd",
        provider: "stripe",
        provider_ref: s.payment_intent as string,
        status: "succeeded",
      });

      // 5) Create booking(s) (adjust to your schema)
      await admin.from("trip_bookings").insert({
        order_id: order.id,
        user_id: userId,
        status: "confirmed",
        details: {}, // put structured itinerary if you have it
      });

      // 6) Mark cart checked out + clear cart items
      await admin.from("carts").update({ checked_out: true }).eq("id", cartId);
      await admin.from("cart_items").delete().eq("cart_id", cartId);
    }
  }

  return new Response("ok", { status: 200 });
}