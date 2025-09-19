// Affiliate link builder and UTM tracking system

export interface AffiliateConfig {
  provider: string;
  baseUrl: string;
  affiliateId?: string;
  trackingParams: Record<string, string>;
  commission?: {
    rate: number;
    type: 'percentage' | 'fixed';
  };
}

export interface LinkParams {
  provider: string;
  productType: 'flight' | 'hotel' | 'car' | 'activity' | 'insurance';
  origin?: string;
  destination?: string;
  dates?: {
    departure: string;
    return?: string;
  };
  travelers?: {
    adults: number;
    children?: number;
  };
  customParams?: Record<string, string>;
}

// Affiliate program configurations
const AFFILIATE_CONFIGS: Record<string, AffiliateConfig> = {
  // Flight booking sites
  expedia: {
    provider: 'Expedia',
    baseUrl: 'https://www.expedia.com',
    affiliateId: process.env.EXPEDIA_AFFILIATE_ID || 'demo_affiliate',
    trackingParams: {
      'affiliate': process.env.EXPEDIA_AFFILIATE_ID || 'demo_affiliate',
      'utm_source': 'where-next-ai',
      'utm_medium': 'affiliate',
      'utm_campaign': 'flight_booking'
    },
    commission: { rate: 4, type: 'percentage' }
  },
  
  booking: {
    provider: 'Booking.com',
    baseUrl: 'https://www.booking.com',
    affiliateId: process.env.BOOKING_AFFILIATE_ID || 'demo_affiliate',
    trackingParams: {
      'aid': process.env.BOOKING_AFFILIATE_ID || 'demo_affiliate',
      'utm_source': 'where-next-ai',
      'utm_medium': 'affiliate',
      'utm_campaign': 'hotel_booking'
    },
    commission: { rate: 25, type: 'fixed' }
  },

  kayak: {
    provider: 'Kayak',
    baseUrl: 'https://www.kayak.com',
    trackingParams: {
      'utm_source': 'where-next-ai',
      'utm_medium': 'affiliate',
      'utm_campaign': 'flight_search'
    },
    commission: { rate: 2, type: 'percentage' }
  },

  skyscanner: {
    provider: 'Skyscanner',
    baseUrl: 'https://www.skyscanner.com',
    trackingParams: {
      'utm_source': 'where-next-ai',
      'utm_medium': 'affiliate',
      'utm_campaign': 'flight_comparison'
    },
    commission: { rate: 1.5, type: 'percentage' }
  },

  agoda: {
    provider: 'Agoda',
    baseUrl: 'https://www.agoda.com',
    affiliateId: process.env.AGODA_AFFILIATE_ID || 'demo_affiliate',
    trackingParams: {
      'cid': process.env.AGODA_AFFILIATE_ID || 'demo_affiliate',
      'utm_source': 'where-next-ai',
      'utm_medium': 'affiliate'
    },
    commission: { rate: 20, type: 'fixed' }
  },

  rentalcars: {
    provider: 'RentalCars.com',
    baseUrl: 'https://www.rentalcars.com',
    affiliateId: process.env.RENTALCARS_AFFILIATE_ID || 'demo_affiliate',
    trackingParams: {
      'affiliateCode': process.env.RENTALCARS_AFFILIATE_ID || 'demo_affiliate',
      'utm_source': 'where-next-ai',
      'utm_medium': 'affiliate'
    },
    commission: { rate: 15, type: 'fixed' }
  }
};

// Check if affiliate links are enabled
const AFFILIATES_ENABLED = process.env.AFFILIATES_ENABLED === 'true' || process.env.NODE_ENV === 'development';

