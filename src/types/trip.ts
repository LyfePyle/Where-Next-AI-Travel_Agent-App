/**
 * src/types/trip.ts
 *
 * Shared types for multi-destination trip planning.
 * Both the plan-trip form and TripDetailsAlacarte use these.
 */

export interface TripStop {
  /** Unique key for React list rendering */
  id: string;
  /** ISO 3166-style or display country, e.g. "Costa Rica" */
  country?: string;
  /** City or place name without country, e.g. "Monteverde" */
  city?: string;
  /** Human-readable destination name, e.g. "Monteverde, Costa Rica" */
  destination: string;
  /** ISO date string YYYY-MM-DD */
  startDate: string;
  /** ISO date string YYYY-MM-DD */
  endDate: string;
  /** Explicit ordering within the trip (0-based) */
  order?: number;
  /** Optional user notes (Trip Hub) */
  notes?: string;
}

export interface TripPlan {
  stops: TripStop[];
  /** Number of adult travelers */
  adults: number;
  /** Number of child travelers */
  kids: number;
  /** Total budget in USD */
  budgetAmount: number;
  /** Travel vibe / style, e.g. "adventure", "relaxing", "cultural" */
  vibe?: string;
}

/**
 * Derive a human-readable summary of the full trip.
 * e.g. "Paris → Amsterdam → Berlin"
 */
export function tripDestinationSummary(stops: TripStop[]): string {
  return stops.map((s) => s.destination).join(' → ');
}

/**
 * Return the overall trip start date (first stop's startDate).
 */
export function tripStartDate(stops: TripStop[]): string {
  return stops[0]?.startDate ?? '';
}

/**
 * Return the overall trip end date (last stop's endDate).
 */
export function tripEndDate(stops: TripStop[]): string {
  return stops[stops.length - 1]?.endDate ?? '';
}

/**
 * Total number of nights across all stops.
 */
export function tripTotalNights(stops: TripStop[]): number {
  return stops.reduce((total, stop) => {
    const start = new Date(stop.startDate);
    const end = new Date(stop.endDate);
    const nights = Math.max(
      0,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    return total + nights;
  }, 0);
}

/**
 * Build URL search params for a multi-stop trip.
 * Serialises stops as JSON to preserve the full structure.
 * Single-destination trips (stops.length === 1) also set the legacy
 * `destination`, `startDate`, `endDate` params for backward compatibility.
 */
export function tripToSearchParams(plan: TripPlan, tripId?: string): URLSearchParams {
  const params = new URLSearchParams();

  if (tripId) params.set('tripId', tripId);

  // Modern param: full stops array
  params.set('stops', JSON.stringify(plan.stops));

  // Legacy params: kept for backward compat with booking / confirmation pages
  const first = plan.stops[0];
  const last = plan.stops[plan.stops.length - 1];
  if (first) {
    params.set('destination', tripDestinationSummary(plan.stops));
    params.set('startDate', first.startDate);
    params.set('endDate', last?.endDate ?? first.endDate);
  }

  params.set('adults', String(plan.adults));
  params.set('kids', String(plan.kids));
  params.set('budgetAmount', String(plan.budgetAmount));
  if (plan.vibe) params.set('vibe', plan.vibe);

  return params;
}

/**
 * Parse stops from URL search params.
 * Falls back to constructing a single stop from legacy params.
 */
export function stopsFromSearchParams(searchParams: URLSearchParams): TripStop[] {
  const raw = searchParams.get('stops');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  // Legacy fallback
  const destination = searchParams.get('destination') ?? '';
  const startDate = searchParams.get('startDate') ?? '';
  const endDate = searchParams.get('endDate') ?? '';
  if (destination || startDate) {
    return [{ id: 'stop-0', destination, startDate, endDate }];
  }

  return [];
}
