import { NextResponse } from 'next/server';
import { z } from 'zod';

const Schema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  departDate: z.string(),
  returnDate: z.string().optional(),
  adults: z.number().int().min(1).max(12),
  currency: z.string().optional().default('USD'),
});

const DUFFEL_API = 'https://api.duffel.com';
const DUFFEL_KEY = process.env.DUFFEL_API_KEY!;

async function duffel(path: string, body: object) {
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

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { origin, destination, departDate, returnDate, adults, currency } = parsed.data;

  if (!DUFFEL_KEY) {
    return NextResponse.json({ error: 'DUFFEL_API_KEY not configured' }, { status: 500 });
  }

  try {
    // Build slices — outbound always, return if provided
    const slices: object[] = [
      {
        origin,
        destination,
        departure_date: departDate,
      },
    ];

    if (returnDate) {
      slices.push({
        origin: destination,
        destination: origin,
        departure_date: returnDate,
      });
    }

    // Create offer request
    const offerRequest = await duffel('/air/offer_requests', {
      slices,
      passengers: Array.from({ length: adults }, () => ({ type: 'adult' })),
      cabin_class: 'economy',
      return_offers: true,
    });

    const offerId = offerRequest.data?.id;
    if (!offerId) throw new Error('No offer request ID returned');

    // Fetch offers
    const offersRes = await fetch(
      `${DUFFEL_API}/air/offers?offer_request_id=${offerId}&sort=total_amount&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${DUFFEL_KEY}`,
          'Duffel-Version': 'v2',
          'Accept': 'application/json',
        },
      }
    );

    if (!offersRes.ok) {
      const err = await offersRes.json().catch(() => ({}));
      throw new Error(err?.errors?.[0]?.message ?? 'Failed to fetch offers');
    }

    const offersData = await offersRes.json();
    const offers = offersData.data ?? [];

    // Normalize to a clean shape for the frontend
    const normalized = offers.slice(0, 8).map((offer: any) => {
      const slice = offer.slices?.[0];
      const seg = slice?.segments?.[0];
      const stops = (slice?.segments?.length ?? 1) - 1;

      return {
        id: offer.id,
        airline: seg?.marketing_carrier?.name ?? 'Unknown Airline',
        airlineCode: seg?.marketing_carrier?.iata_code ?? '',
        flightNumber: `${seg?.marketing_carrier?.iata_code ?? ''}${seg?.marketing_carrier_flight_number ?? ''}`,
        origin: seg?.origin?.iata_code ?? origin,
        destination: seg?.destination?.iata_code ?? destination,
        departureTime: seg?.departing_at ?? '',
        arrivalTime: slice?.segments?.[slice.segments.length - 1]?.arriving_at ?? '',
        duration: slice?.duration ?? '',
        stops,
        stopLabel: stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`,
        price: parseFloat(offer.total_amount ?? '0'),
        currency: offer.total_currency ?? currency,
        pricePerPerson: parseFloat(offer.base_amount ?? offer.total_amount ?? '0') / adults,
        cabinClass: offer.slices?.[0]?.fare_brand_name ?? 'Economy',
        bagsIncluded: offer.passengers?.[0]?.baggages?.some((b: any) => b.quantity > 0) ?? false,
        expiresAt: offer.expires_at,
        // Keep raw offer id for booking
        rawOfferId: offer.id,
      };
    });

    return NextResponse.json({
      provider: 'duffel',
      offerRequestId: offerId,
      offers: normalized,
      totalOffers: offersData.meta?.limit ?? normalized.length,
    });

  } catch (err: any) {
    console.error('[Duffel flights]', err);
    return NextResponse.json(
      { error: err.message ?? 'Flight search failed' },
      { status: 502 }
    );
  }
}
