import { NextRequest, NextResponse } from 'next/server';

// Your working Amadeus token
const WORKING_TOKEN = 'S89nqNaVRlxGDcdLSLFGp0tGH9c4';

export async function POST(request: NextRequest) {
  try {
    const { destination, checkin, checkout, adults = 2 } = await request.json();
    
    console.log('Direct Amadeus hotel search:', { destination, checkin, checkout, adults });
    
    // First, try to get city code from destination
    let cityCode = await getCityCode(destination);
    
    if (!cityCode) {
      // Fallback to mock data if we can't determine city code
      return NextResponse.json({
        hotels: generateFallbackHotels(destination, checkin, checkout),
        count: 3,
        source: 'fallback'
      });
    }

    // Search for hotels in the city
    const hotelsResponse = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=15&radiusUnit=KM&hotelSource=ALL`,
      {
        headers: {
          'Authorization': `Bearer ${WORKING_TOKEN}`,
          'Accept': 'application/vnd.amadeus+json'
        }
      }
    );

    if (!hotelsResponse.ok) {
      console.log('Hotels search failed, using fallback');
      return NextResponse.json({
        hotels: generateFallbackHotels(destination, checkin, checkout),
        count: 3,
        source: 'fallback'
      });
    }

    const hotelsData = await hotelsResponse.json();
    console.log('Found hotels:', hotelsData.data?.length || 0);

    // Format hotels for our frontend
    const hotels = (hotelsData.data || []).slice(0, 6).map((hotel: any, index: number) => ({
      id: hotel.hotelId || `hotel_${index}`,
      name: hotel.name || 'Hotel',
      rating: (4.0 + Math.random()).toFixed(1),
      price: 150 + Math.floor(Math.random() * 300),
      image: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center&auto=format&q=60`,
      amenities: ['Free WiFi', 'Breakfast', 'Pool', 'Gym'],
      address: {
        lines: hotel.address?.lines || ['Central Location'],
        cityName: hotel.address?.cityName || destination,
        countryCode: hotel.address?.countryCode || 'US'
      },
      location: {
        latitude: hotel.geoCode?.latitude || 0,
        longitude: hotel.geoCode?.longitude || 0
      },
      description: `Beautiful hotel in ${destination} with excellent amenities and service.`
    }));

    return NextResponse.json({
      hotels,
      count: hotels.length,
      source: 'amadeus'
    });

  } catch (error) {
    console.error('Direct Amadeus hotel search error:', error);
    
    const { destination, checkin, checkout } = await request.json();
    return NextResponse.json({
      hotels: generateFallbackHotels(destination, checkin, checkout),
      count: 3,
      source: 'fallback'
    });
  }
}

async function getCityCode(destination: string): Promise<string | null> {
  try {
    // Simple city code mapping for major cities
    const cityMapping: { [key: string]: string } = {
      'paris': 'PAR',
      'london': 'LON',
      'new york': 'NYC',
      'tokyo': 'TYO',
      'madrid': 'MAD',
      'barcelona': 'BCN',
      'rome': 'ROM',
      'amsterdam': 'AMS',
      'berlin': 'BER',
      'vienna': 'VIE',
      'prague': 'PRG',
      'moscow': 'MOW',
      'istanbul': 'IST',
      'dubai': 'DXB',
      'singapore': 'SIN',
      'hong kong': 'HKG',
      'bangkok': 'BKK',
      'sydney': 'SYD',
      'melbourne': 'MEL',
      'toronto': 'YTO',
      'vancouver': 'YVR',
      'montreal': 'YMQ',
      'los angeles': 'LAX',
      'san francisco': 'SFO',
      'chicago': 'CHI',
      'miami': 'MIA',
      'las vegas': 'LAS',
      'lisbon': 'LIS',
      'porto': 'OPO',
      'milan': 'MIL',
      'florence': 'FLR',
      'venice': 'VCE',
      'naples': 'NAP',
      'athens': 'ATH',
      'santorini': 'JTR',
      'mykonos': 'JMK',
      'reykjavik': 'REK',
      'stockholm': 'STO',
      'copenhagen': 'CPH',
      'oslo': 'OSL',
      'helsinki': 'HEL',
      'zurich': 'ZUR',
      'geneva': 'GVA',
      'brussels': 'BRU',
      'dublin': 'DUB',
      'edinburgh': 'EDI'
    };

    const normalizedDestination = destination.toLowerCase().replace(/,.*$/, '').trim();
    return cityMapping[normalizedDestination] || null;

  } catch (error) {
    console.error('Error getting city code:', error);
    return null;
  }
}

function generateFallbackHotels(destination: string, checkin: string, checkout: string) {
  const hotelNames = [
    `Grand ${destination} Hotel`,
    `${destination} Palace`,
    `Central ${destination} Inn`,
    `${destination} Boutique Hotel`,
    `The ${destination} Resort`,
    `Modern ${destination} Suites`
  ];

  return hotelNames.slice(0, 4).map((name, index) => ({
    id: `fallback_hotel_${index + 1}`,
    name,
    rating: (4.0 + Math.random()).toFixed(1),
    price: 120 + Math.floor(Math.random() * 280),
    image: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center&auto=format&q=60`,
    amenities: ['Free WiFi', 'Breakfast', 'Pool', 'Gym'],
    address: {
      lines: ['Central District'],
      cityName: destination,
      countryCode: 'US'
    },
    location: { latitude: 0, longitude: 0 },
    description: `Comfortable hotel in ${destination} with excellent facilities.`
  }));
}
