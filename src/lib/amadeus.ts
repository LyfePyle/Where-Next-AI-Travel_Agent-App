import Amadeus from 'amadeus';

// Lazy initialization of Amadeus client
let amadeus: Amadeus | null = null;

function getAmadeusClient(): Amadeus | null {
  if (!amadeus && checkAmadeusConfig()) {
    try {
      amadeus = new Amadeus({
        clientId: process.env.AMADEUS_CLIENT_ID!,
        clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
        environment: process.env.AMADEUS_ENVIRONMENT as 'test' | 'production' || 'test'
      });
    } catch (error) {
      console.error('Failed to initialize Amadeus client:', error);
      return null;
    }
  }
  return amadeus;
}

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerSecond: 10, // Amadeus allows 10 requests per second
  requestsPerMonth: 2000 // Free tier limit
};

let requestCount = 0;
let lastResetTime = Date.now();

// Simple rate limiter
const checkRateLimit = () => {
  const now = Date.now();
  
  // Reset counter every second
  if (now - lastResetTime > 1000) {
    requestCount = 0;
    lastResetTime = now;
  }
  
  if (requestCount >= RATE_LIMIT.requestsPerSecond) {
    throw new Error('Rate limit exceeded. Please try again in a moment.');
  }
  
  requestCount++;
};

// Flight search function
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
}) {
  try {
    checkRateLimit();
    
    const client = getAmadeusClient();
    if (!client) {
      throw new Error('Amadeus client not configured');
    }
    
    console.log('🔍 Searching flights with Amadeus API:', params);
    
    const response = await client.shopping.flightOffersSearch.get({
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.adults,
      children: params.children || 0,
      infants: params.infants || 0,
      travelClass: params.travelClass || 'ECONOMY',
      max: params.max || 10
    });

    console.log('✅ Amadeus flight search successful:', response.data.length, 'results');
    return response.data;
    
  } catch (error: any) {
    console.error('❌ Amadeus flight search error:', error);
    
    // Handle specific Amadeus errors
    if (error.code === 'NetworkError') {
      throw new Error('Network error connecting to Amadeus API');
    }
    
    if (error.response?.statusCode === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    if (error.response?.statusCode === 401) {
      throw new Error('Invalid Amadeus API credentials');
    }
    
    throw new Error(`Amadeus API error: ${error.message}`);
  }
}

// Hotel search function
export async function searchHotels(params: {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  rooms?: number;
  ratings?: string[];
  amenities?: string[];
  priceRange?: string;
  hotelSource?: string;
}) {
  try {
    checkRateLimit();
    
    const client = getAmadeusClient();
    if (!client) {
      throw new Error('Amadeus client not configured');
    }
    
    console.log('🏨 Searching hotels with Amadeus API:', params);
    
    const response = await client.shopping.hotelOffers.get({
      cityCode: params.cityCode,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: params.adults,
      rooms: params.rooms || 1,
      ratings: params.ratings,
      amenities: params.amenities,
      priceRange: params.priceRange,
      hotelSource: params.hotelSource
    });

    console.log('✅ Amadeus hotel search successful:', response.data.length, 'results');
    return response.data;
    
  } catch (error: any) {
    console.error('❌ Amadeus hotel search error:', error);
    
    // Handle specific errors
    if (error.response?.statusCode === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    if (error.response?.statusCode === 401) {
      throw new Error('Invalid Amadeus API credentials');
    }
    
    throw new Error(`Amadeus hotel API error: ${error.message}`);
  }
}

// Airport/City search for autocomplete
export async function searchLocations(keyword: string) {
  try {
    checkRateLimit();
    
    const client = getAmadeusClient();
    if (!client) {
      throw new Error('Amadeus client not configured');
    }
    
    console.log('📍 Searching locations with Amadeus API:', keyword);
    
    const response = await client.referenceData.locations.get({
      keyword: keyword,
      subType: 'AIRPORT,CITY'
    });

    console.log('✅ Amadeus location search successful:', response.data.length, 'results');
    return response.data;
    
  } catch (error: any) {
    console.error('❌ Amadeus location search error:', error);
    throw new Error(`Amadeus location API error: ${error.message}`);
  }
}

// Transform Amadeus flight data to our format
export function transformFlightData(amadeusFlights: any[]) {
  return amadeusFlights.map((offer, index) => {
    const segment = offer.itineraries[0].segments[0];
    const price = parseFloat(offer.price.total);
    
    return {
      id: `amadeus_${offer.id}`,
      airline: segment.carrierCode,
      price: Math.round(price),
      duration: offer.itineraries[0].duration,
      departure: segment.departure.at.split('T')[1].substring(0, 5),
      arrival: segment.arrival.at.split('T')[1].substring(0, 5),
      stops: offer.itineraries[0].segments.length - 1,
      aircraft: segment.aircraft?.code || 'Unknown',
      bookingClass: segment.cabin,
      validatingAirlineCodes: offer.validatingAirlineCodes,
      amadeusData: offer // Store original data for booking
    };
  });
}

// Transform Amadeus hotel data to our format
export function transformHotelData(amadeusHotels: any[]) {
  return amadeusHotels.map((hotel) => {
    const offer = hotel.offers[0];
    const price = parseFloat(offer.price.total);
    const nights = offer.checkOutDate && offer.checkInDate 
      ? Math.ceil((new Date(offer.checkOutDate).getTime() - new Date(offer.checkInDate).getTime()) / (1000 * 60 * 60 * 24))
      : 1;
    
    return {
      id: `amadeus_${hotel.hotel.hotelId}`,
      name: hotel.hotel.name,
      rating: hotel.hotel.rating || 4,
      pricePerNight: Math.round(price / nights),
      totalPrice: Math.round(price),
      area: hotel.hotel.address?.cityName || 'City Center',
      amenities: hotel.hotel.amenities || ['Free WiFi'],
      image: '/images/hotel-placeholder.jpg',
      description: hotel.hotel.description?.text || `Hotel in ${hotel.hotel.address?.cityName}`,
      amadeusData: hotel // Store original data for booking
    };
  });
}

// Configuration check
export function checkAmadeusConfig() {
  const hasClientId = !!process.env.AMADEUS_CLIENT_ID;
  const hasClientSecret = !!process.env.AMADEUS_CLIENT_SECRET;
  const environment = process.env.AMADEUS_ENVIRONMENT || 'test';
  
  console.log('Amadeus Configuration:', {
    hasClientId,
    hasClientSecret,
    environment,
    clientIdLength: process.env.AMADEUS_CLIENT_ID ? `${process.env.AMADEUS_CLIENT_ID.length} chars` : 'missing'
  });
  
  return hasClientId && hasClientSecret;
}

// Export client getter for external use
export { getAmadeusClient };