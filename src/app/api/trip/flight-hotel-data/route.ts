import { NextRequest, NextResponse } from 'next/server';
import { searchFlights, searchHotels, FlightSearchParams, HotelSearchParams } from '@/lib/amadeus';

interface TripFlightHotelRequest {
  destination: string;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  adults: number;
  kids: number;
  budgetStyle: string;
  from: string;
}

export async function POST(request: NextRequest) {
  try {
    const { destination, country, city, startDate, endDate, adults, kids, budgetStyle, from }: TripFlightHotelRequest = await request.json();
    
    // Get city codes for flights (simplified - in production you'd use a proper city code lookup)
    const originCode = getCityCode(from);
    const destinationCode = getCityCode(city);
    
    if (!originCode || !destinationCode) {
      return NextResponse.json(
        { error: 'Unable to find airport codes for the specified cities' },
        { status: 400 }
      );
    }

    // Search for flights
    const flightParams: FlightSearchParams = {
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate: startDate,
      returnDate: endDate,
      adults: adults,
      children: kids,
      travelClass: budgetStyle === 'luxury' ? 'BUSINESS' : 'ECONOMY',
      currencyCode: 'USD',
      max: 5
    };

    const flights = await searchFlights(flightParams);

    // Search for hotels
    const hotelParams: HotelSearchParams = {
      keyword: `${city}, ${country}`,
      subType: 'HOTEL_LEISURE',
      page: {
        limit: 5,
        offset: 0
      }
    };

    const hotels = await searchHotels(hotelParams);

    // Process and format the data
    const processedFlights = flights.map(flight => ({
      id: flight.id,
      price: flight.price.total,
      currency: flight.price.currency,
      duration: flight.itineraries[0]?.duration || 'N/A',
      segments: flight.itineraries[0]?.segments?.map(segment => ({
        departure: {
          airport: segment.departure.iataCode,
          time: segment.departure.at,
          terminal: segment.departure.terminal
        },
        arrival: {
          airport: segment.arrival.iataCode,
          time: segment.arrival.at,
          terminal: segment.arrival.terminal
        },
        airline: segment.carrierCode,
        flightNumber: segment.number,
        duration: segment.duration,
        stops: segment.numberOfStops
      })) || [],
      bookableSeats: flight.numberOfBookableSeats,
      lastTicketingDate: flight.lastTicketingDate
    }));

    const processedHotels = hotels.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      rating: hotel.rating,
      description: hotel.description?.text || 'No description available',
      amenities: hotel.amenities || [],
      address: {
        lines: hotel.address?.lines || [],
        city: hotel.address?.cityName || city,
        country: hotel.address?.countryCode || country,
        postalCode: hotel.address?.postalCode || ''
      },
      contact: {
        phone: hotel.contact?.phone || 'N/A',
        email: hotel.contact?.email || 'N/A'
      },
      distance: hotel.distance?.value ? `${hotel.distance.value} ${hotel.distance.unit}` : 'N/A',
      price: hotel.price ? {
        currency: hotel.price.currency,
        base: hotel.price.base,
        total: hotel.price.total
      } : null,
      images: hotel.images || []
    }));

    return NextResponse.json({
      flights: processedFlights,
      hotels: processedHotels,
      searchParams: {
        destination,
        country,
        city,
        startDate,
        endDate,
        adults,
        kids,
        budgetStyle,
        from
      }
    });
    
  } catch (error) {
    console.error('Trip Flight/Hotel Data API Error:', error);
    
    // Return mock data as fallback
    const mockData = generateMockFlightHotelData(destination, city, startDate, endDate, adults, kids, budgetStyle);
    
    return NextResponse.json({
      ...mockData,
      warning: 'Using mock data due to API service issue'
    });
  }
}

