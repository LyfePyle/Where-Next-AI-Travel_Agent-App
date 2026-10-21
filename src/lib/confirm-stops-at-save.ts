import {
  applyConfirmedPlace,
  gateForValidation,
  storedStopCoords,
  type PlaceValidationBody,
} from '@/lib/place-confirmation';
import { validatePlace } from '@/lib/validate-place';
import type { TripStop } from '@/types/trip';

/** Shared budget for every unpinned stop on one save. Lookups run together. */
const DEFAULT_BUDGET_MS = 4000;

export type StopValidator = (stop: TripStop) => Promise<PlaceValidationBody>;

function cityOf(stop: TripStop): string {
  return (stop.city || stop.destination.split(',')[0] || '').trim();
}

function wait(ms: number): { promise: Promise<null>; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout>;
  const promise = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  return {
    promise,
    cancel: () => clearTimeout(timer),
  };
}

async function validateWithOwnCountry(stop: TripStop): Promise<PlaceValidationBody> {
  return validatePlace(cityOf(stop), stop.country?.trim() || '');
}

/**
 * Fill coordinates for suggested cities that have none.
 * A confident match is stored. An ambiguous or failed lookup leaves the stop
 * as it was. A slow lookup is abandoned. Saving is never blocked.
 */
export async function confirmUnpinnedStops(
  stops: TripStop[],
  options?: { budgetMs?: number; validate?: StopValidator }
): Promise<TripStop[]> {
  const budgetMs = options?.budgetMs ?? DEFAULT_BUDGET_MS;
  const deadline = Date.now() + budgetMs;
  const validate = options?.validate ?? validateWithOwnCountry;

  try {
    return await Promise.all(
      stops.map(async (stop) => {
        if (storedStopCoords(stop)) return stop;
        const city = cityOf(stop);
        const country = stop.country?.trim() || '';
        if (!city || !country) return stop;
        const remaining = deadline - Date.now();
        if (remaining < 200) return stop;
        const timer = wait(remaining);
        try {
          const result = await Promise.race([validate(stop), timer.promise]);
          if (!result) return stop;
          const gate = gateForValidation(result, stop.destination || city);
          if (gate.type !== 'confident') return stop;
          return applyConfirmedPlace(stop, gate.place);
        } catch {
          return stop;
        } finally {
          timer.cancel();
        }
      })
    );
  } catch {
    return stops;
  }
}
