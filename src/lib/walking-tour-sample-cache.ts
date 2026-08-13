import type { TourStop } from '@/hooks/useWalkingTour';

export type CachedTourSample = {
  title: string;
  summary?: string;
  stops: TourStop[];
  createdAt: number;
};

const CACHE_PREFIX = 'wherenext_walking_sample_';
/** 4h — avoids 6 AI calls on every revisit without stale content forever. */
const TTL_MS = 4 * 60 * 60 * 1000;

function cacheKey(city: string, country: string, preferences?: string) {
  const prefs = preferences?.trim().toLowerCase() || '';
  return `${CACHE_PREFIX}${city.toLowerCase()}|${country.toLowerCase()}|${prefs}`;
}

export function getCachedTourSample(
  city: string,
  country: string,
  preferences?: string
): CachedTourSample | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(cacheKey(city, country, preferences));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedTourSample;
    if (!parsed?.stops?.length || !parsed.title) return null;
    if (Date.now() - parsed.createdAt > TTL_MS) {
      sessionStorage.removeItem(cacheKey(city, country, preferences));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setCachedTourSample(
  city: string,
  country: string,
  sample: Omit<CachedTourSample, 'createdAt'>,
  preferences?: string
): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    cacheKey(city, country, preferences),
    JSON.stringify({ ...sample, createdAt: Date.now() })
  );
}
