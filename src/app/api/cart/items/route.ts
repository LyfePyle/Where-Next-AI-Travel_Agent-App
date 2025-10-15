import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";

const Item = z.object({
  sku: z.string(),
  name: z.string(),
  unit_amount: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  currency: z.string().default("usd"),
});

async function getOpenCartId(supabase: ReturnType<typeof createServerClient>, userId: string) {
  const { data, error } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .eq("checked_out", false)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const ins = await supabase.from("carts").insert({ user_id: userId, checked_out: false }).select("id").single();
    if (ins.error) throw ins.error;
    return ins.data.id;
  }
  return data.id;
}

async function readCart(supabase: ReturnType<typeof createServerClient>, cartId: string) {
  const { data: items } = await supabase
    .from("cart_items")
    .select("id, sku, name, quantity, unit_amount, currency")
    .eq("cart_id", cartId);
  const subtotal = (items ?? []).reduce((s, it) => s + it.unit_amount * it.quantity, 0);
  const fees = Math.round(subtotal * 0.03);
  const tax = Math.round(subtotal * 0.07);
  const grand = subtotal + fees + tax;
  return { items, totals: { subtotal, fees, tax, grand, currency: "usd" } };
}

export async function POST(req: Request) {
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

  const body = await req.json().catch(() => null);
  const parsed = Item.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cartId = await getOpenCartId(supabase, auth.user.id);

  // Merge by (cart_id, sku): if exists, bump quantity; else insert
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("sku", parsed.data.sku)
    .maybeSingle();

  if (existing) {
    const newQty = existing.quantity + parsed.data.quantity;
    await supabase.from("cart_items").update({ quantity: newQty }).eq("id", existing.id);
  } else {
    await supabase.from("cart_items").insert({ cart_id: cartId, ...parsed.data });
  }

  const cart = await readCart(supabase, cartId);
  return NextResponse.json({ cart_id: cartId, ...cart });
}