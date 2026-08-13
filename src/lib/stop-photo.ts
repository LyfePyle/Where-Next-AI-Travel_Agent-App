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

/** Category-themed Unsplash fallbacks — matches existing static CDN usage elsewhere. */
const CATEGORY_FALLBACKS: Record<string, string> = {
  food: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&h=400&fit=crop',
  scenic: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
  historic: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop',
  'kid-friendly':
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop',
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
