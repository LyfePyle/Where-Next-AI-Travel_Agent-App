import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

async function getOrCreateCart(supabase: ReturnType<typeof createServerClient>, userId: string) {
  // Try to find an open cart
  const { data: existing, error: selErr } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .eq("checked_out", false)
    .limit(1)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing) return existing.id;

  const { data: created, error: insErr } = await supabase
    .from("carts")
    .insert({ user_id: userId, checked_out: false })
    .select("id")
    .single();

  if (insErr) throw insErr;
  return created.id;
}

function normalize(items: any[]) {
  const subtotal = items.reduce((sum, it) => sum + (it.unit_amount ?? 0) * (it.quantity ?? 0), 0);
  const fees = Math.round(subtotal * 0.03);
  const tax = Math.round(subtotal * 0.07);
  const grand = subtotal + fees + tax;
  return {
    items: items.map((it) => ({
      id: it.id,
      sku: it.sku,
      name: it.name,
      quantity: it.quantity,
      unit_amount: it.unit_amount,
      currency: it.currency ?? "usd",
      total: (it.unit_amount ?? 0) * (it.quantity ?? 0),
    })),
    totals: { subtotal, fees, tax, grand, currency: "usd" },
  };
}

export async function GET() {
  const cookieStore = cookies();
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

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cartId = await getOrCreateCart(supabase, auth.user.id);

  const { data: items, error } = await supabase
    .from("cart_items")
    .select("id, sku, name, quantity, unit_amount, currency")
    .eq("cart_id", cartId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cart_id: cartId, ...normalize(items ?? []) });
}