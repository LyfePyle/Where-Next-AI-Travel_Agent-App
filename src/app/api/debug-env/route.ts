import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    openai: !!process.env.OPENAI_API_KEY,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    amadeus: !!process.env.AMADEUS_API_KEY,
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    mock: process.env.NEXT_PUBLIC_MOCK === "1",
    // Show first few characters of keys (for debugging, but be careful with this in production)
    openaiPreview: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : null,
    amadeusPreview: process.env.AMADEUS_API_KEY ? `${process.env.AMADEUS_API_KEY.substring(0, 10)}...` : null,
    supabasePreview: process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...` : null,
  });
}
