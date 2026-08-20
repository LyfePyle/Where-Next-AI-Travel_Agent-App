/**
 * Shared Plan Trip URL prefill — the same keys Suggestions already writes forward.
 */

export type PlanTripStyle = 'single' | 'multi' | 'surprise';

export type PlanTripPrefill = {
  tripStyle?: PlanTripStyle;
  destination?: string;
  origin?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  additionalDetails?: string;
  vibes?: string[];
  numberOfStops?: number;
  adults?: number;
  kids?: number;
  stops?: { id: string; destination: string; startDate: string; endDate: string }[];
};

const BUDGET_MIN = 500;
const BUDGET_MAX = 20000;
const BUDGET_STEP = 250;
const MAX_STOPS = 8;
const MAX_VIBES = 3;
const DEFAULT_START_OFFSET_DAYS = 28;

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addUtcDays(d: Date, days: number): Date {
  const next = new Date(d.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function clampBudgetAmount(raw: number): number {
  if (!Number.isFinite(raw)) return 3000;
  const clamped = Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, raw));
  return Math.round(clamped / BUDGET_STEP) * BUDGET_STEP;
}

export function datesFromTripDuration(
  nights: number,
  now: Date = new Date(),
  startDate?: string
): { startDate: string; endDate: string } {
  const duration = Math.max(1, Math.round(nights));
  const start = startDate
    ? new Date(`${startDate}T12:00:00.000Z`)
    : addUtcDays(
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12)),
        DEFAULT_START_OFFSET_DAYS
      );
  const end = addUtcDays(start, duration);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

export function parseTripStyleParam(raw: string | null): PlanTripStyle | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  if (v === 'multi-city' || v === 'multi') return 'multi';
  if (v === 'surprise') return 'surprise';
  if (v === 'single') return 'single';
  return undefined;
}

export function parsePlanTripSearchParams(
  params: URLSearchParams,
  vibeAllowlist: string[],
  now: Date = new Date()
): PlanTripPrefill {
  const out: PlanTripPrefill = {};

  const dest = params.get('destination')?.trim();
  if (dest) out.destination = dest;

  const origin = params.get('from')?.trim();
  if (origin) out.origin = origin;

  const adultsRaw = parseInt(params.get('adults') || '', 10);
  if (Number.isFinite(adultsRaw)) out.adults = Math.min(9, Math.max(1, Math.round(adultsRaw)));

  const kidsRaw = parseInt(params.get('kids') || '', 10);
  if (Number.isFinite(kidsRaw)) out.kids = Math.min(8, Math.max(0, Math.round(kidsRaw)));

  const style = parseTripStyleParam(params.get('tripType') ?? params.get('mode'));
  if (style) out.tripStyle = style;

  const details = params.get('additionalDetails')?.trim();
  if (details) out.additionalDetails = details.slice(0, 400);

  const budgetRaw = params.get('budgetAmount') ?? params.get('budget');
  if (budgetRaw) {
    const n = parseInt(budgetRaw.replace(/,/g, ''), 10);
    if (Number.isFinite(n)) out.budget = clampBudgetAmount(n);
  }

  const vibesParam = params.get('vibes');
  if (vibesParam) {
    const parsed = vibesParam
      .split(',')
      .map((v) => v.trim())
      .filter((v) => vibeAllowlist.includes(v));
    if (parsed.length) out.vibes = parsed.slice(0, MAX_VIBES);
  }

  const stopsRaw = parseInt(params.get('numberOfStops') || '', 10);
  if (Number.isFinite(stopsRaw)) {
    out.numberOfStops = Math.min(MAX_STOPS, Math.max(2, Math.round(stopsRaw)));
  }

  const namedStops = parseNamedStopsParam(params.get('stops'));
  if (namedStops.length >= 2) {
    out.stops = namedStops;
    out.numberOfStops = namedStops.length;
    if (!out.tripStyle) out.tripStyle = 'multi';
  }

  const startDate = params.get('startDate')?.trim() || '';
  const endDate = params.get('endDate')?.trim() || '';
  const durationRaw = parseInt(params.get('tripDuration') || '', 10);
  const hasDuration = Number.isFinite(durationRaw) && durationRaw > 0;

  if (startDate && endDate) {
    out.startDate = startDate;
    out.endDate = endDate;
  } else if (hasDuration) {
    const dates = datesFromTripDuration(durationRaw, now, startDate || undefined);
    out.startDate = dates.startDate;
    out.endDate = dates.endDate;
  } else if (startDate) {
    out.startDate = startDate;
  }

  return out;
}

function parseNamedStopsParam(
  raw: string | null
): { id: string; destination: string; startDate: string; endDate: string }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, i) => {
        if (!item || typeof item !== 'object') return null;
        const s = item as Record<string, unknown>;
        const destination = typeof s.destination === 'string' ? s.destination.trim() : '';
        if (!destination) return null;
        return {
          id: typeof s.id === 'string' && s.id ? s.id : `stop-${i}`,
          destination,
          startDate: typeof s.startDate === 'string' ? s.startDate : '',
          endDate: typeof s.endDate === 'string' ? s.endDate : '',
        };
      })
      .filter((s): s is { id: string; destination: string; startDate: string; endDate: string } => s != null)
      .slice(0, MAX_STOPS);
  } catch {
    return [];
  }
}

/** Suggestions → Plan Trip: keep the current query so the form can rehydrate. */
export function planTripHrefFromSearchParams(params: { toString(): string }): string {
  const qs = params.toString();
  return qs ? `/plan-trip?${qs}` : '/plan-trip';
}
