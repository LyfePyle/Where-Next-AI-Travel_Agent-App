import { NextResponse } from "next/server";
import { z } from "zod";
import { amadeusGet } from "@/lib/amadeus";

const Query = z.object({
  q: z.string().min(2),                       // keyword like 'Van', 'Lis'
  subType: z.string().optional(),            // default AIRPORT,CITY
  pageLimit: z.coerce.number().min(1).max(50).default(10),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parse = Query.safeParse({
    q: searchParams.get("q"),
    subType: searchParams.get("subType") || undefined,
    pageLimit: searchParams.get("pageLimit") || "10",
  });
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const { q: keyword, subType, pageLimit } = parse.data;

  // Amadeus Airport and City Search
  // https://developers.amadeus.com/self-service/category/air/api-doc/airport-and-city-search
  const res = await amadeusGet<any>("/v1/reference-data/locations", {
    keyword,
    subType: subType || "AIRPORT,CITY",
    "page[limit]": pageLimit,
    sort: "analytics.travelers.score",
  });

  const results = (res?.data || []).map((r: any) => ({
    id: r.id,
    iataCode: r.iataCode,
    name: r.name,
    subType: r.subType,    // AIRPORT or CITY
    detailedName: r.detailedName,
    cityCode: r.address?.cityCode,
    countryCode: r.address?.countryCode,
    lat: r.geoCode?.latitude,
    lng: r.geoCode?.longitude,
  }));

  return NextResponse.json({ query: { keyword, subType, pageLimit }, results });
}
