import { normalizeTripStopsFromRow } from '@/lib/trip-stops';

/** Normalized shape returned to clients from /api/trips/[id]. */
export type NormalizedTrip = {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  travelers: { adults: number; kids: number };
  budget_amount: number | null;
  stops: ReturnType<typeof normalizeTripStopsFromRow>;
  adults?: number;
  kids?: number;
  vibe?: string | null;
  suggestions?: unknown;
};

export function normalizeFromTrips(row: Record<string, unknown>): NormalizedTrip {
  const adults = typeof row.adults === 'number' ? row.adults : 2;
  const kids =
    typeof row.kids === 'number'
      ? row.kids
      : typeof row.children === 'number'
        ? row.children
        : 0;
  return {
    id: String(row.id),
    title: String(row.title ?? row.destination ?? 'Trip'),
    destination: String(row.destination ?? ''),
    start_date: (row.start_date as string | null) ?? null,
    end_date: (row.end_date as string | null) ?? null,
    travelers: { adults, kids },
    budget_amount:
      typeof row.budget_amount === 'number'
        ? row.budget_amount
        : row.budget_amount != null
          ? Number(row.budget_amount)
          : null,
    stops: normalizeTripStopsFromRow(row),
    adults,
    kids,
    vibe: (row.vibe as string | null) ?? null,
    suggestions: row.suggestions ?? undefined,
  };
}

export function normalizeFromSavedTrips(row: Record<string, unknown>): NormalizedTrip {
  const prefs = (row.preferences as Record<string, unknown>) ?? {};
  const travelers = (prefs.travelers as Record<string, unknown>) ?? {};
  const adults =
    typeof travelers.adults === 'number'
      ? travelers.adults
      : typeof row.travelers === 'number'
        ? row.travelers
        : 2;
  const kids =
    typeof travelers.children === 'number'
      ? travelers.children
      : typeof travelers.kids === 'number'
        ? travelers.kids
        : 0;

  return {
    id: String(row.id),
    title: String(row.title ?? row.destination ?? 'Trip'),
    destination: String(row.destination ?? ''),
    start_date: (row.start_date as string | null) ?? null,
    end_date: (row.end_date as string | null) ?? null,
    travelers: { adults, kids },
    budget_amount:
      typeof row.budget_cents === 'number'
        ? row.budget_cents / 100
        : row.budget_cents != null
          ? Number(row.budget_cents) / 100
          : null,
    adults,
    kids,
    stops: normalizeTripStopsFromRow(row),
  };
}
