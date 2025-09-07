import { NextResponse } from "next/server";
import { z } from "zod";
import { amadeusGet } from "@/lib/amadeus";

const Query = z.object({
  origin: z.string().min(3),
  destination: z.string().min(3),
  departureDate: z.string().min(10), // YYYY-MM-DD
  returnDate: z.string().optional(), // YYYY-MM-DD
  adults: z.coerce.number().min(1).default(1),
  max: z.coerce.number().min(1).max(50).default(10),
  nonStop: z.coerce.boolean().optional(),
  currencyCode: z.string().default("USD"),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parse = Query.safeParse({
    origin: searchParams.get("origin"),
    destination: searchParams.get("destination"),
    departureDate: searchParams.get("departureDate"),
    returnDate: searchParams.get("returnDate") || undefined,
    adults: searchParams.get("adults") || "1",
    max: searchParams.get("max") || "10",
    nonStop: searchParams.get("nonStop") === "true" ? true : undefined,
    currencyCode: searchParams.get("currencyCode") || "USD",
  });
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  const q = parse.data;

  try {
    // Amadeus Flight Offers Search v2
    // https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search/api-reference
    const res = await amadeusGet<any>("/v2/shopping/flight-offers", {
      originLocationCode: q.origin,
      destinationLocationCode: q.destination,
      departureDate: q.departureDate,
      ...(q.returnDate ? { returnDate: q.returnDate } : {}),
      adults: q.adults,
      nonStop: q.nonStop ? "true" : undefined,
      currencyCode: q.currencyCode,
      max: q.max,
    });

    const results = (res?.data || []).map((offer: any) => ({
      id: offer.id,
      price: Number(offer.price?.grandTotal || offer.price?.total),
      currency: offer.price?.currency || q.currencyCode,
      oneWay: !q.returnDate,
      legs: offer.itineraries?.map((it: any) => ({
        duration: it.duration, // "PT10H20M"
        segments: it.segments?.map((s: any) => ({
          carrier: s.operating?.carrierCode || s.carrierCode,
          flightNumber: `${s.carrierCode}${s.number}`,
          from: s.departure?.iataCode,
          to: s.arrival?.iataCode,
          dep: s.departure?.at,
          arr: s.arrival?.at,
          duration: s.duration,
          stops: s.numberOfStops || 0,
        })),
      })),
    }));

    return NextResponse.json({ query: q, results });
  } catch (error) {
    console.error('Flight price search error:', error);
    return NextResponse.json(
      { error: 'Failed to search flight prices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
