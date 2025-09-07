// src/app/api/hotels/search/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { amadeusGet } from "@/lib/amadeus";
import { buildHotelUrl } from "@/app/api/partners/affiliate";

const Query = z.object({
  cityCode: z.string().optional(),                 // e.g., LIS
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radius: z.coerce.number().min(1).max(50).default(10),
  checkInDate: z.string().min(10),
  checkOutDate: z.string().min(10),
  adults: z.coerce.number().min(1).default(2),
  currencyCode: z.string().default("USD"),
  max: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  const MOCK = process.env.NEXT_PUBLIC_MOCK === "1";
  const { searchParams } = new URL(req.url);
  const parse = Query.safeParse({
    cityCode: searchParams.get("cityCode") || undefined,
    latitude: searchParams.get("latitude") || undefined,
    longitude: searchParams.get("longitude") || undefined,
    radius: searchParams.get("radius") || "10",
    checkInDate: searchParams.get("checkInDate"),
    checkOutDate: searchParams.get("checkOutDate"),
    adults: searchParams.get("adults") || "2",
    currencyCode: searchParams.get("currencyCode") || "USD",
    max: searchParams.get("max") || "20",
  });
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  const q = parse.data;

  if (MOCK) {
    return NextResponse.json({
      query: q,
      results: [
        { hotelId:"MOCKH1", name:"Memmo Alfama", rating:4, address:"Lisbon", neighborhood:"Alfama",
          lat:38.711, lng:-9.129, price:118, currency:q.currencyCode, checkIn:q.checkInDate, checkOut:q.checkOutDate },
        { hotelId:"MOCKH2", name:"Bairro Alto Hotel", rating:5, address:"Lisbon", neighborhood:"Bairro Alto",
          lat:38.710, lng:-9.143, price:190, currency:q.currencyCode, checkIn:q.checkInDate, checkOut:q.checkOutDate },
      ]
    });
  }

  const params: any = {
    checkInDate: q.checkInDate,
    checkOutDate: q.checkOutDate,
    adults: q.adults,
    currencyCode: q.currencyCode,
    bestRateOnly: "true",
    roomQuantity: 1,
    radius: q.latitude && q.longitude ? q.radius : undefined,
    latitude: q.latitude,
    longitude: q.longitude,
    cityCode: !q.latitude && !q.longitude ? q.cityCode : undefined,
  };

  const res = await amadeusGet<any>("/v3/shopping/hotel-offers", params);

  const results = (res?.data || []).map((h: any) => {
    const offer = h.offers?.[0];
    const price = offer?.price?.total ? Number(offer.price.total) : undefined;
    return {
      hotelId: h.hotel?.hotelId,
      name: h.hotel?.name,
      rating: h.hotel?.rating ? Number(h.hotel.rating) : undefined,
      address: h.hotel?.address?.lines?.join(", "),
      neighborhood: h.hotel?.cityCode,
      lat: h.hotel?.latitude,
      lng: h.hotel?.longitude,
      price,
      currency: offer?.price?.currency || q.currencyCode,
      checkIn: offer?.checkInDate,
      checkOut: offer?.checkOutDate,
      affiliateUrl: price ? buildHotelUrl({
        hotelId: h.hotel?.hotelId,
        name: h.hotel?.name,
        cityCode: h.hotel?.cityCode,
        price
      }) : undefined,
    };
  }).slice(0, q.max);

  return NextResponse.json({ query: q, results });
}
