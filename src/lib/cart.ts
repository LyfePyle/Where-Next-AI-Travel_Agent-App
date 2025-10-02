import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export async function getOrCreateCart() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  let { data: cart } = await supabase
    .from("carts").select("*")
    .eq("user_id", user.id).eq("status", "open").single();

  if (!cart) {
    const { data: newCart, error } = await supabase
      .from("carts")
      .insert({ user_id: user.id })
      .select("*").single();
    if (error) throw error;
    cart = newCart;
  }
  return cart;
}

export async function getCartWithItems() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: cart } = await supabase
    .from("carts").select("*")
    .eq("user_id", user.id).eq("status", "open").single();

  if (!cart) return { cart: null, items: [] };

  const { data: items } = await supabase
    .from("cart_items").select("*").eq("cart_id", cart.id);

  return { cart, items: items ?? [] };
}

export function calcCartTotals(items: any[]) {
  const currency = items[0]?.currency ?? "USD";
  const total_cents = items.reduce((sum, it) => sum + it.price_cents * it.quantity, 0);
  return { currency, total_cents };
}
