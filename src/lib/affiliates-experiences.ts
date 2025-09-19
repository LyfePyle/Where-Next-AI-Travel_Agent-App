// Affiliate partners for tours and experiences with images

export interface ExperienceAffiliate {
  id: string;
  name: string;
  logo: string;
  description: string;
  baseUrl: string;
  affiliateId?: string;
  commission: {
    rate: number;
    type: 'percentage' | 'fixed';
  };
  specialties: string[];
  trustScore: number;
  sampleImages: string[];
}

export const EXPERIENCE_AFFILIATES: ExperienceAffiliate[] = [
  {
    id: 'viator',
    name: 'Viator',
    logo: '🏛️',
    description: 'World\'s largest tours and activities marketplace',
    baseUrl: 'https://www.viator.com',
    affiliateId: process.env.VIATOR_AFFILIATE_ID || 'demo_viator',
    commission: { rate: 8, type: 'percentage' },
    specialties: ['Walking Tours', 'Skip-the-Line', 'Food Tours', 'Cultural Experiences'],
    trustScore: 95,
    sampleImages: [
      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop'
    ]
  },
  {
    id: 'getyourguide',
    name: 'GetYourGuide',
    logo: '🎯',
    description: 'Book tours, attractions, and activities worldwide',
    baseUrl: 'https://www.getyourguide.com',
    affiliateId: process.env.GETYOURGUIDE_AFFILIATE_ID || 'demo_gyg',
    commission: { rate: 6, type: 'percentage' },
    specialties: ['Museums', 'Guided Tours', 'Day Trips', 'Adventure Activities'],
    trustScore: 92,
    sampleImages: [
      'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=300&fit=crop'
    ]
  },
  {
    id: 'airbnb_experiences',
    name: 'Airbnb Experiences',
    logo: '🏡',
    description: 'Unique local experiences hosted by locals',
    baseUrl: 'https://www.airbnb.com/s/experiences',
    affiliateId: process.env.AIRBNB_AFFILIATE_ID || 'demo_airbnb',
    commission: { rate: 3, type: 'percentage' },
    specialties: ['Local Hosts', 'Authentic Experiences', 'Small Groups', 'Hidden Gems'],
    trustScore: 88,
    sampleImages: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
    ]
  },
  {
    id: 'klook',
    name: 'Klook',
    logo: '🌏',
    description: 'Travel activities and experiences in Asia & beyond',
    baseUrl: 'https://www.klook.com',
    affiliateId: process.env.KLOOK_AFFILIATE_ID || 'demo_klook',
    commission: { rate: 5, type: 'percentage' },
    specialties: ['Asia Travel', 'Theme Parks', 'Transportation', 'Food Experiences'],
    trustScore: 90,
    sampleImages: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1580500099040-1f3b0d096c50?w=400&h=300&fit=crop'
    ]
  },
  {
    id: 'musement',
    name: 'Musement',
    logo: '🎭',
    description: 'Cultural activities and city experiences',
    baseUrl: 'https://www.musement.com',
    affiliateId: process.env.MUSEMENT_AFFILIATE_ID || 'demo_musement',
    commission: { rate: 7, type: 'percentage' },
    specialties: ['Museums', 'Shows', 'Cultural Tours', 'Art Experiences'],
    trustScore: 85,
    sampleImages: [
      'https://images.unsplash.com/photo-1460305037223-0051ebb9088b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1518479027903-23b2d6aaa203?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1573255737484-2fe22b128daf?w=400&h=300&fit=crop'
    ]
  },
  {
    id: 'tiqets',
    name: 'Tiqets',
    logo: '🎫',
    description: 'Last-minute tickets to museums, attractions & shows',
    baseUrl: 'https://www.tiqets.com',
    affiliateId: process.env.TIQETS_AFFILIATE_ID || 'demo_tiqets',
    commission: { rate: 6, type: 'percentage' },
    specialties: ['Last-minute', 'Mobile Tickets', 'Museums', 'Attractions'],
    trustScore: 87,
    sampleImages: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1564094331594-15edf5030a87?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1587816603732-3588270e3b9e?w=400&h=300&fit=crop'
    ]
  }
];

