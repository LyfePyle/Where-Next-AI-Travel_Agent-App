// src/app/api/flights/status/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const Query = z.object({
  flightNumber: z.string().min(2), // e.g., AC123
  date: z.string().min(10),        // YYYY-MM-DD (local date of departure)
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parse = Query.safeParse({
    flightNumber: searchParams.get("flightNumber"),
    date: searchParams.get("date"),
  });
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  const { flightNumber, date } = parse.data;

  try {
    const url = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flightNumber)}/${date}`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": process.env.AERODATABOX_API_KEY || "",
        "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `AeroDataBox ${res.status}: ${text}` }, { status: res.status });
    }
    const json = await res.json();

    // Normalize a bit
    const out = (json || []).map((f: any) => ({
      number: f.number,
      airline: f.airline?.name,
      departure: {
        scheduled: f.departure?.scheduledTimeLocal || f.departure?.scheduledTimeUtc,
        actual: f.departure?.actualTimeLocal || f.departure?.actualTimeUtc,
        airport: f.departure?.airport?.icao,
        gate: f.departure?.gate,
        terminal: f.departure?.terminal,
      },
      arrival: {
        scheduled: f.arrival?.scheduledTimeLocal || f.arrival?.scheduledTimeUtc,
        actual: f.arrival?.actualTimeLocal || f.arrival?.actualTimeUtc,
        airport: f.arrival?.airport?.icao,
        gate: f.arrival?.gate,
        terminal: f.arrival?.terminal,
      },
      status: f.status,
    }));

    return NextResponse.json({ flightNumber, date, results: out });
  } catch (error) {
    console.error('Flight status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flight status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
