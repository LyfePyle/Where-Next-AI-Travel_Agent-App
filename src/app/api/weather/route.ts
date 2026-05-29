// src/app/api/weather/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getWeatherForCity } from '@/lib/weather';

export const runtime = 'nodejs';

/**
 * GET /api/weather?city=Barcelona
 * POST /api/weather  { "city": "Barcelona" }
 *
 * Returns current weather for a city.
 * Cached in-memory for 30 minutes to avoid burning free-tier quota.
 */

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get('city')?.trim();

  if (!city) {
    return NextResponse.json({ error: 'Missing required param: city' }, { status: 400 });
  }

  try {
    const weather = await getWeatherForCity(city);
    return NextResponse.json({ city, weather }, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Weather lookup failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const city = body.city?.trim();

    if (!city) {
      return NextResponse.json({ error: 'Missing required field: city' }, { status: 400 });
    }

    const weather = await getWeatherForCity(city);
    return NextResponse.json({ city, weather });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Weather lookup failed' }, { status: 500 });
  }
}