export interface ExperienceOption {
  id: string;
  affiliate: ExperienceAffiliate;
  title: string;
  description: string;
  price: number;
  duration: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  highlights: string[];
  includes: string[];
  cancellation: string;
}

export function buildExperienceAffiliateLink(
  affiliateId: string, 
  city: string, 
  category?: string
): string {
  const affiliate = EXPERIENCE_AFFILIATES.find(a => a.id === affiliateId);
  if (!affiliate) return '#';

  const url = new URL(affiliate.baseUrl);
  
  // Add search parameters
  url.searchParams.set('destination', city);
  if (category) url.searchParams.set('category', category);
  
  // Add affiliate tracking
  if (affiliate.affiliateId) {
    url.searchParams.set('affiliate', affiliate.affiliateId);
  }
  
  // Add UTM parameters
  url.searchParams.set('utm_source', 'where-next-ai');
  url.searchParams.set('utm_medium', 'affiliate');
  url.searchParams.set('utm_campaign', 'experience_booking');
  url.searchParams.set('utm_content', affiliateId);

  return url.toString();
}

export function generateExperienceOptions(city: string, theme: string): ExperienceOption[] {
  const themeMapping: Record<string, string[]> = {
    cultural: ['Museums', 'Historical Tours', 'Art Galleries', 'Architecture Tours'],
    food: ['Food Tours', 'Cooking Classes', 'Wine Tasting', 'Market Tours'],
    nature: ['Nature Walks', 'Garden Tours', 'Outdoor Adventures', 'Scenic Tours'],
    shopping: ['Shopping Tours', 'Market Visits', 'Artisan Workshops', 'Local Crafts'],
    photography: ['Photo Tours', 'Sunset Walks', 'Architecture Photography', 'Street Photography'],
    nightlife: ['Evening Tours', 'Bar Crawls', 'Night Markets', 'Entertainment Shows'],
    architecture: ['Architecture Tours', 'Building Tours', 'Design Walks', 'Historic Sites'],
    art: ['Art Tours', 'Gallery Visits', 'Street Art Tours', 'Artist Studios']
  };

  const themeActivities = themeMapping[theme] || ['City Tours', 'Sightseeing', 'Local Experiences'];
  
  return EXPERIENCE_AFFILIATES.map((affiliate, index) => ({
    id: `${affiliate.id}_${index}`,
    affiliate,
    title: `${themeActivities[index % themeActivities.length]} in ${city}`,
    description: `Discover ${city} with our expert ${affiliate.specialties[0].toLowerCase()}. ${affiliate.description}`,
    price: 25 + (index * 15) + Math.floor(Math.random() * 50),
    duration: `${2 + index}h`,
    rating: 4.2 + (Math.random() * 0.7),
    reviewCount: 50 + Math.floor(Math.random() * 500),
    imageUrl: affiliate.sampleImages[index % affiliate.sampleImages.length],
    highlights: [
      'Expert local guide',
      'Small group experience',
      'Skip-the-line access',
      'Photo opportunities'
    ].slice(0, 2 + (index % 3)),
    includes: [
      'Professional guide',
      'All entrance fees',
      'Small group (max 15 people)',
      'Audio headsets'
    ].slice(0, 2 + (index % 3)),
    cancellation: index % 2 === 0 ? 'Free cancellation up to 24 hours' : 'Free cancellation up to 48 hours'
  }));
}

export function trackExperienceClick(affiliateId: string, city: string, theme: string): void {
  try {
    console.log('🎯 Experience Click:', { affiliateId, city, theme });
    
    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track('experience_affiliate_click', {
        affiliate_id: affiliateId,
        city,
        theme,
        timestamp: new Date().toISOString()
      });
    }

    // Store for tracking
    const clicks = JSON.parse(localStorage.getItem('experienceClicks') || '[]');
    clicks.push({
      affiliateId,
      city,
      theme,
      timestamp: new Date().toISOString()
    });
    
    if (clicks.length > 50) clicks.splice(0, clicks.length - 50);
    localStorage.setItem('experienceClicks', JSON.stringify(clicks));
    
  } catch (error) {
    console.error('Error tracking experience click:', error);
  }
}
