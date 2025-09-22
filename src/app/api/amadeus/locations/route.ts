import { NextRequest, NextResponse } from 'next/server';
import { searchLocations, checkAmadeusConfig } from '@/lib/amadeus';
import { cache } from '@/lib/cache';

// Generate fallback location data
function generateFallbackLocations(keyword: string) {
  const searchTerm = keyword.toLowerCase();
  
  const locations = [
    // Popular airports
    { iataCode: 'YVR', name: 'Vancouver International Airport', cityName: 'Vancouver', countryName: 'Canada' },
    { iataCode: 'YYZ', name: 'Toronto Pearson International Airport', cityName: 'Toronto', countryName: 'Canada' },
    { iataCode: 'LAX', name: 'Los Angeles International Airport', cityName: 'Los Angeles', countryName: 'United States' },
    { iataCode: 'JFK', name: 'John F. Kennedy International Airport', cityName: 'New York', countryName: 'United States' },
    { iataCode: 'LHR', name: 'London Heathrow Airport', cityName: 'London', countryName: 'United Kingdom' },
    { iataCode: 'CDG', name: 'Charles de Gaulle Airport', cityName: 'Paris', countryName: 'France' },
    { iataCode: 'NRT', name: 'Narita International Airport', cityName: 'Tokyo', countryName: 'Japan' },
    { iataCode: 'SYD', name: 'Sydney Kingsford Smith Airport', cityName: 'Sydney', countryName: 'Australia' },
    { iataCode: 'DXB', name: 'Dubai International Airport', cityName: 'Dubai', countryName: 'United Arab Emirates' },
    { iataCode: 'SIN', name: 'Singapore Changi Airport', cityName: 'Singapore', countryName: 'Singapore' },
    { iataCode: 'FRA', name: 'Frankfurt Airport', cityName: 'Frankfurt', countryName: 'Germany' },
    { iataCode: 'MAD', name: 'Madrid-Barajas Airport', cityName: 'Madrid', countryName: 'Spain' },
    { iataCode: 'CUN', name: 'Cancún International Airport', cityName: 'Cancún', countryName: 'Mexico' },
    { iataCode: 'ACA', name: 'General Juan N. Álvarez International Airport', cityName: 'Acapulco', countryName: 'Mexico' },
    { iataCode: 'HNL', name: 'Daniel K. Inouye International Airport', cityName: 'Honolulu', countryName: 'United States' },
    // Popular cities
    { iataCode: 'NYC', name: 'New York City', cityName: 'New York', countryName: 'United States' },
    { iataCode: 'LON', name: 'London', cityName: 'London', countryName: 'United Kingdom' },
    { iataCode: 'PAR', name: 'Paris', cityName: 'Paris', countryName: 'France' },
    { iataCode: 'TOK', name: 'Tokyo', cityName: 'Tokyo', countryName: 'Japan' },
    { iataCode: 'ROM', name: 'Rome', cityName: 'Rome', countryName: 'Italy' }
  ];
  
  // Filter based on search term
  return locations
    .filter(location => 
      location.name.toLowerCase().includes(searchTerm) ||
      location.cityName.toLowerCase().includes(searchTerm) ||
      location.countryName.toLowerCase().includes(searchTerm) ||
      location.iataCode.toLowerCase().includes(searchTerm)
    )
    .slice(0, 10) // Limit to 10 results
    .map(location => ({
      type: location.iataCode.length === 3 && location.iataCode === location.iataCode.toUpperCase() ? 'location' : 'city',
      subType: location.name.includes('Airport') ? 'AIRPORT' : 'CITY',
      name: location.name,
      detailedName: `${location.cityName}, ${location.countryName}`,
      id: location.iataCode,
      iataCode: location.iataCode,
      address: {
        cityName: location.cityName,
        countryName: location.countryName
      }
    }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  
  if (!keyword || keyword.length < 2) {
    return NextResponse.json({
      locations: [],
      count: 0,
      error: 'Keyword must be at least 2 characters'
    });
  }
  
  try {
    // Check cache first
    const cacheKey = `locations_${keyword.toLowerCase()}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      console.log('🎯 Cache hit for location search:', cacheKey);
      return NextResponse.json({
        locations: cachedResult.locations,
        count: cachedResult.count,
        searchParams: { keyword },
        source: 'cache',
        cached: true
      });
    }

    // Check if Amadeus is configured
    const isAmadeusConfigured = checkAmadeusConfig();
    
    let locations;
    let source = 'fallback';
    
    if (isAmadeusConfigured) {
      try {
        console.log('📍 Searching locations with Amadeus API:', keyword);
        const amadeusLocations = await searchLocations(keyword);
        
        if (amadeusLocations && amadeusLocations.length > 0) {
          locations = amadeusLocations;
          source = 'amadeus';
          console.log('✅ Amadeus location search successful:', locations.length, 'results');
        } else {
          console.log('⚠️ Amadeus returned no locations, using fallback data');
          locations = generateFallbackLocations(keyword);
        }
      } catch (amadeusError) {
        console.log('❌ Amadeus location search failed, using fallback data:', amadeusError);
        locations = generateFallbackLocations(keyword);
      }
    } else {
      console.log('⚠️ Amadeus not configured, using fallback data');
      locations = generateFallbackLocations(keyword);
    }
    
    // Cache the results
    const result = {
      locations,
      count: locations.length,
      searchParams: { keyword },
      source,
      timestamp: new Date().toISOString()
    };
    
    cache.set(cacheKey, result);
    console.log('💾 Cached location search results:', cacheKey);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Location Search API Error:', error);
    
    const fallbackLocations = generateFallbackLocations(keyword);
    return NextResponse.json({
      locations: fallbackLocations,
      count: fallbackLocations.length,
      searchParams: { keyword },
      source: 'fallback',
      error: 'API temporarily unavailable'
    });
  }
}
