import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Normalized shape returned to the booking page (and any client). */
export type NormalizedTrip = {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  travelers: { adults: number; kids: number };
  budget_amount: number | null;
  /** Multi-stop array when present (from trips.stops JSONB). */
  stops?: Array<{ id: string; destination: string; startDate: string; endDate: string }>;
  adults?: number;
  kids?: number;
  vibe?: string | null;
};

async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: (n, v, o) => cookieStore.set({ name: n, value: v, ...o }),
        remove: (n, o) => cookieStore.set({ name: n, value: "", ...o }),
      },
    }
  );
}

function normalizeFromTrips(row: any): NormalizedTrip {
  const adults = typeof row.adults === "number" ? row.adults : 2;
  const kids = typeof row.kids === "number" ? row.kids : typeof row.children === "number" ? row.children : 0;
  return {
    id: row.id,
    title: row.title ?? row.destination ?? "Trip",
    destination: row.destination ?? "",
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    travelers: { adults, kids },
    budget_amount:
      typeof row.budget_amount === "number"
        ? row.budget_amount
        : row.budget_amount != null
          ? Number(row.budget_amount)
          : null,
    stops: Array.isArray(row.stops) && row.stops.length > 0 ? row.stops : undefined,
    adults,
    kids,
    vibe: row.vibe ?? null,
  };
}

function normalizeFromSavedTrips(row: any): NormalizedTrip {
  const prefs = row.preferences ?? {};
  const travelers = prefs.travelers ?? {};
  const adults =
    typeof travelers.adults === "number"
      ? travelers.adults
      : typeof row.travelers === "number"
        ? row.travelers
        : 2;
  const kids =
    typeof travelers.children === "number"
      ? travelers.children
      : typeof travelers.kids === "number"
        ? travelers.kids
        : 0;

  return {
    id: row.id,
    title: row.title ?? row.destination ?? "Trip",
    destination: row.destination ?? "",
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    travelers: { adults, kids },
    budget_amount:
      typeof row.budget_cents === "number"
        ? row.budget_cents / 100
        : row.budget_cents != null
          ? Number(row.budget_cents) / 100
          : null,
    adults,
    kids,
  };
}

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const supabase = await supabaseServer();

  // Prefer `trips` (POST /api/trips/save) then legacy `saved_trips`
  const { data: tripData, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (!tripError && tripData) {
    return NextResponse.json({
      trip: normalizeFromTrips(tripData),
    });
  }

  const { data: savedData, error: savedError } = await supabase
    .from("saved_trips")
    .select("*")
    .eq("id", id)
    .single();

  if (savedError || !savedData) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  return NextResponse.json({
    trip: normalizeFromSavedTrips(savedData),
  });
}
