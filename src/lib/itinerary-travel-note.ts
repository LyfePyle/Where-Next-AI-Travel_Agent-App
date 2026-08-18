/**
 * Arrival / departure / onward travel blurbs for itinerary days.
 * Checkout morning of a stop shares a date with the next stop's arrival and has
 * no itinerary row — onward notes attach to the last generated day instead.
 */

export type TravelNoteKind = 'arrival' | 'departure' | 'onward' | 'both';

export interface TravelNoteContext {
  city: string;
  isLastStop: boolean;
  prevCity?: string | null;
  nextCity?: string | null;
}

export function resolveTravelNoteKind(input: {
  dayIndex: number;
  totalDays: number;
  isLastStop: boolean;
}): TravelNoteKind | null {
  const total = Math.max(1, input.totalDays);
  const index = Math.max(1, input.dayIndex);
  const isFirst = index === 1;
  const isLast = index === total;
  if (!isFirst && !isLast) return null;
  if (isFirst && isLast) return 'both';
  if (isFirst) return 'arrival';
  return input.isLastStop ? 'departure' : 'onward';
}

export function travelNoteTitle(kind: TravelNoteKind | null | undefined): string {
  switch (kind) {
    case 'arrival':
      return 'Getting there';
    case 'departure':
      return 'Heading out';
    case 'onward':
      return 'Next morning';
    case 'both':
      return 'Travel notes';
    default:
      return 'Travel note';
  }
}

export function fallbackTravelNote(
  kind: TravelNoteKind,
  ctx: TravelNoteContext
): string {
  const city = ctx.city.trim() || 'town';
  const nextCity = ctx.nextCity?.trim() || 'the next stop';
  const from = ctx.prevCity?.trim();

  const arrival = from
    ? `From ${from}, you'll typically arrive at ${city}'s airport or main station — taxi or the airport train/bus is the straightforward hop to your hotel. Keep the first afternoon light.`
    : `From the airport or main station, taxi or the airport train/bus is the straightforward hop to your hotel in ${city}. Keep the first afternoon light.`;

  const departure = `Leave buffer for the trip back to the airport or station. Check out, then taxi or the airport train rather than squeezing in one more activity.`;

  const onward = `Checkout is the next morning — that date is ${nextCity}'s arrival day, so there's no extra ${city} itinerary row for it. Pack tonight; train, bus, or a short flight is the usual hop to ${nextCity}.`;

  switch (kind) {
    case 'arrival':
      return arrival;
    case 'departure':
      return departure;
    case 'onward':
      return onward;
    case 'both':
      return ctx.isLastStop ? `${arrival} ${departure}` : `${arrival} ${onward}`;
  }
}

export function parseTravelNoteKind(raw: unknown): TravelNoteKind | null {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (s === 'arrival' || s === 'departure' || s === 'onward' || s === 'both') return s;
  return null;
}

export function normalizeTravelNoteText(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const text = raw.trim();
  return text ? text : undefined;
}

export function applyTravelNotesToDays<
  T extends { day_index: number; travel_note?: string; travel_note_kind?: TravelNoteKind },
>(days: T[], ctx: TravelNoteContext & { totalDays?: number }): T[] {
  const totalDays = Math.max(1, ctx.totalDays ?? days.length);
  return days.map((day) => {
    const kind = resolveTravelNoteKind({
      dayIndex: day.day_index,
      totalDays,
      isLastStop: ctx.isLastStop,
    });
    if (!kind) {
      const next = { ...day };
      delete next.travel_note;
      delete next.travel_note_kind;
      return next;
    }
    const text = day.travel_note?.trim() || fallbackTravelNote(kind, ctx);
    return { ...day, travel_note: text, travel_note_kind: kind };
  });
}
