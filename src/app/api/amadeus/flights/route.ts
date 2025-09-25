import { NextRequest, NextResponse } from 'next/server';
import { searchFlights, transformFlightData, checkAmadeusConfig } from '@/lib/amadeus';
import { cache } from '@/lib/cache';

// Flight search parameters interface
interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
}

export async function POST(request: NextRequest) {
  try {
    let params: FlightSearchParams;
    try {
      params = await request.json();
    } catch (jsonError) {
      console.error('Invalid JSON in flight search request:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Validate required parameters
    if (!params.originLocationCode || !params.destinationLocationCode || !params.departureDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: originLocationCode, destinationLocationCode, departureDate' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `flights_${params.originLocationCode}_${params.destinationLocationCode}_${params.departureDate}_${params.adults}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      console.log('🎯 Cache hit for flight search:', cacheKey);
      return NextResponse.json({
        flights: cachedResult.flights,
        count: cachedResult.count,
        searchParams: params,
        source: 'cache',
        cached: true
      });
    }

    // Check if Amadeus is configured
    const isAmadeusConfigured = checkAmadeusConfig();
    
    let flights;
    let source = 'fallback';
    
    if (isAmadeusConfigured) {
      try {
        console.log('🔍 Searching flights with Amadeus API...');
        const amadeusFlights = await searchFlights(params);
        
        if (amadeusFlights && amadeusFlights.length > 0) {
          flights = transformFlightData(amadeusFlights);
          source = 'amadeus';
          console.log('✅ Amadeus flight search successful:', flights.length, 'results');
        } else {
          console.log('⚠️ Amadeus returned no flights, using fallback data');
          flights = generateFallbackFlights(params);
        }
      } catch (amadeusError) {
        console.log('❌ Amadeus flight search failed, using fallback data:', amadeusError);
        flights = generateFallbackFlights(params);
      }
    } else {
      console.log('⚠️ Amadeus not configured, using fallback data');
      flights = generateFallbackFlights(params);
    }
    
    return NextResponse.json({ 
      flights,
      count: flights.length,
      searchParams: params,
      source: flights.length > 0 && flights[0].id?.includes('fallback') ? 'fallback' : 'amadeus'
    });
    
  } catch (error) {
    console.error('Flight Search API Error:', error);
    // Create default params if parsing failed
    const fallbackParams: FlightSearchParams = {
      originLocationCode: 'YVR',
      destinationLocationCode: 'MAD',
      departureDate: new Date().toISOString().split('T')[0],
      adults: 1
    };
    const fallbackFlights = generateFallbackFlights(fallbackParams);
    return NextResponse.json({ 
      flights: fallbackFlights,
      count: fallbackFlights.length,
      searchParams: fallbackParams,
      source: 'fallback',
      error: 'API temporarily unavailable'
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: FlightSearchParams = {
      originLocationCode: searchParams.get('origin') || '',
      destinationLocationCode: searchParams.get('destination') || '',
      departureDate: searchParams.get('departureDate') || '',
      returnDate: searchParams.get('returnDate') || undefined,
      adults: parseInt(searchParams.get('adults') || '1'),
      children: parseInt(searchParams.get('children') || '0'),
      infants: parseInt(searchParams.get('infants') || '0'),
      travelClass: searchParams.get('travelClass') || 'ECONOMY',
      currencyCode: searchParams.get('currencyCode') || 'USD',
      max: parseInt(searchParams.get('max') || '50')
    };

    // Validate required parameters
    if (!params.originLocationCode || !params.destinationLocationCode || !params.departureDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: origin, destination, departureDate' },
        { status: 400 }
      );
    }

    // Search flights using Amadeus with fallback
    let flights;
    try {
      flights = await searchFlights(params);
      
      // If API returns empty results, use fallback
      if (!flights || flights.length === 0) {
        console.log('Amadeus returned no flights, using fallback data');
        flights = generateFallbackFlights(params);
      }
    } catch (amadeusError) {
      console.log('Amadeus flight search failed, using fallback data:', amadeusError);
      flights = generateFallbackFlights(params);
    }
    
    return NextResponse.json({ 
      flights,
      count: flights.length,
      searchParams: params,
      source: flights.length > 0 && flights[0].id?.includes('fallback') ? 'fallback' : 'amadeus'
    });
    
  } catch (error) {
    console.error('Flight Search API Error:', error);
    // Create default params if URL parsing failed
    const fallbackParams: FlightSearchParams = {
      originLocationCode: 'YVR',
      destinationLocationCode: 'MAD',
      departureDate: new Date().toISOString().split('T')[0],
      adults: 1
    };
    const fallbackFlights = generateFallbackFlights(fallbackParams);
    return NextResponse.json({ 
      flights: fallbackFlights,
      count: fallbackFlights.length,
      searchParams: fallbackParams,
      source: 'fallback',
      error: 'API temporarily unavailable'
    });
  }
}

function generateFallbackFlights(params: FlightSearchParams) {
  const basePrice = 800 + Math.floor(Math.random() * 600);
  
  return [
    {
      id: 'fallback_1',
      itineraries: [{
        duration: 'PT12H30M',
        segments: [{
          departure: {
            iataCode: params.originLocationCode || 'YVR',
            at: '2025-10-15T08:30:00'
          },
          arrival: {
            iataCode: params.destinationLocationCode || 'MAD',
            at: '2025-10-15T21:00:00'
          },
          carrierCode: 'AC',
          number: '837',
          aircraft: { code: '789' },
          numberOfStops: 0,
          duration: 'PT12H30M'
        }]
      }],
      price: {
        currency: 'USD',
        total: basePrice.toString(),
        base: (basePrice * 0.85).toString(),
        grandTotal: basePrice.toString()
      }
    },
    {
      id: 'fallback_2',
      itineraries: [{
        duration: 'PT16H45M',
        segments: [{
          departure: {
            iataCode: params.originLocationCode || 'YVR',
            at: '2025-10-15T14:20:00'
          },
          arrival: {
            iataCode: params.destinationLocationCode || 'MAD',
            at: '2025-10-16T13:05:00'
          },
          carrierCode: 'LH',
          number: '492',
          aircraft: { code: '359' },
          numberOfStops: 1,
          duration: 'PT16H45M'
        }]
      }],
      price: {
        currency: 'USD',
        total: (basePrice - 150).toString(),
        base: ((basePrice - 150) * 0.85).toString(),
        grandTotal: (basePrice - 150).toString()
      }
    },
    {
      id: 'fallback_3',
      itineraries: [{
        duration: 'PT14H15M',
        segments: [{
          departure: {
            iataCode: params.originLocationCode || 'YVR',
            at: '2025-10-15T10:15:00'
          },
          arrival: {
            iataCode: params.destinationLocationCode || 'MAD',
            at: '2025-10-16T08:30:00'
          },
          carrierCode: 'KL',
          number: '681',
          aircraft: { code: '77W' },
          numberOfStops: 1,
          duration: 'PT14H15M'
        }]
      }],
      price: {
        currency: 'USD',
        total: (basePrice + 100).toString(),
        base: ((basePrice + 100) * 0.85).toString(),
        grandTotal: (basePrice + 100).toString()
      }
    }
  ];
}
