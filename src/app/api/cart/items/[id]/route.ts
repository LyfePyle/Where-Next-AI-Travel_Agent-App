import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
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

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await _.json();
  const parsed = z.object({ quantity: z.number().int().positive() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Ensure the item belongs to the user's open cart
  const { data: item } = await supabase
    .from("cart_items")
    .select("id, cart_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Update
  await supabase.from("cart_items").update({ quantity: parsed.data.quantity }).eq("id", params.id);

  const { data: items } = await supabase
    .from("cart_items")
    .select("id, sku, name, quantity, unit_amount, currency")
    .eq("cart_id", item.cart_id);
  const subtotal = (items ?? []).reduce((s, it) => s + it.unit_amount * it.quantity, 0);
  const fees = Math.round(subtotal * 0.03);
  const tax = Math.round(subtotal * 0.07);
  const grand = subtotal + fees + tax;

  return NextResponse.json({
    cart_id: item.cart_id,
    items,
    totals: { subtotal, fees, tax, grand, currency: "usd" },
  });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
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

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: item } = await supabase
    .from("cart_items")
    .select("id, cart_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.from("cart_items").delete().eq("id", params.id);

  const { data: items } = await supabase
    .from("cart_items")
    .select("id, sku, name, quantity, unit_amount, currency")
    .eq("cart_id", item.cart_id);
  const subtotal = (items ?? []).reduce((s, it) => s + it.unit_amount * it.quantity, 0);
  const fees = Math.round(subtotal * 0.03);
  const tax = Math.round(subtotal * 0.07);
  const grand = subtotal + fees + tax;

  return NextResponse.json({
    cart_id: item.cart_id,
    items,
    totals: { subtotal, fees, tax, grand, currency: "usd" },
  });
}