import { NextRequest, NextResponse } from 'next/server';
import Amadeus from 'amadeus';

// Only initialize Amadeus if environment variables are available
let amadeus: any = null;
if (process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET) {
  amadeus = new Amadeus({
    clientId: process.env.AMADEUS_API_KEY,
    clientSecret: process.env.AMADEUS_API_SECRET,
    hostname: 'test' // Use test environment
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const origin = searchParams.get('origin') || 'YVR';
    const destination = searchParams.get('destination') || 'LAX';
    const departureDate = searchParams.get('departureDate') || '2024-06-01';
    const adults = searchParams.get('adults') || '1';
    const max = searchParams.get('max') || '10';

    if (!amadeus) {
      throw new Error('Amadeus API not configured - missing environment variables');
    }

    // Search for flights using Amadeus API
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      adults: adults,
      max: max,
      currencyCode: 'CAD'
    });

    // Transform Amadeus response to match our app's format
    const flights = response.data.map((flight: any, index: number) => ({
      id: flight.id || `flight-${index}`,
      airline: flight.validatingAirlineCodes?.[0] || 'Unknown',
      flightNumber: flight.itineraries?.[0]?.segments?.[0]?.carrierCode + ' ' + 
                   flight.itineraries?.[0]?.segments?.[0]?.number || 'Unknown',
      departure: `${origin} (${origin})`,
      arrival: `${destination} (${destination})`,
      duration: flight.itineraries?.[0]?.duration || 'Unknown',
      price: parseFloat(flight.price?.total) || 0,
      stops: (flight.itineraries?.[0]?.segments?.length || 1) - 1,
      departureTime: flight.itineraries?.[0]?.segments?.[0]?.departure?.at?.split('T')[1]?.substring(0, 5) || 'Unknown',
      arrivalTime: flight.itineraries?.[0]?.segments?.[flight.itineraries[0].segments.length - 1]?.arrival?.at?.split('T')[1]?.substring(0, 5) || 'Unknown',
      currency: flight.price?.currency || 'CAD'
    }));

    return NextResponse.json({
      success: true,
      flights: flights,
      total: flights.length
    });

  } catch (error: any) {
    console.error('Flight Search Error:', error);
    
    // Return fallback data if API fails
    const fallbackFlights = [
      {
        id: 'fallback-1',
        airline: 'Air Canada',
        flightNumber: 'AC 123',
        departure: `${searchParams.get('origin') || 'YVR'} (YVR)`,
        arrival: `${searchParams.get('destination') || 'LAX'} (LAX)`,
        duration: '5h 30m',
        price: 450,
        stops: 0,
        departureTime: '08:30',
        arrivalTime: '13:00',
        currency: 'CAD'
      }
    ];

    return NextResponse.json({
      success: false,
      message: 'Using fallback flight data',
      flights: fallbackFlights,
      total: fallbackFlights.length,
      error: error.message
    });
  }
}
