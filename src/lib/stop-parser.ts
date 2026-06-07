/**
 * src/lib/stop-parser.ts
 * Turns a multi-city trip into separate stop objects the trip hub renders as
 * individual destination cards (and generates per-city affiliate links for).
 *
 * Two entry points:
 *   - distributeStops(names, start, end)  — when you already have a city list
 *     (e.g. suggestion.stops). This is the reliable path.
 *   - parseDestinationToStops(str, start, end) — fallback that splits a string
 *     like "Singapore, Bali & Yogyakarta" into stops. It is deliberately
 *     conservative: a plain "Bangkok, Thailand" stays a SINGLE stop, because a
 *     comma alone usually means "City, Country", not multiple destinations.
 */

export interface TripStop {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
}

/** Spread a date range across an ordered list of city names, proportionally. */
export function distributeStops(
  names: string[],
  startDate: string,
  endDate: string
): TripStop[] {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  if (clean.length === 0) return [];
  if (clean.length === 1) {
    return [{ id: 'stop-0', destination: clean[0], startDate, endDate }];
  }

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const totalDays =
    start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())
      ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000))
      : 0;
  const daysPerStop = totalDays > 0 ? Math.floor(totalDays / clean.length) : 0;

  return clean.map((dest, i) => {
    let stopStart = startDate;
    let stopEnd = endDate;

    if (start && daysPerStop > 0) {
      const s = new Date(start);
      s.setDate(s.getDate() + i * daysPerStop);
      const e = new Date(s);
      e.setDate(e.getDate() + daysPerStop);
      stopStart = s.toISOString().split('T')[0];
      stopEnd = i === clean.length - 1 ? endDate : e.toISOString().split('T')[0];
    }

    return { id: `stop-${i}`, destination: dest, startDate: stopStart, endDate: stopEnd };
  });
}

/**
 * Parse a destination string into stops. Only splits into multiple stops when
 * the string clearly lists several places (contains `&`, ` and `, or `→`).
 * Otherwise it returns a single stop so "City, Country" is preserved.
 */
export function parseDestinationToStops(
  destination: string,
  startDate: string,
  endDate: string
): TripStop[] {
  const dest = (destination ?? '').trim();
  if (!dest) return [];

  const hasListSeparator = /\s&\s|\s+and\s+|→/i.test(dest);
  if (!hasListSeparator) {
    return [{ id: 'stop-0', destination: dest, startDate, endDate }];
  }

  const names = dest
    .split(/\s*&\s*|\s+and\s+|\s*→\s*|\s*,\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);

  return distributeStops(names, startDate, endDate);
}
