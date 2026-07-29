import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  normalizeTripStopsFromRow,
  serializeStopsForDb,
  validateStopsForSave,
} from "@/lib/trip-stops";
import { tripDestinationSummary, tripEndDate, tripStartDate } from "@/types/trip";
import type { TripStop } from "@/types/trip";

/** Normalized shape returned to the booking page (and any client). */
export type NormalizedTrip = {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  travelers: { adults: number; kids: number };
  budget_amount: number | null;
  /** Normalized stops (always at least one; legacy rows synthesized). */
  stops: TripStop[];
  adults?: number;
  kids?: number;
  vibe?: string | null;
  /** Persisted AI preview blob (single-stop flat or multi-stop structured). */
  suggestions?: unknown;
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
    stops: normalizeTripStopsFromRow(row),
    adults,
    kids,
    vibe: row.vibe ?? null,
    suggestions: row.suggestions ?? undefined,
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
    stops: normalizeTripStopsFromRow(row),
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("trips")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { title?: unknown; stops?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }
    updates.title = title;
  }

  if (body.stops !== undefined) {
    if (!Array.isArray(body.stops)) {
      return NextResponse.json({ error: "stops must be an array" }, { status: 400 });
    }

    const serialized = serializeStopsForDb(body.stops as TripStop[]);
    if (!serialized?.length) {
      return NextResponse.json(
        { error: "At least one valid stop is required" },
        { status: 400 }
      );
    }

    const validation = validateStopsForSave(serialized);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.errors._form ?? "Invalid stops", details: validation.errors },
        { status: 400 }
      );
    }

    updates.stops = serialized;
    updates.destination = tripDestinationSummary(serialized);
    updates.start_date = tripStartDate(serialized) || null;
    updates.end_date = tripEndDate(serialized) || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("trips")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error("PATCH /api/trips/[id] failed:", updateError);
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }

  return NextResponse.json({
    trip: normalizeFromTrips(updated),
  });
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
