/**
 * Detect reorder intent from chat and apply reorder_stops when the model skips it.
 */

import { reorderStops } from '@/lib/trip-mutations';
import type { ToolCallInput } from '@/lib/trip-mutations';
import type { TripStop } from '@/types/trip';

export type ReorderIntent =
  | { kind: 'last'; place: string }
  | { kind: 'first'; place: string }
  | { kind: 'before'; place: string; beforePlace: string };

function normPlace(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
}

export function findStopByPlace(stops: TripStop[], place: string): TripStop | undefined {
  const target = normPlace(place);
  if (!target) return undefined;

  return stops.find((s) => {
    const city = normPlace(s.city || s.destination.split(',')[0] || '');
    const dest = normPlace(s.destination);
    return (
      city === target ||
      city.includes(target) ||
      target.includes(city) ||
      dest.includes(target)
    );
  });
}

/** Parse explicit positional requests from the user message. */
export function parseReorderIntent(message: string): ReorderIntent | null {
  const m = message.trim();
  if (!m) return null;

  const lastPatterns = [
    /\b(?:end|finish|conclude|wrap up)\s+(?:in|at|with)\s+([A-Za-z][A-Za-z\s'-]{1,40}?)(?:\s+instead|\s*$|[,.!])/i,
    /\b(?:put|move|make)\s+([A-Za-z][A-Za-z\s'-]{1,40}?)\s+(?:as\s+)?(?:the\s+)?last\s+(?:stop|city|destination)/i,
    /\b([A-Za-z][A-Za-z\s'-]{1,40}?)\s+(?:as|should be)\s+(?:the\s+)?last\s+(?:stop|city|destination)/i,
    /\blast\s+stop\s+(?:should be|is)\s+([A-Za-z][A-Za-z\s'-]{1,40})/i,
  ];

  for (const re of lastPatterns) {
    const match = m.match(re);
    const place = match?.[1]?.trim();
    if (place && place.length >= 3) return { kind: 'last', place };
  }

  const firstPatterns = [
    /\b(?:start|begin)\s+(?:in|at|with)\s+([A-Za-z][A-Za-z\s'-]{1,40}?)(?:\s|$|[,.!])/i,
    /\b(?:put|move|make)\s+([A-Za-z][A-Za-z\s'-]{1,40}?)\s+(?:as\s+)?(?:the\s+)?first\s+(?:stop|city|destination)/i,
    /\b([A-Za-z][A-Za-z\s'-]{1,40}?)\s+(?:as|should be)\s+(?:the\s+)?first\s+(?:stop|city|destination)/i,
  ];

  for (const re of firstPatterns) {
    const match = m.match(re);
    const place = match?.[1]?.trim();
    if (place && place.length >= 3) return { kind: 'first', place };
  }

  // "end in Denpasar instead of starting there" — Denpasar should be last if it exists and isn't already
  const insteadMatch = m.match(
    /\b(?:end|finish)\s+(?:in|at)\s+([A-Za-z][A-Za-z\s'-]{1,40}?)\s+instead/i
  );
  if (insteadMatch?.[1]) {
    return { kind: 'last', place: insteadMatch[1].trim() };
  }

  const beforeMatch = m.match(
    /\b(?:put|move)\s+([A-Za-z][A-Za-z\s'-]{1,40}?)\s+before\s+([A-Za-z][A-Za-z\s'-]{1,40}?)(?:\s|$|[,.!])/i
  );
  if (beforeMatch?.[1] && beforeMatch?.[2]) {
    return {
      kind: 'before',
      place: beforeMatch[1].trim(),
      beforePlace: beforeMatch[2].trim(),
    };
  }

  return null;
}

export function buildOrderedStopIds(stops: TripStop[], intent: ReorderIntent): string[] | null {
  const target = findStopByPlace(stops, intent.place);
  if (!target) return null;

  const ids = stops.map((s) => s.id);
  const without = ids.filter((id) => id !== target.id);

  if (intent.kind === 'last') {
    return [...without, target.id];
  }
  if (intent.kind === 'first') {
    return [target.id, ...without];
  }

  const anchor = findStopByPlace(stops, intent.beforePlace);
  if (!anchor || anchor.id === target.id) return null;
  const beforeIdx = without.indexOf(anchor.id);
  if (beforeIdx === -1) return null;
  without.splice(beforeIdx, 0, target.id);
  return without;
}

function ordersEqual(a: TripStop[], orderedIds: string[]): boolean {
  return a.every((s, i) => s.id === orderedIds[i]);
}

/** Apply reorder when the user asked for a positional change but stops aren't in that order yet. */
export function applyReorderFromIntent(
  stops: TripStop[],
  tripStart: string,
  userMessage: string
): { stops: TripStop[]; summary?: string; extraCall?: ToolCallInput } | null {
  const intent = parseReorderIntent(userMessage);
  if (!intent) return null;

  const orderedIds = buildOrderedStopIds(stops, intent);
  if (!orderedIds || ordersEqual(stops, orderedIds)) {
    return null;
  }

  const result = reorderStops(stops, tripStart, orderedIds);
  if (!result.ok) return null;

  const place = intent.place;
  let summary: string;
  if (intent.kind === 'last') {
    summary = `Moved ${place} to the last stop`;
  } else if (intent.kind === 'first') {
    summary = `Moved ${place} to the first stop`;
  } else {
    summary = `Moved ${place} before ${intent.beforePlace}`;
  }

  return {
    stops: result.stops,
    summary,
    extraCall: { name: 'reorder_stops', arguments: { ordered_stop_ids: orderedIds } },
  };
}
