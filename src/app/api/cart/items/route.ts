import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return NextResponse.json({ error: "Demo mode: add-to-cart disabled" }, { status: 403 });
  }
  
  try {
    const body = await req.json();
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ensure cart
    let { data: cart } = await supabase
      .from("carts").select("*").eq("user_id", user.id).eq("status","open").single();

    if (!cart) {
      const { data: newCart, error } = await supabase
        .from("carts")
        .insert({ user_id: user.id })
        .select("*").single();
      if (error) throw error;
      cart = newCart;
    }

    const { data, error } = await supabase.from("cart_items").insert({
      cart_id: cart.id,
      item_type: body.item_type,
      external_id: body.external_id,
      name: body.name,
      price_cents: body.price_cents,
      currency: body.currency,
      quantity: body.quantity ?? 1,
      meta: body.meta ?? {}
    }).select("*").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ item: data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add item to cart" }, { status: 500 });
  }
}
