import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.ENABLE_REAL_PAYMENTS !== "true") {
    return NextResponse.json({ error: "Payments disabled in demo mode" }, { status: 403 });
  }

  try {
    const supabase = createServerComponentClient({ cookies });
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
      success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
      metadata: { 
        user_id: user.id, 
        cart_id: cart.id 
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
