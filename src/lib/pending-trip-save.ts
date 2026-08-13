/**
 * Persist a trip save attempt while the user signs in, then resume after auth.
 */

export const PENDING_TRIP_SAVE_KEY = 'wherenext_pending_trip_save';

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface PendingTripSavePayload {
  body: Record<string, unknown>;
  returnPath: string;
  createdAt: number;
}

export type ResumePendingTripSaveResult =
  | { status: 'none' }
  | { status: 'saved'; tripId: string; destination: string }
  | { status: 'error'; message: string };

let resumeInFlight: Promise<ResumePendingTripSaveResult> | null = null;

export function storePendingTripSave(
  payload: Omit<PendingTripSavePayload, 'createdAt'>
): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    PENDING_TRIP_SAVE_KEY,
    JSON.stringify({ ...payload, createdAt: Date.now() })
  );
}

export function getPendingTripSave(): PendingTripSavePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PENDING_TRIP_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingTripSavePayload;
    if (!parsed?.body || typeof parsed.returnPath !== 'string') {
      clearPendingTripSave();
      return null;
    }
    if (Date.now() - parsed.createdAt > MAX_AGE_MS) {
      clearPendingTripSave();
      return null;
    }
    return parsed;
  } catch {
    clearPendingTripSave();
    return null;
  }
}

export function clearPendingTripSave(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_TRIP_SAVE_KEY);
}

export function hasPendingTripSave(): boolean {
  return getPendingTripSave() !== null;
}

/** Store save payload and send the user to login with a return path. */
export function redirectToLoginForTripSave(
  returnPath: string,
  saveBody: Record<string, unknown>
): void {
  storePendingTripSave({ body: saveBody, returnPath });
  window.location.href = `/auth/login?redirectTo=${encodeURIComponent(returnPath)}`;
}

export async function resumePendingTripSave(): Promise<ResumePendingTripSaveResult> {
  const pending = getPendingTripSave();
  if (!pending) return { status: 'none' };

  try {
    const res = await fetch('/api/trips/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(pending.body),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      return { status: 'error', message: 'Authentication required' };
    }

    if (res.status === 409) {
      clearPendingTripSave();
      return {
        status: 'saved',
        tripId: '',
        destination: String(pending.body.destination ?? 'Trip'),
      };
    }

    if (!res.ok) {
      return {
        status: 'error',
        message: data.error || data.message || 'Failed to save trip',
      };
    }

    clearPendingTripSave();
    const tripId = typeof data.trip?.id === 'string' ? data.trip.id : '';
    return {
      status: 'saved',
      tripId,
      destination: String(pending.body.destination ?? data.trip?.destination ?? 'Trip'),
    };
  } catch {
    return { status: 'error', message: 'Network error while saving trip' };
  }
}

/** Dedupe concurrent resume attempts (login page + layout guard). */
export function resumePendingTripSaveOnce(): Promise<ResumePendingTripSaveResult> {
  if (!resumeInFlight) {
    resumeInFlight = resumePendingTripSave().finally(() => {
      resumeInFlight = null;
    });
  }
  return resumeInFlight;
}

export function destinationAfterPendingSave(result: ResumePendingTripSaveResult): string | null {
  if (result.status !== 'saved') return null;
  if (result.tripId) return `/my-trip/${result.tripId}?saved=1`;
  return '/saved?saved=1';
}
