import type { TripStop } from '@/types/trip';
import type { ValidatedPlace } from '@/lib/validate-place';

export type PlaceValidationBody = {
  ok?: boolean;
  ambiguous?: boolean;
  error?: string;
  validated?: ValidatedPlace;
  candidates?: ValidatedPlace[];
};

export type PlaceGate =
  | { type: 'confident'; place: ValidatedPlace }
  | { type: 'choose'; candidates: ValidatedPlace[] }
  | { type: 'edit'; message: string };

/** Coordinates saved on a stop after the user confirmed the place. */
export function storedStopCoords(
  stop: { lat?: number; lng?: number }
): { lat: number; lon: number } | null {
  if (
    typeof stop.lat === 'number' &&
    Number.isFinite(stop.lat) &&
    typeof stop.lng === 'number' &&
    Number.isFinite(stop.lng)
  ) {
    return { lat: stop.lat, lon: stop.lng };
  }
  return null;
}

export function stopAlreadyConfirmed(stop: TripStop): boolean {
  return Boolean(storedStopCoords(stop) && stop.city?.trim() && stop.country?.trim());
}

/**
 * Confident places skip the prompt. Ambiguous names ask. An unknown name
 * asks the user to edit. Never treat a miss as a place we can save.
 */
export function gateForValidation(
  result: PlaceValidationBody,
  typedName: string
): PlaceGate {
  if (result.ok && result.validated && Number.isFinite(result.validated.lat)) {
    return { type: 'confident', place: result.validated };
  }
  const candidates = (result.candidates ?? []).filter((c) => Number.isFinite(c.lat)).slice(0, 3);
  if (result.ambiguous && candidates.length > 0) {
    return { type: 'choose', candidates };
  }
  const label = typedName.trim() || 'that place';
  return {
    type: 'edit',
    message: `We couldn't find "${label}". Edit the name and try again.`,
  };
}

type PickedSuggestion = {
  label: string;
  city: string;
  region?: string;
  country: string;
  lat: number;
  lng: number;
  storable: boolean;
};

/**
 * A picked dropdown row is written with the same fields as a confirmed place.
 * A non-storable row only fills the text. Its coordinates are never saved.
 */
export function stopFromPickedSuggestion(stop: TripStop, suggestion: PickedSuggestion): TripStop {
  if (!suggestion.storable) {
    return {
      ...stop,
      destination: suggestion.label,
      city: undefined,
      country: undefined,
      lat: undefined,
      lng: undefined,
    };
  }
  return applyConfirmedPlace(stop, {
    place: suggestion.city,
    name: suggestion.city,
    country: suggestion.country,
    state: suggestion.region,
    lat: suggestion.lat,
    lng: suggestion.lng,
  });
}

/** Write the confirmed city, country, coordinates, and display name onto a stop. */
export function applyConfirmedPlace(stop: TripStop, place: ValidatedPlace): TripStop {
  const city = (place.name || place.place).split(',')[0]?.trim() || place.place;
  const region =
    place.state?.trim() &&
    place.state.trim().toLowerCase() !== city.toLowerCase()
      ? place.state.trim()
      : undefined;
  const country = place.country.trim();
  const destination = [city, region, country].filter(Boolean).join(', ');
  return {
    ...stop,
    city,
    country,
    lat: place.lat,
    lng: place.lng,
    destination,
  };
}
