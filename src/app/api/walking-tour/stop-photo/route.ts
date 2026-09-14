import { NextRequest, NextResponse } from 'next/server';
import {
  buildStopPhotoQuery,
  categoryFallbackPhoto,
  formatUnsplashUrl,
  pickWikipediaThumbnail,
  WIKIPEDIA_SEARCH_LIMIT,
  type WikipediaSearchPage,
} from '@/lib/stop-photo';

export const dynamic = 'force-dynamic';

async function searchUnsplash(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
    {
      headers: { Authorization: `Client-ID ${key}` },
      next: { revalidate: 86400 },
    }
  );
  if (!res.ok) return null;

  const data = (await res.json()) as {
    results?: Array<{ urls?: { regular?: string } }>;
  };
  const url = data?.results?.[0]?.urls?.regular;
  return url ? formatUnsplashUrl(url) : null;
}

async function searchWikipedia(query: string, stopName: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: String(WIKIPEDIA_SEARCH_LIMIT),
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '800',
    format: 'json',
    origin: '*',
  });

  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    headers: {
      'User-Agent': 'WhereNextAI/1.0 (https://www.wherenextai.com; walking-tour stop-photo)',
      'Api-User-Agent': 'WhereNextAI/1.0 (https://www.wherenextai.com; walking-tour stop-photo)',
    },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    query?: { pages?: Record<string, WikipediaSearchPage> };
  };
  return pickWikipediaThumbnail(data?.query?.pages, stopName);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const stopName = sp.get('stop')?.trim() ?? '';
  const city = sp.get('city')?.trim() ?? '';
  const country = sp.get('country')?.trim() ?? '';
  const categories = sp.get('categories')?.split(',').filter(Boolean);

  if (!stopName || !city) {
    return NextResponse.json({ error: 'stop and city are required' }, { status: 400 });
  }

  const query = buildStopPhotoQuery(stopName, city, country);

  let imageUrl = await searchUnsplash(query);
  let source: 'unsplash' | 'wikipedia' | 'fallback' = 'fallback';

  if (imageUrl) {
    source = 'unsplash';
  } else {
    imageUrl = await searchWikipedia(`${stopName} ${city}`, stopName);
    if (!imageUrl && country) {
      imageUrl = await searchWikipedia(`${stopName} ${city} ${country}`, stopName);
    }
    if (imageUrl) {
      source = 'wikipedia';
    } else {
      imageUrl = categoryFallbackPhoto(categories);
      source = 'fallback';
    }
  }

  return NextResponse.json(
    { imageUrl, source, query },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
