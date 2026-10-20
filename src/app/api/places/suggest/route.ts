import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import {
  mergePlaceSuggestions,
  photonSearchUrl,
  PLACE_SUGGEST_MIN_CHARS,
  suggestionsFromPhoton,
  type PhotonFeature,
  type PlaceBias,
  type PlaceSuggestion,
} from '@/lib/place-suggest';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 3 * 60 * 1000;
const CACHE_MAX = 200;
const suggestCache = new Map<string, { at: number; suggestions: PlaceSuggestion[] }>();

export function clearPlaceSuggestCache(): void {
  suggestCache.clear();
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}

function finiteCoord(value: string | null, max: number): number | null {
  if (value == null || value.trim() === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) > max) return null;
  return n;
}

function biasForRequest(req: NextRequest): PlaceBias | null {
  const lat = finiteCoord(req.nextUrl.searchParams.get('lat'), 90);
  const lng = finiteCoord(req.nextUrl.searchParams.get('lng'), 180);
  if (lat != null && lng != null) return { lat, lng };

  if (req.nextUrl.searchParams.get('ip') !== '1') return null;
  const ipLat = finiteCoord(req.headers.get('x-vercel-ip-latitude'), 90);
  const ipLng = finiteCoord(req.headers.get('x-vercel-ip-longitude'), 180);
  if (ipLat == null || ipLng == null) return null;
  return { lat: ipLat, lng: ipLng };
}

function cacheKey(query: string, bias: PlaceBias | null): string {
  const where = bias ? `${bias.lat.toFixed(1)},${bias.lng.toFixed(1)}` : '';
  return `${query.trim().toLowerCase()}|${where}`;
}

function readCache(key: string): PlaceSuggestion[] | null {
  const hit = suggestCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    suggestCache.delete(key);
    return null;
  }
  return hit.suggestions;
}

function writeCache(key: string, suggestions: PlaceSuggestion[]) {
  if (suggestCache.size >= CACHE_MAX) {
    const oldest = suggestCache.keys().next().value;
    if (oldest) suggestCache.delete(oldest);
  }
  suggestCache.set(key, { at: Date.now(), suggestions });
}

async function searchPhoton(query: string, bias: PlaceBias | null): Promise<PhotonFeature[]> {
  const res = await fetch(photonSearchUrl(query, bias), {
    cache: 'no-store',
    signal: AbortSignal.timeout(3000),
    headers: { 'User-Agent': 'WhereNextAI/1.0 (https://www.wherenextai.com; place suggest)' },
  });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = (await res.json()) as { features?: PhotonFeature[] };
  return data.features ?? [];
}

export async function GET(req: NextRequest) {
  const limit = rateLimit({
    key: `places-suggest:${clientIp(req)}`,
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { suggestions: [] },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const query = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length < PLACE_SUGGEST_MIN_CHARS) {
    return NextResponse.json({ suggestions: [] });
  }

  const bias = biasForRequest(req);
  const key = cacheKey(query, bias);
  const cached = readCache(key);
  if (cached) return NextResponse.json({ suggestions: cached });

  try {
    const suggestions = mergePlaceSuggestions(
      query,
      suggestionsFromPhoton(await searchPhoton(query, bias)),
      bias
    );
    writeCache(key, suggestions);
    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error('place suggest failed', err instanceof Error ? err.message : err);
    return NextResponse.json({ suggestions: [] });
  }
}
