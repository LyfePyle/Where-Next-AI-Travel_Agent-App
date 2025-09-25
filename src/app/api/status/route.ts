import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    mock: process.env.NEXT_PUBLIC_MOCK === "1",
    haveOpenAI: !!process.env.OPENAI_API_KEY,
    haveAmadeus: !!process.env.AMADEUS_CLIENT_ID && !!process.env.AMADEUS_CLIENT_SECRET,
    haveSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    haveStripe: !!process.env.STRIPE_SECRET_KEY,
    time: new Date().toISOString(),
  });
}





