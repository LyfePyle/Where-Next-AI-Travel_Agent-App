/**
 * Stop photo lookup helpers for walking-tour stop detail.
 * Uses Unsplash CDN fallbacks (same pattern as curated-destinations) when live search misses.
 */

/** Search query: landmark + city for relevance (e.g. "Montmartre Paris"). */
export function buildStopPhotoQuery(
  stopName: string,
  city: string,
  _country?: string
): string {
  return [stopName.trim(), city.trim()].filter(Boolean).join(' ');
}

/**
 * Place hero query: city plus country (e.g. "Monteverde Costa Rica").
 * A bare or doubled place name ranks people and artworks that share the name.
 */
export function buildPlacePhotoQuery(city: string, country?: string): string {
  const place = city.trim();
  const region = country?.trim() ?? '';
  if (!place) return region;
  if (!region || place.toLowerCase().includes(region.toLowerCase())) return place;
  return `${place} ${region}`;
}

/** Wikipedia generator=search page cap — first 3 ranked results. */
export const WIKIPEDIA_SEARCH_LIMIT = 3;

const GENERIC_STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'company',
  'co',
  'inc',
  'llc',
  'restaurant',
  'cafe',
  'café',
  'bar',
  'shop',
  'store',
]);

export function distinctiveStopTokens(stopName: string): string[] {
  return stopName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !GENERIC_STOP_WORDS.has(t));
}

export function wikipediaTitleMatchesStop(title: string, stopName: string): boolean {
  const tokens = distinctiveStopTokens(stopName);
  if (tokens.length === 0) return true;
  const hay = title.toLowerCase();
  return tokens.some((tok) => hay.includes(tok));
}

export function isWikipediaListOrDisambiguation(title: string): boolean {
  const t = title.trim();
  return /^list of\b/i.test(t) || /disambiguation/i.test(t);
}

/** Wikidata short description used on disambiguation pages that omit the word. */
export function isWikipediaDisambiguationDescription(description?: string): boolean {
  return /topics referred to by the same term/i.test(description ?? '');
}

const PERSON_OR_ARTWORK_DESCRIPTION =
  /\b(born|filmmaker|film producer|actor|actress|singer|rapper|musician|painter|sculptor|artist)\b|\(\s*(?:born\s+)?\d{4}\s*[–-]\s*(?:\d{4}|present)\s*\)|\b(mural|painting|sculpture|artwork|studio album)\b/i;

const PERSON_OR_ARTWORK_CATEGORY =
  /\b(births|deaths|living people|painters|paintings|actors|actresses|musicians|sculptors|artworks|albums)\b/i;

/** People and artworks that share a place name (Lily Monteverde, the Dominical mural). */
export function isWikipediaPersonOrArtwork(page: {
  description?: string;
  categories?: Array<{ title?: string }>;
}): boolean {
  if (PERSON_OR_ARTWORK_DESCRIPTION.test(page.description ?? '')) return true;
  return (page.categories ?? []).some((category) =>
    PERSON_OR_ARTWORK_CATEGORY.test(category.title ?? '')
  );
}

export type WikipediaSearchPage = {
  title?: string;
  index?: number;
  description?: string;
  thumbnail?: { source?: string };
  categories?: Array<{ title?: string }>;
};

/**
 * First search-ranked page (of the first 3) that has a thumbnail and is about
 * the stop. List/disambiguation pages are skipped. Title matching avoids a
 * thumbnail-less list article promoting an unrelated later hit (e.g. 33 Acres
 * → "British Columbia Provincial Police").
 */
export function pickWikipediaThumbnail(
  pages: Record<string, WikipediaSearchPage> | undefined,
  stopName: string
): string | null {
  if (!pages) return null;

  const ordered = Object.values(pages)
    .sort((a, b) => (a.index ?? 999) - (b.index ?? 999))
    .slice(0, WIKIPEDIA_SEARCH_LIMIT);

  for (const page of ordered) {
    const source = page.thumbnail?.source;
    if (!source) continue;
    const title = page.title ?? '';
    if (isWikipediaListOrDisambiguation(title)) continue;
    if (isWikipediaDisambiguationDescription(page.description)) continue;
    if (isWikipediaPersonOrArtwork(page)) continue;
    if (!wikipediaTitleMatchesStop(title, stopName)) continue;
    return source;
  }
  return null;
}

export type StopPhotoSource = 'unsplash' | 'wikipedia' | 'placeholder';

/**
 * A real photo wins. When both searches miss, return no image so the UI can
 * show an empty frame instead of a generic stock photo.
 */
export function chooseStopPhoto(
  unsplashUrl: string | null,
  wikipediaUrl: string | null
): { imageUrl: string | null; source: StopPhotoSource } {
  if (unsplashUrl) return { imageUrl: unsplashUrl, source: 'unsplash' };
  if (wikipediaUrl) return { imageUrl: wikipediaUrl, source: 'wikipedia' };
  return { imageUrl: null, source: 'placeholder' };
}

/** Category-themed Unsplash URLs. The stop-photo route does not use these. */
const CATEGORY_FALLBACKS: Record<string, string> = {
  food: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop',
  scenic: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
  historic: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop',
  'kid-friendly':
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=400&fit=crop',
};

const DEFAULT_FALLBACK =
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=400&fit=crop';

export function categoryFallbackPhoto(categories?: string[]): string {
  if (categories?.length) {
    for (const cat of categories) {
      const url = CATEGORY_FALLBACKS[cat.toLowerCase()];
      if (url) return url;
    }
  }
  return DEFAULT_FALLBACK;
}

/** Normalize Unsplash API or CDN URLs to our standard crop dimensions. */
export function formatUnsplashUrl(rawUrl: string, w = 800, h = 400): string {
  if (!rawUrl.includes('unsplash.com')) return rawUrl;
  try {
    const u = new URL(rawUrl);
    u.searchParams.set('w', String(w));
    u.searchParams.set('h', String(h));
    u.searchParams.set('fit', 'crop');
    u.searchParams.set('auto', 'format');
    u.searchParams.set('q', '75');
    return u.toString();
  } catch {
    return rawUrl;
  }
}
