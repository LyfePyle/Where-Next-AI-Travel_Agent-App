import { NextRequest, NextResponse } from 'next/server';
import { searchHotels, transformHotelData, checkAmadeusConfig } from '@/lib/amadeus';
import { cache } from '@/lib/cache';

// Hotel search parameters interface
interface HotelSearchParams {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  rooms?: number;
  ratings?: string[];
  amenities?: string[];
  priceRange?: string;
}

// Generate fallback hotel data
function generateFallbackHotels(params: HotelSearchParams) {
  const nights = Math.ceil((new Date(params.checkOutDate).getTime() - new Date(params.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
  const city = params.cityCode;
  
  return [
    {
      id: `fallback_hotel_1_${city}`,
      name: `Grand ${city} Hotel`,
      rating: 4.5,
      pricePerNight: 180,
      totalPrice: 180 * nights,
      area: 'City Center',
      amenities: ['Free WiFi', 'Pool', 'Gym', 'Restaurant', 'Room Service'],
      image: '/images/hotel-placeholder.jpg',
      description: `Luxurious hotel in the heart of ${city} with excellent amenities`
    },
    {
      id: `fallback_hotel_2_${city}`,
      name: `Budget Inn ${city}`,
      rating: 3.8,
      pricePerNight: 120,
      totalPrice: 120 * nights,
      area: 'Downtown',
      amenities: ['Free WiFi', 'Breakfast', 'Concierge'],
      image: '/images/hotel-placeholder.jpg',
      description: `Comfortable and affordable accommodation in ${city}`
    },
    {
      id: `fallback_hotel_3_${city}`,
      name: `Luxury ${city} Resort`,
      rating: 4.8,
      pricePerNight: 350,
      totalPrice: 350 * nights,
      area: 'Premium District',
      amenities: ['Free WiFi', 'Spa', 'Pool', 'Beach Access', 'Fine Dining', 'Valet Parking'],
      image: '/images/hotel-placeholder.jpg',
      description: `Ultra-luxury resort with world-class service in ${city}`
    }
  ];
}

export async function POST(request: NextRequest) {
  try {
    const params: HotelSearchParams = await request.json();
    
    // Validate required parameters
    if (!params.cityCode || !params.checkInDate || !params.checkOutDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: cityCode, checkInDate, checkOutDate' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `hotels_${params.cityCode}_${params.checkInDate}_${params.checkOutDate}_${params.adults}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      console.log('🎯 Cache hit for hotel search:', cacheKey);
      return NextResponse.json({
        hotels: cachedResult.hotels,
        count: cachedResult.count,
        searchParams: params,
        source: 'cache',
        cached: true
      });
    }

    // Check if Amadeus is configured
    const isAmadeusConfigured = checkAmadeusConfig();
    
    let hotels;
    let source = 'fallback';
    
    if (isAmadeusConfigured) {
      try {
        console.log('🏨 Searching hotels with Amadeus API...');
        const amadeusHotels = await searchHotels(params);
        
        if (amadeusHotels && amadeusHotels.length > 0) {
          hotels = transformHotelData(amadeusHotels);
          source = 'amadeus';
          console.log('✅ Amadeus hotel search successful:', hotels.length, 'results');
        } else {
          console.log('⚠️ Amadeus returned no hotels, using fallback data');
          hotels = generateFallbackHotels(params);
        }
      } catch (amadeusError) {
        console.log('❌ Amadeus hotel search failed, using fallback data:', amadeusError);
        hotels = generateFallbackHotels(params);
      }
    } else {
      console.log('⚠️ Amadeus not configured, using fallback data');
      hotels = generateFallbackHotels(params);
    }
    
    // Cache the results
    const result = {
      hotels,
      count: hotels.length,
      searchParams: params,
      source,
      timestamp: new Date().toISOString()
    };
    
    cache.set(cacheKey, result);
    console.log('💾 Cached hotel search results:', cacheKey);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Hotel Search API Error:', error);
    
    // Create default params if parsing failed
    const fallbackParams: HotelSearchParams = {
      cityCode: 'NYC',
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      adults: 1
    };
    
    const fallbackHotels = generateFallbackHotels(fallbackParams);
    return NextResponse.json({
      hotels: fallbackHotels,
      count: fallbackHotels.length,
      searchParams: fallbackParams,
      source: 'fallback',
      error: 'API temporarily unavailable'
    });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  try {
    const params: HotelSearchParams = {
      cityCode: searchParams.get('cityCode') || 'NYC',
      checkInDate: searchParams.get('checkInDate') || new Date().toISOString().split('T')[0],
      checkOutDate: searchParams.get('checkOutDate') || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      adults: parseInt(searchParams.get('adults') || '1'),
      rooms: searchParams.get('rooms') ? parseInt(searchParams.get('rooms')!) : undefined,
      ratings: searchParams.get('ratings')?.split(',') || undefined,
      amenities: searchParams.get('amenities')?.split(',') || undefined,
      priceRange: searchParams.get('priceRange') || undefined
    };

    // Check cache first
    const cacheKey = `hotels_${params.cityCode}_${params.checkInDate}_${params.checkOutDate}_${params.adults}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      console.log('🎯 Cache hit for hotel search (GET):', cacheKey);
      return NextResponse.json({
        hotels: cachedResult.hotels,
        count: cachedResult.count,
        searchParams: params,
        source: 'cache',
        cached: true
      });
    }

    // Check if Amadeus is configured
    const isAmadeusConfigured = checkAmadeusConfig();
    
    let hotels;
    let source = 'fallback';
    
    if (isAmadeusConfigured) {
      try {
        console.log('🏨 Searching hotels with Amadeus API (GET)...');
        const amadeusHotels = await searchHotels(params);
        
        if (amadeusHotels && amadeusHotels.length > 0) {
          hotels = transformHotelData(amadeusHotels);
          source = 'amadeus';
          console.log('✅ Amadeus hotel search successful (GET):', hotels.length, 'results');
        } else {
          console.log('⚠️ Amadeus returned no hotels, using fallback data');
          hotels = generateFallbackHotels(params);
        }
      } catch (amadeusError) {
        console.log('❌ Amadeus hotel search failed, using fallback data:', amadeusError);
        hotels = generateFallbackHotels(params);
      }
    } else {
      console.log('⚠️ Amadeus not configured, using fallback data');
      hotels = generateFallbackHotels(params);
    }
    
    // Cache the results
    const result = {
      hotels,
      count: hotels.length,
      searchParams: params,
      source,
      timestamp: new Date().toISOString()
    };
    
    cache.set(cacheKey, result);
    console.log('💾 Cached hotel search results (GET):', cacheKey);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Hotel Search API Error (GET):', error);
    
    const fallbackParams: HotelSearchParams = {
      cityCode: 'NYC',
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      adults: 1
    };
    
    const fallbackHotels = generateFallbackHotels(fallbackParams);
    return NextResponse.json({
      hotels: fallbackHotels,
      count: fallbackHotels.length,
      searchParams: fallbackParams,
      source: 'fallback',
      error: 'API temporarily unavailable'
    });
  }
}