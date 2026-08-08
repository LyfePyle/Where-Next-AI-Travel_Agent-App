/**
 * Static curated homepage destinations — generated once, no per-visit AI cost.
 * Matches the shape used on AI suggestion cards (highlights + itineraryTeaser + vibes).
 */
export interface CuratedDestination {
  id: string;
  destination: string;
  country: string;
  url: string;
  alt: string;
  highlights: string[];
  itineraryTeaser: string[];
  /** Values must match plan-trip VIBES (e.g. nature, adventure). */
  vibes: string[];
}

export const CURATED_DESTINATIONS: CuratedDestination[] = [
  {
    id: 'swiss-alps',
    destination: 'Swiss Alps',
    country: 'Switzerland',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop',
    alt: 'Snow-capped peaks above an alpine lake in the Swiss Alps',
    highlights: ['Matterhorn views', 'Alpine villages', 'Glacier Express'],
    itineraryTeaser: [
      'Day 1: Lucerne lake walk & chapel bridge',
      'Day 2: Jungfraujoch summit & ice palace',
      'Day 3: Zermatt village stroll & cable car',
    ],
    vibes: ['nature', 'adventure', 'hiking'],
  },
  {
    id: 'bali',
    destination: 'Bali, Indonesia',
    country: 'Indonesia',
    url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&h=600&fit=crop',
    alt: 'Tropical beach and palm trees in Bali',
    highlights: ['Ubud rice terraces', 'Tanah Lot temple', 'Seminyak beaches'],
    itineraryTeaser: [
      'Day 1: Ubud monkey forest & art market',
      'Day 2: Tegallalang terraces & waterfall',
      'Day 3: Uluwatu cliffs & sunset kecak dance',
    ],
    vibes: ['relaxing', 'spiritual', 'beach'],
  },
  {
    id: 'tokyo',
    destination: 'Tokyo, Japan',
    country: 'Japan',
    url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&h=600&fit=crop',
    alt: 'Tokyo cityscape at night with neon lights',
    highlights: ['Shibuya crossing', 'Tsukiji outer market', 'Senso-ji temple'],
    itineraryTeaser: [
      'Day 1: Asakusa & Senso-ji morning walk',
      'Day 2: Shibuya, Harajuku & Meiji Shrine',
      'Day 3: Tsukiji breakfast & Ginza stroll',
    ],
    vibes: ['city', 'foodie', 'cultural'],
  },
  {
    id: 'santorini',
    destination: 'Santorini, Greece',
    country: 'Greece',
    url: 'https://images.unsplash.com/photo-1570077186670-a43a3404a077?w=1200&h=600&fit=crop',
    alt: 'White buildings and blue domes in Santorini',
    highlights: ['Oia sunsets', 'Caldera views', 'Akrotiri ruins'],
    itineraryTeaser: [
      'Day 1: Fira caldera walk & wine tasting',
      'Day 2: Oia blue domes & amoudi bay',
      'Day 3: Red Beach swim & Akrotiri site',
    ],
    vibes: ['romantic', 'beach', 'photography'],
  },
  {
    id: 'iceland',
    destination: 'Iceland',
    country: 'Iceland',
    url: 'https://images.unsplash.com/photo-1531168556467-80abce272c35?w=1200&h=600&fit=crop',
    alt: 'Northern lights over an Icelandic landscape',
    highlights: ['Golden Circle', 'Blue Lagoon', 'Waterfall hikes'],
    itineraryTeaser: [
      'Day 1: Þingvellir, Geysir & Gullfoss loop',
      'Day 2: Seljalandsfoss & Skógafoss hike',
      'Day 3: Reykjavik food crawl & harbour walk',
    ],
    vibes: ['nature', 'adventure', 'photography'],
  },
  {
    id: 'morocco',
    destination: 'Morocco',
    country: 'Morocco',
    url: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200&h=600&fit=crop',
    alt: 'Desert dunes and camel caravan in Morocco',
    highlights: ['Marrakech medina', 'Sahara dunes', 'Chefchaouen blue city'],
    itineraryTeaser: [
      'Day 1: Marrakech souks & Jemaa el-Fna',
      'Day 2: Atlas Mountains day trip',
      'Day 3: Chefchaouen blue alleys & kasbah',
    ],
    vibes: ['cultural', 'adventure', 'foodie'],
  },
  {
    id: 'paris',
    destination: 'Paris, France',
    country: 'France',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=600&fit=crop',
    alt: 'Eiffel Tower and Paris rooftops at golden hour',
    highlights: ['Louvre & museums', 'Seine river walks', 'Montmartre views'],
    itineraryTeaser: [
      'Day 1: Latin Quarter stroll & river Seine',
      'Day 2: Louvre morning & Tuileries gardens',
      'Day 3: Montmartre & Sacré-Cœur sunset',
    ],
    vibes: ['romantic', 'cultural', 'foodie'],
  },
];

export function planTripHref(dest: CuratedDestination): string {
  const params = new URLSearchParams();
  params.set('destination', dest.destination);
  if (dest.vibes.length) {
    params.set('vibes', dest.vibes.join(','));
  }
  return `/plan-trip?${params.toString()}`;
}

/** Short labels for vibe chips on cards (subset of plan-trip VIBES). */
export const VIBE_LABELS: Record<string, string> = {
  adventure: '🏔 Adventure',
  relaxing: '🌊 Relaxing',
  cultural: '🏛 Cultural',
  foodie: '🍜 Foodie',
  romantic: '💕 Romantic',
  nature: '🌿 Nature',
  beach: '🏖 Beach',
  city: '🌆 City breaks',
  spiritual: '🧘 Spiritual',
  photography: '📷 Photography',
  hiking: '🥾 Hiking',
};
