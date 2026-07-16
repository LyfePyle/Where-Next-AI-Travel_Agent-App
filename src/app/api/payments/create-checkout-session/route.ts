import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Stripe from "stripe";
import { isPaymentsEnabled } from "@/lib/payments";

export async function POST() {
  if (!isPaymentsEnabled()) {
    return NextResponse.json(
      { error: "Payments are disabled. Booking is affiliate-only right now." },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set({ name, value, ...options })
          );
        },
      },
    }
  );

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // find open cart + items
  const { data: cart } = await supabase
    .from("carts").select("id").eq("user_id", auth.user.id).eq("checked_out", false).maybeSingle();
  if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

  const { data: items } = await supabase
    .from("cart_items")
    .select("sku, name, quantity, unit_amount, currency")
    .eq("cart_id", cart.id);

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

  const line_items = items.map((it) => ({
    quantity: it.quantity,
    price_data: {
      currency: it.currency ?? "usd",
      product_data: { name: it.name, metadata: { sku: it.sku } },
      unit_amount: it.unit_amount,
    },
  }));

  const success = `${process.env.NEXT_PUBLIC_URL}/booking/confirmation?sid={CHECKOUT_SESSION_ID}`;
  const cancel = `${process.env.NEXT_PUBLIC_URL}/cart`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: success,
    cancel_url: cancel,
    metadata: { user_id: auth.user.id, cart_id: cart.id },
  });

  // optional: record the payment_session row
  await supabase.from("payment_sessions").insert({
    user_id: auth.user.id,
    cart_id: cart.id,
    stripe_session_id: session.id,
    status: "created",
  });

  return NextResponse.json({ id: session.id, url: session.url });
}