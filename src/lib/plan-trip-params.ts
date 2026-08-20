/**
 * Shared Plan Trip URL prefill — the same keys Suggestions already writes forward.
 */

export type PlanTripStyle = 'single' | 'multi' | 'surprise';

export type PlanTripPrefill = {
  tripStyle?: PlanTripStyle;
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  additionalDetails?: string;
  vibes?: string[];
  numberOfStops?: number;
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
