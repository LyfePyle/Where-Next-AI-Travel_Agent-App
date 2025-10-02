import { NextResponse } from "next/server";
import { getOrCreateCart, getCartWithItems } from "@/lib/cart";

export async function GET() {
  try {
    const { cart, items } = await getCartWithItems();
    return NextResponse.json({ cart, items });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const cart = await getOrCreateCart();
    return NextResponse.json({ cart });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create cart" }, { status: 500 });
  }
}
