import Amadeus from 'amadeus';

let amadeus: any = null;

function getAmadeusClient(): any {
  if (!amadeus && checkAmadeusConfig()) {
    try {
      amadeus = new Amadeus({
        clientId: process.env.AMADEUS_CLIENT_ID!,
        clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
        hostname: process.env.AMADEUS_ENVIRONMENT === 'production' ? 'production' : 'test',
      });
    } catch (error) {
      console.error('Failed to initialize Amadeus client:', error);
      return null;
    }
  }
  return amadeus;
}

// Simple in-memory rate limiter
let requestCount = 0;
let lastResetTime = Date.now();

const checkRateLimit = () => {
  const now = Date.now();
  if (now - lastResetTime > 1000) {
    requestCount = 0;
    lastResetTime = now;
  }
  if (requestCount >= 10) {
    throw new Error('Rate limit exceeded. Please try again in a moment.');
  }
  requestCount++;
};

// ─── FLIGHTS ────────────────────────────────────────────────────────────────

export async function searchFlights(params: {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  max?: number;
  currencyCode?: string;
}) {
  checkRateLimit();
  const client = getAmadeusClient();
  if (!client) throw new Error('Amadeus client not configured');

  console.log('🔍 Searching flights:', params.originLocationCode, '→', params.destinationLocationCode);

  const searchParams: Record<string, any> = {
    originLocationCode: params.originLocationCode,
    destinationLocationCode: params.destinationLocationCode,
    departureDate: params.departureDate,
    adults: params.adults,
    travelClass: params.travelClass || 'ECONOMY',
    max: params.max || 10,
    currencyCode: params.currencyCode || 'USD',
  };

  if (params.returnDate) searchParams.returnDate = params.returnDate;
  if (params.children) searchParams.children = params.children;
  if (params.infants) searchParams.infants = params.infants;

  try {
    const response = await (client.shopping.flightOffersSearch as any).get(searchParams);
    console.log('✅ Amadeus flights:', response.data?.length, 'results');
    return response.data ?? [];
  } catch (error: any) {
    console.error('❌ Amadeus flight error:', error?.response?.result ?? error?.message);
    if (error?.response?.statusCode === 401) throw new Error('Invalid Amadeus credentials');
    if (error?.response?.statusCode === 429) throw new Error('Amadeus rate limit exceeded');
    throw new Error(`Amadeus flight search failed: ${error?.message}`);
  }
}

// ─── HOTELS (v3 API - replaces deprecated hotelOffers endpoint) ──────────────

/**
 * Step 1: Get hotel IDs for a city
 * Uses the Hotel List API (v1) which is available on free tier
 */
export async function searchHotelIds(params: {
  cityCode: string;
  ratings?: string[];
  amenities?: string[];
}) {
  checkRateLimit();
  const client = getAmadeusClient();
  if (!client) throw new Error('Amadeus client not configured');

  console.log('🏨 Getting hotel list for:', params.cityCode);

  try {
    const searchParams: Record<string, any> = {
      cityCode: params.cityCode,
    };
    if (params.ratings?.length) searchParams.ratings = params.ratings.join(',');
    if (params.amenities?.length) searchParams.amenities = params.amenities.join(',');

    const response = await (client.referenceData.locations.hotels.byCity as any).get(searchParams);
    console.log('✅ Hotel list:', response.data?.length, 'hotels found');
    return (response.data ?? []).slice(0, 20).map((h: any) => h.hotelId);
  } catch (error: any) {
    console.error('❌ Hotel list error:', error?.response?.result ?? error?.message);
    throw new Error(`Hotel list search failed: ${error?.message}`);
  }
}

/**
 * Step 2: Get offers for specific hotel IDs
 * Uses the Hotel Offers API v3 (current, replaces deprecated endpoint)
 */
export async function searchHotelOffers(params: {
  hotelIds: string[];
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  rooms?: number;
  currencyCode?: string;
}) {
  checkRateLimit();
  const client = getAmadeusClient();
  if (!client) throw new Error('Amadeus client not configured');

  console.log('💰 Getting hotel offers for', params.hotelIds.length, 'hotels');

  try {
    const response = await (client.shopping.hotelOffersSearch as any).get({
      hotelIds: params.hotelIds.join(','),
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: params.adults,
      roomQuantity: params.rooms || 1,
      currency: params.currencyCode || 'USD',
      bestRateOnly: true,
    });
    console.log('✅ Hotel offers:', response.data?.length, 'results');
    return response.data ?? [];
  } catch (error: any) {
    console.error('❌ Hotel offers error:', error?.response?.result ?? error?.message);
    throw new Error(`Hotel offers search failed: ${error?.message}`);
  }
}

