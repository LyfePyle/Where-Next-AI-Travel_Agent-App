import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

async function getOrCreateCart(supabase: ReturnType<typeof createServerClient>, userId: string) {
  // Try to find an open cart - check both 'checked_out' and 'status' fields for compatibility
  let { data: existing, error: selErr } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .eq("checked_out", false)
    .limit(1)
    .maybeSingle();

  // If that fails, try with 'status' field instead
  if (selErr || !existing) {
    const { data: existingByStatus, error: statusErr } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "open")
      .limit(1)
      .maybeSingle();
    
    if (!statusErr && existingByStatus) {
      return existingByStatus.id;
    }
  }

  if (selErr && selErr.code !== 'PGRST116') throw selErr; // PGRST116 = no rows returned
  if (existing) return existing.id;

  // Try to create with checked_out field first
  let { data: created, error: insErr } = await supabase
    .from("carts")
    .insert({ user_id: userId, checked_out: false })
    .select("id")
    .single();

  // If that fails, try with status field
  if (insErr) {
    const { data: createdByStatus, error: statusInsErr } = await supabase
      .from("carts")
      .insert({ user_id: userId, status: "open" })
      .select("id")
      .single();
    
    if (statusInsErr) throw statusInsErr;
    return createdByStatus.id;
  }

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
  try {
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

    const { data: auth, error: authError } = await supabase.auth.getUser();
    
    if (authError || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch cart items directly (no cart_id needed with new schema)
    const { data: items, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('Cart fetch error:', { user_id: auth.user.id, error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate totals
    const subtotal = (items || []).reduce((sum, item) => {
      return sum + (item.unit_amount_cents || 0) * (item.quantity || 1);
    }, 0);
    const fees = Math.round(subtotal * 0.03);
    const tax = Math.round(subtotal * 0.07);
    const grand = subtotal + fees + tax;

    return NextResponse.json({ 
      items: items || [],
      totals: { 
        subtotal, 
        fees, 
        tax, 
        grand, 
        currency: "USD" 
      }
    });
  } catch (error: any) {
    console.error('Cart GET error:', { error: error.message });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}