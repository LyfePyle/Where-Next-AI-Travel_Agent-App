import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
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

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const payload = {
    user_id: user.id,
    trip_id: body.trip_id ?? null,
    item_type: body.item_type || 'trip',
    title: body.title || body.name || 'Untitled Item',
    quantity: body.quantity ?? 1,
    currency: body.currency ?? "USD",
    unit_amount_cents: body.unit_amount_cents ?? (body.unit_amount ? Math.round(body.unit_amount * 100) : 0),
    provider: body.provider ?? null,
    provider_ref: body.provider_ref ?? null,
    item_payload: body.item_payload ?? body,
  };

  const { data, error } = await supabase
    .from("cart_items")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
