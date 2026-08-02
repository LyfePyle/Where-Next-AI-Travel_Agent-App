/**
 * Server-side place validation: OpenWeather geocoding, Nominatim fallback.
 */

import { resolvePlace } from '@/lib/geocode-place';

export interface ValidatedPlace {
  place: string;
  country: string;
  countryCode?: string;
}

export async function validatePlace(
  place: string,
  country: string
): Promise<{ ok: true; validated: ValidatedPlace } | { ok: false; error: string }> {
  const city = place.trim();
  const countryName = country.trim();
  if (!city || !countryName) {
    return { ok: false, error: 'Place and country are required.' };
  }

  const resolved = await resolvePlace(city, countryName);
  if (!resolved) {
    return {
      ok: false,
      error: `Could not find "${city}, ${countryName}" — please check the spelling or be more specific.`,
    };
  }

  return {
    ok: true,
    validated: {
      place: resolved.name,
      country: resolved.country || countryName,
      countryCode: resolved.countryCode,
    },
  };
}