/**
 * Combined hotel search: city → hotel IDs → offers
 */
export async function searchHotels(params: {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  rooms?: number;
  ratings?: string[];
  amenities?: string[];
  currencyCode?: string;
}) {
  const hotelIds = await searchHotelIds({
    cityCode: params.cityCode,
    ratings: params.ratings,
    amenities: params.amenities,
  });

  if (!hotelIds.length) {
    console.warn('No hotels found for city:', params.cityCode);
    return [];
  }

  const offers = await searchHotelOffers({
    hotelIds: hotelIds.slice(0, 10),
    checkInDate: params.checkInDate,
    checkOutDate: params.checkOutDate,
    adults: params.adults,
    rooms: params.rooms,
    currencyCode: params.currencyCode,
  });

  return offers;
}

// ─── LOCATIONS ───────────────────────────────────────────────────────────────

export async function searchLocations(keyword: string) {
  checkRateLimit();
  const client = getAmadeusClient();
  if (!client) throw new Error('Amadeus client not configured');

  try {
    const response = await (client.referenceData.locations as any).get({
      keyword,
      subType: 'AIRPORT,CITY',
    });
    return response.data ?? [];
  } catch (error: any) {
    console.error('❌ Location search error:', error?.message);
    throw new Error(`Location search failed: ${error?.message}`);
  }
}

// ─── DATA TRANSFORMERS ───────────────────────────────────────────────────────

export function transformFlightData(amadeusFlights: any[]) {
  return amadeusFlights.map((offer) => {
    const outbound = offer.itineraries[0];
    const firstSeg = outbound.segments[0];
    const lastSeg = outbound.segments[outbound.segments.length - 1];
    const price = parseFloat(offer.price.grandTotal ?? offer.price.total);
    const stops = outbound.segments.length - 1;

    const dur = outbound.duration?.replace('PT', '').replace('H', 'h ').replace('M', 'm').trim() ?? '';

    return {
      id: `amadeus_${offer.id}`,
      summary: `${firstSeg.departure.iataCode} → ${lastSeg.arrival.iataCode} (${stops === 0 ? 'nonstop' : `${stops} stop`}) • ${dur}`,
      airline: firstSeg.carrierCode,
      price: Math.round(price),
      currency: offer.price.currency ?? 'USD',
      departure: firstSeg.departure.at,
      arrival: lastSeg.arrival.at,
      stops,
      duration: dur,
      segments: outbound.segments,
      partnerUrl: `https://www.google.com/flights#search;f=${firstSeg.departure.iataCode};t=${lastSeg.arrival.iataCode};d=${firstSeg.departure.at.split('T')[0]};tt=r`,
      amadeusOffer: offer,
    };
  });
}

export function transformHotelData(amadeusHotels: any[]) {
  return amadeusHotels.map((item) => {
    const hotel = item.hotel ?? item;
    const offer = item.offers?.[0];
    const price = offer ? parseFloat(offer.price.total ?? offer.price.base ?? '0') : 0;

    const checkIn = offer?.checkInDate ?? '';
    const checkOut = offer?.checkOutDate ?? '';
    const nights = checkIn && checkOut
      ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
      : 1;

    return {
      id: `amadeus_${hotel.hotelId}`,
      name: hotel.name ?? 'Hotel',
      rating: hotel.rating ? parseFloat(hotel.rating) : 4.0,
      stars: hotel.rating ? Math.round(parseFloat(hotel.rating)) : 4,
      pricePerNight: price ? Math.round(price / nights) : 0,
      totalPrice: Math.round(price),
      currency: offer?.price?.currency ?? 'USD',
      area: hotel.address?.cityName ?? hotel.cityCode ?? '',
      address: [hotel.address?.lines?.[0], hotel.address?.cityName].filter(Boolean).join(', '),
      amenities: hotel.amenities ?? ['Free WiFi'],
      description: hotel.description?.text ?? `${hotel.name} in ${hotel.address?.cityName ?? ''}`,
      partnerUrl: `https://www.booking.com/search.html?ss=${encodeURIComponent(hotel.name ?? '')}`,
      amadeusData: item,
    };
  });
}

// ─── CONFIG CHECK ─────────────────────────────────────────────────────────────

export function checkAmadeusConfig(): boolean {
  const ok = !!(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
  if (!ok) {
    console.log('⚠️  Amadeus not configured — add AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET to .env.local');
  }
  return ok;
}

export { getAmadeusClient };