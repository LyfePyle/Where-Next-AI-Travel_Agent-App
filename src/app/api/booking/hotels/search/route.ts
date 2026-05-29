import { NextResponse } from 'next/server';
import { z } from 'zod';

const Schema = z.object({
  destination: z.string().min(2),
  checkIn: z.string(),
  checkOut: z.string(),
  adults: z.number().int().min(1).max(12),
  rooms: z.number().int().min(1).max(6).optional().default(1),
  currency: z.string().optional().default('USD'),
});

const DUFFEL_API = 'https://api.duffel.com';
const DUFFEL_KEY = process.env.DUFFEL_API_KEY!;

async function duffelPost(path: string, body: object) {
  const res = await fetch(`${DUFFEL_API}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DUFFEL_KEY}`,
      'Content-Type': 'application/json',
      'Duffel-Version': 'v2',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ data: body }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.errors?.[0]?.message ?? `Duffel error ${res.status}`);
  }

  return res.json();
}

async function duffelGet(path: string) {
  const res = await fetch(`${DUFFEL_API}${path}`, {
    headers: {
      'Authorization': `Bearer ${DUFFEL_KEY}`,
      'Duffel-Version': 'v2',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.errors?.[0]?.message ?? `Duffel error ${res.status}`);
  }

  return res.json();
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { destination, checkIn, checkOut, adults, rooms } = parsed.data;

  if (!DUFFEL_KEY) {
    return NextResponse.json({ error: 'DUFFEL_API_KEY not configured' }, { status: 500 });
  }

  try {
    // Step 1: Search for the location to get a Duffel place ID
    const locationRes = await duffelGet(
      `/places/suggestions?query=${encodeURIComponent(destination)}`
    );

    const places = locationRes.data ?? [];
    const place = places.find((p: any) =>
      p.type === 'city' || p.type === 'airport' || p.iata_city_code
    ) ?? places[0];

    if (!place) {
      return NextResponse.json(
        { error: `Could not find location: ${destination}` },
        { status: 404 }
      );
    }

    // Step 2: Create a stay search (Duffel Stays)
    const searchRes = await duffelPost('/stays/search', {
      check_in_date: checkIn,
      check_out_date: checkOut,
      rooms,
      guests: [
        ...Array.from({ length: adults }, () => ({ type: 'adult' })),
      ],
      location: {
        radius: 10,
        geographic_coordinates: {
          latitude: place.latitude,
          longitude: place.longitude,
        },
      },
    });

    const results = searchRes.data?.results ?? [];

    // Normalize to clean frontend shape
    const normalized = results.slice(0, 12).map((result: any) => {
      const property = result.accommodation;
      const cheapestRate = result.cheapest_rate_plan;
      const nightlyRate = cheapestRate?.rate_plans?.[0]?.total_amount
        ? parseFloat(cheapestRate.rate_plans[0].total_amount)
        : null;

      // Calculate nights
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const nights = Math.round(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: result.id,
        name: property?.name ?? 'Hotel',
        description: property?.description ?? '',
        rating: property?.rating ?? null,
        starRating: property?.star_rating ?? null,
        address: [
          property?.address?.line_one,
          property?.address?.city_name,
          property?.address?.country_code,
        ].filter(Boolean).join(', '),
        latitude: property?.geographic_coordinates?.latitude,
        longitude: property?.geographic_coordinates?.longitude,
        photos: (property?.photos ?? []).slice(0, 3).map((p: any) => p.url),
        amenities: (property?.amenities ?? []).slice(0, 6).map((a: any) => a.description ?? a.type),
        pricePerNight: nightlyRate ? Math.round(nightlyRate / (nights || 1)) : null,
        totalPrice: nightlyRate,
        currency: cheapestRate?.rate_plans?.[0]?.total_currency ?? 'USD',
        nights,
        rooms,
        refundable: cheapestRate?.rate_plans?.[0]?.cancellation_timeline?.length > 0,
        // Keep raw search result id for booking
        rawResultId: result.id,
        accommodationId: property?.id,
      };
    });

    return NextResponse.json({
      provider: 'duffel',
      destination,
      checkIn,
      checkOut,
      nights: normalized[0]?.nights ?? 0,
      results: normalized,
      total: results.length,
    });

  } catch (err: any) {
    console.error('[Duffel hotels]', err);
    return NextResponse.json(
      { error: err.message ?? 'Hotel search failed' },
      { status: 502 }
    );
  }
}
