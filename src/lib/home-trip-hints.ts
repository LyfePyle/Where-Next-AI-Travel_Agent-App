/**
 * Best-effort trip hints from homepage hero copy (chips + optional AI reply).
 * Used to open /plan-trip with the same params Suggestions already understands.
 */

export type HomeTripType = 'single' | 'multi-city' | 'surprise';

export type HomeTripHints = {
  destination: string;
  tripType: HomeTripType;
  tripDurationNights: number | null;
  budgetAmount: number;
  numberOfStops: number | null;
  tripLengthLabel: string;
};

/** Longer names first so "South East Asia" wins over a later city match. */
const KNOWN_REGIONS = [
  'Southeast Asia',
  'South East Asia',
  'South Asia',
  'East Asia',
  'Central America',
  'South America',
  'North America',
  'Western Europe',
  'Eastern Europe',
  'Northern Europe',
  'Southern Europe',
  'the Middle East',
  'Middle East',
  'the Caribbean',
  'the Balkans',
  'Scandinavia',
  'the Alps',
  'West Africa',
  'East Africa',
  'North Africa',
  'Oceania',
];

const KNOWN_CITIES = [
  'Tokyo',
  'Kyoto',
  'Osaka',
  'Japan',
  'Paris',
  'London',
  'Barcelona',
  'Rome',
  'Lisbon',
  'Amsterdam',
  'Berlin',
  'Dublin',
  'NYC',
  'New York',
  'San Francisco',
  'Los Angeles',
  'Mexico City',
  'Cancún',
  'Bangkok',
  'Singapore',
  'Seoul',
  'Sydney',
  'Dubai',
  'Istanbul',
  'Marrakech',
  'Cairo',
  'Cape Town',
  'Lima',
  'Cusco',
  'Santiago',
  'Reykjavik',
  'Santorini',
  'Athens',
  'Swiss Alps',
  'Zurich',
  'Vancouver',
  'Toronto',
  'Montreal',
  'Bali',
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function isMultiCountryPrompt(text: string): boolean {
  const t = text.toLowerCase();
  if (/\b\d+\s+countries\b/.test(t)) return true;
  if (/\bmulti[- ]?(city|country|stop)s?\b/.test(t)) return true;
  if (/\bseveral (cities|countries|stops)\b/.test(t)) return true;
  return KNOWN_REGIONS.some((region) => new RegExp(`\\b${escapeRegExp(region)}\\b`, 'i').test(text));
}

const REGION_DISPLAY: Record<string, string> = {
  'South East Asia': 'Southeast Asia',
  'the Middle East': 'Middle East',
  'the Caribbean': 'Caribbean',
  'the Balkans': 'Balkans',
  'the Alps': 'Alps',
};

function matchRegion(text: string): string | null {
  for (const region of KNOWN_REGIONS) {
    if (new RegExp(`\\b${escapeRegExp(region)}\\b`, 'i').test(text)) {
      return REGION_DISPLAY[region] ?? region;
    }
  }
  const inRegion = text.match(/\b(?:in|around|across)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (inRegion && isMultiCountryPrompt(text)) return inRegion[1];
  return null;
}

export function guessDestinationFromText(...parts: string[]): string {
  const text = parts.filter(Boolean).join('\n');
  const region = matchRegion(text);
  if (region) return region;

  for (const place of KNOWN_CITIES) {
    if (new RegExp(`\\b${escapeRegExp(place)}\\b`, 'i').test(text)) {
      return place === 'Japan' ? 'Japan' : place;
    }
  }
  const m = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  return m ? m[1] : 'Your trip';
}

export function guessBudgetUsdFromText(text: string): number {
  const lower = text.toLowerCase();
  const kMatch = text.match(/\$\s*([\d.]+)\s*k\b/i) || text.match(/\b([\d.]+)\s*k\s*(?:usd|dollars?)?\b/i);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000) || 2000;
  const m = text.match(/\$\s*([\d,]+)/);
  if (m) return parseInt(m[1].replace(/,/g, ''), 10) || 2000;
  const under = lower.match(/under\s*\$?\s*([\d,]+)/);
  if (under) return parseInt(under[1].replace(/,/g, ''), 10) || 2000;
  if (/luxury|splurge|high[-\s]?end/.test(lower)) return 8000;
  if (/\bmid(?:[- ](?:range|budget))?|\bmoderate\b|\bcomfortable\b/.test(lower)) return 4500;
  if (/\bbudget\b|\bcheap\b|\baffordable\b/.test(lower)) return 2000;
  return 3000;
}

export function guessTripDurationNights(text: string): number | null {
  const week = text.match(/(\d+)\s*weeks?/i);
  if (week) return Math.max(1, parseInt(week[1], 10) * 7);
  const range = text.match(/(\d+)\s*[-–]\s*(\d+)\s*-?\s*days?/i);
  if (range) return Math.max(1, parseInt(range[2], 10));
  const days = text.match(/(\d+)\s*-?\s*days?/i);
  if (days) return Math.max(1, parseInt(days[1], 10));
  return null;
}

export function guessTripLengthLabel(text: string): string {
  const nights = guessTripDurationNights(text);
  if (nights != null) {
    if (nights % 7 === 0 && nights >= 14) return `${nights / 7} weeks`;
    return `${nights} days`;
  }
  return '7–14 days';
}

export function guessCountryCount(text: string): number | null {
  const m = text.match(/\b(\d+)\s+countries\b/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n) || n < 2) return null;
  return Math.min(8, n);
}

export function guessStylePaceFromText(text: string): { style: string; pace: string } {
  const t = text.toLowerCase();
  const style =
    /luxury|splurge|high[-\s]?end/.test(t) ? 'Upscale' :
    /\bmid(?:[- ](?:range|budget))?|\bmoderate\b|\bcomfortable\b/.test(t) ? 'Mid' :
    /\bbudget\b|\bcheap\b|\baffordable\b/.test(t) ? 'Budget' :
    /family|kids/.test(t) ? 'Family' : 'Balanced';
  const pace =
    /relax|slow|chill|easy/.test(t) ? 'Relaxed' :
    /pack|busy|adventure|hiking/.test(t) ? 'Active' : 'Explorer';
  return { style, pace };
}

export function guessHomeTripHints(prompt: string, aiResponse = ''): HomeTripHints {
  const combined = `${prompt}\n${aiResponse}`;
  const destination = guessDestinationFromText(prompt, aiResponse);
  const multi = isMultiCountryPrompt(combined);
  return {
    destination,
    tripType: multi ? 'multi-city' : 'single',
    tripDurationNights: guessTripDurationNights(combined),
    budgetAmount: guessBudgetUsdFromText(combined),
    numberOfStops: guessCountryCount(combined),
    tripLengthLabel: guessTripLengthLabel(combined),
  };
}

export function buildPlanTripHrefFromHints(
  hints: HomeTripHints,
  extra?: { additionalDetails?: string }
): string {
  const params = new URLSearchParams();
  const dest = hints.destination === 'Your trip' ? '' : hints.destination;
  if (dest) params.set('destination', dest);
  params.set('tripType', hints.tripType);
  if (hints.tripDurationNights != null) {
    params.set('tripDuration', String(hints.tripDurationNights));
  }
  params.set('budgetAmount', String(hints.budgetAmount));
  if (hints.numberOfStops != null) {
    params.set('numberOfStops', String(hints.numberOfStops));
  }
  const details = extra?.additionalDetails?.trim();
  if (details) params.set('additionalDetails', details.slice(0, 400));
  const qs = params.toString();
  return qs ? `/plan-trip?${qs}` : '/plan-trip';
}
