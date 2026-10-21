/**
 * Bookable place names for partner search (Expedia, Booking.com, Skyscanner, Viator).
 *
 * Trip `destination` is often an evocative AI title ("Swiss Alps Nature Retreat").
 * Flight/hotel search needs a real city/region. Prefer the stop's geocoded
 * city/country; fall back to live geocoding of the display title.
 */

import { geocodeCity } from '@/lib/geocode-city';

export function bookableLabel(name: string, country?: string): string {
  const n = name.trim();
  const c = country?.trim();
  if (!n) return c || '';
  // Skip ISO codes ("BT", "ID") and Nominatim multilingual dumps
  // ("Schweiz/Suisse/...") — partner search wants a readable place name.
  const countryOk =
    !!c &&
    c.length > 2 &&
    c.length <= 40 &&
    !c.includes('/') &&
    !n.toLowerCase().includes(c.toLowerCase());
  if (countryOk) return `${n}, ${c}`;
  return n;
}

/**
 * Alternate queries when the display title is a vibe name, not a bookable place.
 * "Swiss Alps Nature Retreat" → "Swiss Alps"; "Family Fun in Bali" → "Bali".
 */
export function bookablePlaceGuesses(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const guesses: string[] = [trimmed];

  const inPlace = trimmed.match(/\bin\s+(.+)$/i);
  if (inPlace?.[1]?.trim()) guesses.push(inPlace[1].trim());

  const stripped = trimmed
    .replace(
      /\s+((nature|wellness|mountain|alpine|beach|city|family)\s+)?(retreat|getaway|escape|adventure|holiday|vacation|break)$/i,
      ''
    )
    .trim();
  if (stripped.length >= 3) guesses.push(stripped);

  return [...new Set(guesses)];
}

export function bookableDestinationFromStop(stop: {
  city?: string;
  country?: string;
  destination: string;
}): string {
  const city = stop.city?.trim();
  if (city) return bookableLabel(city, stop.country);
  return stop.destination.trim();
}

/**
 * Resolve a free-text destination to a partner-searchable place.
 * A geocode miss is not a real place — try title guesses, then keep the original text.
 */
export async function resolveBookableDestination(
  raw: string,
  country?: string
): Promise<string> {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  for (const guess of bookablePlaceGuesses(trimmed)) {
    const coords = await geocodeCity(guess, country);
    if (!coords) continue;
    const name = coords.name?.trim();
    if (!name) continue;
    return bookableLabel(name, coords.country || country);
  }

  return trimmed;
}