// Helper function to get city codes (simplified mapping)
function getCityCode(city: string): string | null {
  const cityCodeMap: Record<string, string> = {
    'Vancouver': 'YVR',
    'Toronto': 'YYZ',
    'Montreal': 'YUL',
    'Calgary': 'YYC',
    'Paris': 'CDG',
    'London': 'LHR',
    'New York': 'JFK',
    'Los Angeles': 'LAX',
    'Tokyo': 'NRT',
    'Sydney': 'SYD',
    'Rome': 'FCO',
    'Barcelona': 'BCN',
    'Amsterdam': 'AMS',
    'Berlin': 'BER',
    'Madrid': 'MAD',
    'Lisbon': 'LIS',
    'Dublin': 'DUB',
    'Prague': 'PRG',
    'Vienna': 'VIE',
    'Zurich': 'ZUR',
    'Stockholm': 'ARN',
    'Copenhagen': 'CPH',
    'Oslo': 'OSL',
    'Helsinki': 'HEL',
    'Warsaw': 'WAW',
    'Budapest': 'BUD',
    'Athens': 'ATH',
    'Istanbul': 'IST',
    'Dubai': 'DXB',
    'Singapore': 'SIN',
    'Hong Kong': 'HKG',
    'Bangkok': 'BKK',
    'Seoul': 'ICN',
    'Mumbai': 'BOM',
    'Delhi': 'DEL',
    'Cairo': 'CAI',
    'Cape Town': 'CPT',
    'Johannesburg': 'JNB',
    'São Paulo': 'GRU',
    'Rio de Janeiro': 'GIG',
    'Buenos Aires': 'EZE',
    'Mexico City': 'MEX',
    'Lima': 'LIM',
    'Bogotá': 'BOG',
    'Santiago': 'SCL'
  };
  
  return cityCodeMap[city] || null;
}

// Generate mock data as fallback
function generateMockFlightHotelData(destination: string, city: string, startDate: string, endDate: string, adults: number, kids: number, budgetStyle: string) {
  const basePrice = budgetStyle === 'luxury' ? 1200 : budgetStyle === 'comfortable' ? 800 : 500;
  const hotelBasePrice = budgetStyle === 'luxury' ? 200 : budgetStyle === 'comfortable' ? 120 : 80;
  
  return {
    flights: [
      {
        id: 'mock-flight-1',
        price: (basePrice * (adults + kids * 0.8)).toFixed(2),
        currency: 'USD',
        duration: 'PT8H30M',
        segments: [
          {
            departure: {
              airport: 'YVR',
              time: `${startDate}T08:00:00`,
              terminal: '1'
            },
            arrival: {
              airport: getCityCode(city) || 'XXX',
              time: `${startDate}T16:30:00`,
              terminal: '2'
            },
            airline: 'AC',
            flightNumber: 'AC123',
            duration: 'PT8H30M',
            stops: 0
          }
        ],
        bookableSeats: 5,
        lastTicketingDate: startDate
      }
    ],
    hotels: [
      {
        id: 'mock-hotel-1',
        name: `${city} Central Hotel`,
        rating: budgetStyle === 'luxury' ? 5 : budgetStyle === 'comfortable' ? 4 : 3,
        description: `A ${budgetStyle} hotel in the heart of ${city}, perfect for your stay.`,
        amenities: budgetStyle === 'luxury' ? ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym'] : 
                   budgetStyle === 'comfortable' ? ['WiFi', 'Restaurant', 'Gym'] : ['WiFi', 'Restaurant'],
        address: {
          lines: [`123 Main Street`],
          city: city,
          country: destination,
          postalCode: '12345'
        },
        contact: {
          phone: '+1-555-0123',
          email: 'info@hotel.com'
        },
        distance: '0.5 km',
        price: {
          currency: 'USD',
          base: hotelBasePrice.toFixed(2),
          total: (hotelBasePrice * 1.2).toFixed(2)
        },
        images: []
      }
    ],
    searchParams: {
      destination,
      city,
      startDate,
      endDate,
      adults,
      kids,
      budgetStyle
    }
  };
}

