/**
 * Server-side place validation: OpenWeather geocoding, Nominatim fallback.
 */

import { parseDestinationParts } from '@/lib/parse-destination';
import {
  ambiguousCityDefaultCountry,
  disambiguatedCountry,
  normalizePlaceKey,
} from '@/lib/geocode-disambiguation';
import { searchPlaceCandidates, type PlaceCandidate, resolvePlace } from '@/lib/geocode-place';

export interface ValidatedPlace {
  place: string;
  country: string;
  countryCode?: string;
}

export type ValidatePlaceResult =
  | { ok: true; validated: ValidatedPlace }
  | { ok: false; error: string; ambiguous?: false; candidates?: undefined }
  | { ok: false; error: string; ambiguous: true; candidates: ValidatedPlace[] };

const CONFIDENT_SCORE_GAP = 80;
const CLOSE_SCORE_MARGIN = 40;

function toValidated(candidate: PlaceCandidate): ValidatedPlace {
  return {
    place: candidate.name,
    country: candidate.country,
    countryCode: candidate.countryCode,
  };
}

function countryKeys(candidates: PlaceCandidate[]): Set<string> {
  const keys = new Set<string>();
  for (const c of candidates) {
    const key = (c.countryCode ?? c.country).trim().toLowerCase();
    if (key) keys.add(key.slice(0, 2));
  }
  return keys;
}

function candidateMatchesCountry(candidate: PlaceCandidate, countryName: string): boolean {
  const want = normalizePlaceKey(countryName);
  const have = normalizePlaceKey(candidate.country);
  if (have === want) return true;
  const code = (candidate.countryCode ?? '').toLowerCase();
  if (want === 'costa rica' && code === 'cr') return true;
  if (want === 'liberia' && code === 'lr') return true;
  return false;
}

export function pickConfidentMatch(
  city: string,
  candidates: PlaceCandidate[]
):
  | { type: 'single'; candidate: PlaceCandidate }
  | { type: 'ambiguous'; candidates: PlaceCandidate[] }
  | { type: 'none' } {
  if (candidates.length === 0) return { type: 'none' };

  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const forcedCountry = disambiguatedCountry(city);
  if (forcedCountry) {
    const forced = sorted.find((c) => candidateMatchesCountry(c, forcedCountry));
    if (forced) return { type: 'single', candidate: forced };
  }

  const softDefault = ambiguousCityDefaultCountry(city);
  if (softDefault) {
    const preferred = sorted.filter((c) => candidateMatchesCountry(c, softDefault));
    const others = sorted.filter((c) => !candidateMatchesCountry(c, softDefault));
    if (preferred.length > 0 && others.length > 0) {
      return {
        type: 'ambiguous',
        candidates: [...preferred.slice(0, 2), ...others.slice(0, 2)].slice(0, 5),
      };
    }
    if (preferred.length > 0) {
      return { type: 'single', candidate: preferred[0] };
    }
  }

  const top = sorted[0];
  const second = sorted[1];
  if (!second) return { type: 'single', candidate: top };

  if (top.score - second.score >= CONFIDENT_SCORE_GAP) {
    return { type: 'single', candidate: top };
  }

  const close = sorted.filter((c) => c.score >= top.score - CLOSE_SCORE_MARGIN);
  if (countryKeys(close).size <= 1) {
    return { type: 'single', candidate: top };
  }

  return { type: 'ambiguous', candidates: close.slice(0, 5) };
}

export async function validatePlace(
  place: string,
  country: string
): Promise<ValidatePlaceResult> {
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

/** Resolve a free-text destination ("Berlin" or "Paris, France") via geocoding. */
export async function validateDestinationInput(
  destination: string
): Promise<ValidatePlaceResult> {
  const trimmed = destination.trim();
  if (!trimmed) {
    return { ok: false, error: 'Enter a destination.' };
  }

  const { city, country } = parseDestinationParts(trimmed);
  if (!city) {
    return { ok: false, error: 'Enter a destination.' };
  }

  if (country) {
    return validatePlace(city, country);
  }

  const candidates = await searchPlaceCandidates(city);
  const relevant = candidates.filter(
    (c) =>
      normalizePlaceKey(c.name) === normalizePlaceKey(city) ||
      normalizePlaceKey(c.name).includes(normalizePlaceKey(city)) ||
      normalizePlaceKey(city).includes(normalizePlaceKey(c.name))
  );
  const pool = relevant.length > 0 ? relevant : candidates;

  const picked = pickConfidentMatch(city, pool);
  if (picked.type === 'single') {
    return { ok: true, validated: toValidated(picked.candidate) };
  }
  if (picked.type === 'ambiguous') {
    return {
      ok: false,
      ambiguous: true,
      candidates: picked.candidates.map(toValidated),
      error: `Which ${city} did you mean? Pick one or add a country (e.g. "${city}, France").`,
    };
  }

  return {
    ok: false,
    error: `Could not find "${city}" — try adding a country (e.g. "${city}, Germany").`,
  };
}
