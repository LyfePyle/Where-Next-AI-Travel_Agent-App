import { NextResponse } from "next/server";
import { getOrCreateCart, getCartWithItems } from "@/lib/cart";

export async function GET() {
  // For now, always return demo data to avoid auth issues
  return NextResponse.json({ 
    cart: { id: "demo-cart", status: "open" },
    items: [
      {
        id: "demo-item-1",
        item_type: "flight",
        name: "Flight to Bangkok",
        price_cents: 85000,
        currency: "USD",
        quantity: 1,
        meta: { airline: "Air Canada", flight_number: "AC123" }
      },
      {
        id: "demo-item-2", 
        item_type: "hotel",
        name: "Bangkok Palace Hotel",
        price_cents: 18000,
        currency: "USD",
        quantity: 3,
        meta: { nights: 3, rating: 4.5 }
      }
    ]
  });
}

export async function POST() {
  try {
    const cart = await getOrCreateCart();
    return NextResponse.json({ cart });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create cart" }, { status: 500 });
  }
}
