import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { geocodeCity } from '@/lib/geocode-city';
import { buildRouteMapPins } from '@/lib/route-map-pins';
import { normalizeTripStopsFromRow } from '@/lib/trip-stops';

async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: (n, v, o) => cookieStore.set({ name: n, value: v, ...o }),
        remove: (n, o) => cookieStore.set({ name: n, value: '', ...o }),
      },
    }
  );
}

/** GET — geocoded stop pins for whole-trip route map */
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: trip, error } = await supabase.from('trips').select('*').eq('id', id).single();
  if (error || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }
  if (trip.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const stops = normalizeTripStopsFromRow(trip);
  if (stops.length === 0) {
    return NextResponse.json({ pins: [] });
  }

  const { pins, unresolved } = await buildRouteMapPins(stops, async (city, country) => {
    const coords = await geocodeCity(city, country);
    if (!coords) return null;
    return {
      lat: coords.lat,
      lon: coords.lon,
      country: coords.country,
      source: coords.source,
    };
  });

  return NextResponse.json({ pins, unresolved });
}
