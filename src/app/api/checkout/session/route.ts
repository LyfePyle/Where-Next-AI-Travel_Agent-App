import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.ENABLE_REAL_PAYMENTS !== "true") {
    return NextResponse.json({ error: "Payments disabled in demo mode" }, { status: 403 });
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => cookieStore.set({ name, value, ...options }),
          remove: (name, options) => cookieStore.set({ name, value: "", ...options }),
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: cart } = await supabase
      .from("carts").select("id").eq("user_id", user.id).eq("status","open").single();

    if (!cart) {
      return NextResponse.json({ error: "No open cart found" }, { status: 404 });
    }

    const { data: items } = await supabase
      .from("cart_items").select("*").eq("cart_id", cart.id);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Empty cart" }, { status: 400 });
    }

    const line_items = items.map(i => ({
      quantity: i.quantity,
      price_data: {
        currency: i.currency.toLowerCase(),
        unit_amount: i.price_cents,
        product_data: { 
          name: i.name,
          description: `${i.item_type} booking`
        }
      }
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${process.env.NEXT_PUBLIC_URL}/booking/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
      metadata: { 
        user_id: user.id, 
        cart_id: cart.id 
      }
    });

    // Store payment session in database
    await supabase
      .from("payment_sessions")
      .insert({
        user_id: user.id,
        stripe_checkout_session_id: session.id,
        status: 'created',
        cart_snapshot: {
          cart_id: cart.id,
          items: items.map(item => ({
            type: item.item_type,
            name: item.name,
            price_cents: item.price_cents,
            quantity: item.quantity,
            currency: item.currency
          }))
        }
      });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