export function buildAffiliateLink(params: LinkParams): string {
  if (!AFFILIATES_ENABLED) {
    // Return direct booking link without affiliate params
    return buildDirectLink(params);
  }

  const config = AFFILIATE_CONFIGS[params.provider];
  if (!config) {
    console.warn(`No affiliate config found for provider: ${params.provider}`);
    return buildDirectLink(params);
  }

  // Build base URL with path
  let url = new URL(config.baseUrl);
  
  // Add provider-specific paths and parameters
  switch (params.provider) {
    case 'expedia':
      url = buildExpediaLink(url, params, config);
      break;
    case 'booking':
      url = buildBookingLink(url, params, config);
      break;
    case 'kayak':
      url = buildKayakLink(url, params, config);
      break;
    case 'skyscanner':
      url = buildSkyscannerLink(url, params, config);
      break;
    case 'agoda':
      url = buildAgodaLink(url, params, config);
      break;
    case 'rentalcars':
      url = buildRentalCarsLink(url, params, config);
      break;
    default:
      url = buildGenericLink(url, params, config);
  }

  // Add UTM and affiliate tracking parameters
  Object.entries(config.trackingParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  // Add custom parameters
  if (params.customParams) {
    Object.entries(params.customParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

function buildExpediaLink(url: URL, params: LinkParams, config: AffiliateConfig): URL {
  if (params.productType === 'flight') {
    url.pathname = '/Flights';
    if (params.origin) url.searchParams.set('flight-type', 'on');
    if (params.origin) url.searchParams.set('startsearch', 'true');
    if (params.origin && params.destination) {
      url.searchParams.set('trip', params.dates?.return ? 'roundtrip' : 'oneway');
    }
  } else if (params.productType === 'hotel') {
    url.pathname = '/Hotels';
    if (params.destination) url.searchParams.set('destination', params.destination);
  }
  return url;
}

function buildBookingLink(url: URL, params: LinkParams, config: AffiliateConfig): URL {
  if (params.productType === 'hotel') {
    url.pathname = '/searchresults.html';
    if (params.destination) url.searchParams.set('ss', params.destination);
    if (params.dates?.departure) url.searchParams.set('checkin', params.dates.departure);
    if (params.dates?.return) url.searchParams.set('checkout', params.dates.return);
    if (params.travelers?.adults) url.searchParams.set('group_adults', params.travelers.adults.toString());
  }
  return url;
}

function buildKayakLink(url: URL, params: LinkParams, config: AffiliateConfig): URL {
  if (params.productType === 'flight') {
    url.pathname = '/flights';
    if (params.origin && params.destination) {
      const path = `/${params.origin}-${params.destination}`;
      if (params.dates?.departure) {
        const departDate = params.dates.departure.replace(/-/g, '');
        const returnDate = params.dates?.return?.replace(/-/g, '') || '';
        url.pathname += `${path}/${departDate}${returnDate ? `/${returnDate}` : ''}`;
      }
    }
  }
  return url;
}

function buildSkyscannerLink(url: URL, params: LinkParams, config: AffiliateConfig): URL {
  if (params.productType === 'flight') {
    url.pathname = '/transport/flights';
    if (params.origin && params.destination && params.dates?.departure) {
      const departDate = params.dates.departure.replace(/-/g, '').substring(2); // YYMMDD format
      const returnDate = params.dates?.return?.replace(/-/g, '').substring(2) || '';
      url.pathname += `/${params.origin}/${params.destination}/${departDate}${returnDate ? `/${returnDate}` : ''}`;
    }
  }
  return url;
}

function buildAgodaLink(url: URL, params: LinkParams, config: AffiliateConfig): URL {
  if (params.productType === 'hotel') {
    url.pathname = '/search';
    if (params.destination) url.searchParams.set('city', params.destination);
    if (params.dates?.departure) url.searchParams.set('checkIn', params.dates.departure);
    if (params.dates?.return) url.searchParams.set('checkOut', params.dates.return);
  }
  return url;
}

function buildRentalCarsLink(url: URL, params: LinkParams, config: AffiliateConfig): URL {
  if (params.productType === 'car') {
    url.pathname = '/SearchResults';
    if (params.destination) url.searchParams.set('dropLocation', params.destination);
    if (params.dates?.departure) url.searchParams.set('pickUpDate', params.dates.departure);
    if (params.dates?.return) url.searchParams.set('dropOffDate', params.dates.return);
  }
  return url;
}

function buildGenericLink(url: URL, params: LinkParams, config: AffiliateConfig): URL {
  // Fallback for providers without specific implementations
  if (params.destination) url.searchParams.set('destination', params.destination);
  if (params.dates?.departure) url.searchParams.set('date', params.dates.departure);
  return url;
}

function buildDirectLink(params: LinkParams): string {
  // Non-affiliate fallback links
  const directUrls: Record<string, string> = {
    expedia: 'https://www.expedia.com',
    booking: 'https://www.booking.com',
    kayak: 'https://www.kayak.com',
    skyscanner: 'https://www.skyscanner.com',
    agoda: 'https://www.agoda.com',
    rentalcars: 'https://www.rentalcars.com'
  };
  
  return directUrls[params.provider] || 'https://www.google.com/travel';
}

// Helper function to get available providers for a product type
export function getProvidersForProduct(productType: LinkParams['productType']): string[] {
  const providers: Record<LinkParams['productType'], string[]> = {
    flight: ['expedia', 'kayak', 'skyscanner'],
    hotel: ['booking', 'expedia', 'agoda'],
    car: ['rentalcars', 'expedia'],
    activity: ['expedia'],
    insurance: []
  };
  
  return providers[productType] || [];
}

// Analytics tracking for affiliate clicks
export function trackAffiliateClick(params: LinkParams & { userId?: string }): void {
  try {
    // Log affiliate click for analytics
    console.log('🔗 Affiliate Click:', {
      provider: params.provider,
      productType: params.productType,
      destination: params.destination,
      userId: params.userId,
      timestamp: new Date().toISOString()
    });

    // Send to analytics service (Mixpanel, GA, etc.)
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track('affiliate_click', {
        provider: params.provider,
        product_type: params.productType,
        destination: params.destination,
        user_id: params.userId
      });
    }

    // Store for revenue tracking
    const clicks = JSON.parse(localStorage.getItem('affiliateClicks') || '[]');
    clicks.push({
      ...params,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId()
    });
    
    // Keep last 100 clicks
    if (clicks.length > 100) clicks.splice(0, clicks.length - 100);
    localStorage.setItem('affiliateClicks', JSON.stringify(clicks));
    
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
  }
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

// Revenue estimation
export function estimateCommission(provider: string, bookingValue: number): number {
  const config = AFFILIATE_CONFIGS[provider];
  if (!config?.commission) return 0;
  
  if (config.commission.type === 'percentage') {
    return (bookingValue * config.commission.rate) / 100;
  } else {
    return config.commission.rate;
  }
}
