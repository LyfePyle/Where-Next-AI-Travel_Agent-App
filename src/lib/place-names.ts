/**
 * Short display labels for cities/places in UI (maps, budget, nav).
 * Keep full official names for booking/legal contexts — use these helpers
 * only where a readable short label is appropriate.
 */

const ADMIN_PREFIXES = [
  /^special\s+capital\s+region\s+of\s+/i,
  /^capital\s+region\s+of\s+/i,
  /^autonomous\s+region\s+of\s+/i,
  /^province\s+of\s+/i,
  /^city\s+of\s+/i,
  /^municipality\s+of\s+/i,
  /^district\s+of\s+/i,
  /^greater\s+/i,
  /^metropolitan\s+/i,
];

/** Strip formal/administrative prefixes for compact UI labels. */
export function mapLabelForCity(city: string): string {
  let label = city.trim();
  if (!label) return city;

  for (const re of ADMIN_PREFIXES) {
    label = label.replace(re, '');
  }

  label = label
    .replace(/\s+(city\s+municipality|municipality|metropolitan\s+city|city|province|region)$/i, '')
    .trim();

  if (label.includes(',')) {
    label = label.split(',')[0].trim();
  }

  if (label.length > 20) {
    const words = label.split(/\s+/);
    label = words.length > 2 ? words.slice(-2).join(' ') : words[0] ?? label;
  }

  return label || city.trim();
}

export function shortStopLabel(stop: { city?: string; destination: string }): string {
  const city = stop.city || stop.destination.split(',')[0]?.trim() || stop.destination;
  return mapLabelForCity(city);
}

export function shortTripDestinationSummary(
  stops: Array<{ city?: string; destination: string }>
): string {
  if (stops.length === 0) return '';
  return stops.map(shortStopLabel).join(' → ');
}
