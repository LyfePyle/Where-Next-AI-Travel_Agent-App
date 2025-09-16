import { NextRequest, NextResponse } from 'next/server';

// Your working Amadeus token
const WORKING_TOKEN = 'S89nqNaVRlxGDcdLSLFGp0tGH9c4';

export async function POST(request: NextRequest) {
  try {
    const { originLocationCode, destinationLocationCode, departureDate, adults = 1 } = await request.json();
    
    console.log('Direct Amadeus flight search:', { originLocationCode, destinationLocationCode, departureDate, adults });
    
    // Validate and fix dates - ensure we're searching for future dates
    const validDate = getValidFutureDate(departureDate);
    
    if (!originLocationCode || !destinationLocationCode) {
      return NextResponse.json({
        flights: generateFallbackFlights(originLocationCode, destinationLocationCode, validDate),
        count: 3,
        source: 'fallback - missing location codes'
      });
    }

    // Get airport codes if city names were provided
    const origin = await getAirportCode(originLocationCode);
    const destination = await getAirportCode(destinationLocationCode);

    if (!origin || !destination) {
      console.log('Could not resolve airport codes, using fallback');
      return NextResponse.json({
        flights: generateFallbackFlights(originLocationCode, destinationLocationCode, validDate),
        count: 3,
        source: 'fallback - airport resolution failed'
      });
    }

    // Search for flights using Amadeus API
    const searchParams = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: validDate,
      adults: adults.toString(),
      currencyCode: 'USD',
      max: '6'
    });

    console.log('Searching flights with params:', searchParams.toString());

    const flightsResponse = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${searchParams}`,
      {
        headers: {
          'Authorization': `Bearer ${WORKING_TOKEN}`,
          'Accept': 'application/vnd.amadeus+json'
        }
      }
    );

    console.log('Flight search response status:', flightsResponse.status);

    if (!flightsResponse.ok) {
      const errorText = await flightsResponse.text();
      console.log('Flight search failed:', errorText);
      
      return NextResponse.json({
        flights: generateFallbackFlights(originLocationCode, destinationLocationCode, validDate),
        count: 3,
        source: 'fallback - api error',
        debug: { status: flightsResponse.status, error: errorText }
      });
    }

    const flightsData = await flightsResponse.json();
    console.log('Found flights:', flightsData.data?.length || 0);

    // Format flights for our frontend
    const flights = (flightsData.data || []).slice(0, 6).map((offer: any, index: number) => {
      const segment = offer.itineraries[0].segments[0];
      const price = parseFloat(offer.price.total);
      
      return {
        id: offer.id || `flight_${index}`,
        airline: getAirlineName(segment.carrierCode),
        price: Math.round(price),
        duration: formatDuration(offer.itineraries[0].duration),
        departure: formatTime(segment.departure.at),
        arrival: formatTime(segment.arrival.at),
        stops: segment.numberOfStops || 0,
        aircraft: getAircraftName(segment.aircraft?.code) || 'Commercial Aircraft'
      };
    });

    return NextResponse.json({
      flights,
      count: flights.length,
      source: 'amadeus',
      searchDate: validDate
    });

  } catch (error) {
    console.error('Direct Amadeus flight search error:', error);
    
    const { originLocationCode, destinationLocationCode, departureDate } = await request.json().catch(() => ({}));
    const validDate = getValidFutureDate(departureDate);
    
    return NextResponse.json({
      flights: generateFallbackFlights(originLocationCode || 'Unknown', destinationLocationCode || 'Unknown', validDate),
      count: 3,
      source: 'fallback - exception',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function getValidFutureDate(inputDate?: string): string {
  const today = new Date();
  
  if (!inputDate) {
    // Default to tomorrow if no date provided
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  const providedDate = new Date(inputDate);
  
  // If the provided date is in the past, use tomorrow instead
  if (providedDate <= today) {
    console.log(`Date ${inputDate} is in the past, using future date`);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 7); // Use next week
    return futureDate.toISOString().split('T')[0];
  }
  
  return inputDate;
}

async function getAirportCode(location: string): Promise<string | null> {
  // If it's already an airport code (3 letters), return it
  if (/^[A-Z]{3}$/.test(location)) {
    return location;
  }
  
  // Simple airport/city code mapping
  const airportMapping: { [key: string]: string } = {
    'vancouver': 'YVR',
    'paris': 'CDG',
    'london': 'LHR',
    'new york': 'JFK',
    'tokyo': 'NRT',
    'madrid': 'MAD',
    'barcelona': 'BCN',
    'rome': 'FCO',
    'amsterdam': 'AMS',
    'berlin': 'BER',
    'vienna': 'VIE',
    'prague': 'PRG',
    'moscow': 'SVO',
    'istanbul': 'IST',
    'dubai': 'DXB',
    'singapore': 'SIN',
    'hong kong': 'HKG',
    'bangkok': 'BKK',
    'sydney': 'SYD',
    'melbourne': 'MEL',
    'toronto': 'YYZ',
    'montreal': 'YUL',
    'los angeles': 'LAX',
    'san francisco': 'SFO',
    'chicago': 'ORD',
    'miami': 'MIA',
    'las vegas': 'LAS',
    'lisbon': 'LIS',
    'porto': 'OPO',
    'milan': 'MXP',
    'florence': 'FLR',
    'venice': 'VCE',
    'naples': 'NAP',
    'athens': 'ATH',
    'reykjavik': 'KEF',
    'stockholm': 'ARN',
    'copenhagen': 'CPH',
    'oslo': 'OSL',
    'helsinki': 'HEL',
    'zurich': 'ZUR',
    'geneva': 'GVA',
    'brussels': 'BRU',
    'dublin': 'DUB',
    'edinburgh': 'EDI'
  };

  const normalizedLocation = location.toLowerCase().replace(/,.*$/, '').trim();
  return airportMapping[normalizedLocation] || null;
}

function getAirlineName(code: string): string {
  const airlines: { [key: string]: string } = {
    'AC': 'Air Canada',
    'LH': 'Lufthansa',
    'AF': 'Air France',
    'BA': 'British Airways',
    'KL': 'KLM',
    'IB': 'Iberia',
    'AZ': 'Alitalia',
    'LX': 'Swiss',
    'OS': 'Austrian',
    'SK': 'SAS',
    'TK': 'Turkish Airlines',
    'EK': 'Emirates',
    'QR': 'Qatar Airways',
    'SQ': 'Singapore Airlines',
    'CX': 'Cathay Pacific',
    'JL': 'JAL',
    'NH': 'ANA',
    'TG': 'Thai Airways',
    'QF': 'Qantas',
    'UA': 'United',
    'DL': 'Delta',
    'AA': 'American',
    'WN': 'Southwest'
  };
  
  return airlines[code] || code;
}

function getAircraftName(code: string): string {
  const aircraft: { [key: string]: string } = {
    '320': 'Airbus A320',
    '321': 'Airbus A321',
    '330': 'Airbus A330',
    '350': 'Airbus A350',
    '380': 'Airbus A380',
    '737': 'Boeing 737',
    '747': 'Boeing 747',
    '777': 'Boeing 777',
    '787': 'Boeing 787',
    '789': 'Boeing 787-9'
  };
  
  return aircraft[code] || 'Commercial Aircraft';
}

function formatDuration(duration: string): string {
  // Convert ISO 8601 duration (PT12H30M) to readable format (12h 30m)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;
  
  const hours = match[1] ? `${match[1]}h` : '';
  const minutes = match[2] ? ` ${match[2]}m` : '';
  
  return `${hours}${minutes}`.trim();
}

function formatTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

function generateFallbackFlights(origin: string, destination: string, date: string) {
  const basePrice = 600 + Math.floor(Math.random() * 800);
  
  return [
    {
      id: 'fallback_1',
      airline: 'Air Canada',
      price: basePrice,
      duration: '12h 30m',
      departure: '08:30',
      arrival: '21:00',
      stops: 0,
      aircraft: 'Boeing 787-9'
    },
    {
      id: 'fallback_2', 
      airline: 'Lufthansa',
      price: basePrice - 150,
      duration: '16h 45m',
      departure: '14:20',
      arrival: '13:05',
      stops: 1,
      aircraft: 'Airbus A350'
    },
    {
      id: 'fallback_3',
      airline: 'KLM',
      price: basePrice + 100,
      duration: '14h 15m', 
      departure: '10:15',
      arrival: '08:30',
      stops: 1,
      aircraft: 'Boeing 777-300'
    }
  ];
}
