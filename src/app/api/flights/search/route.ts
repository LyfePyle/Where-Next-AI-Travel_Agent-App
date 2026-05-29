import { NextRequest, NextResponse } from 'next/server';
import Amadeus from 'amadeus';
import { isDuffelConfigured, searchFlightsDuffel } from '@/lib/duffel';

// Amadeus: only if env vars are set (legacy)
let amadeus: any = null;
if (process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET) {
  amadeus = new Amadeus({
    clientId: process.env.AMADEUS_API_KEY,
    clientSecret: process.env.AMADEUS_API_SECRET,
    hostname: 'test',
  });
}

function fallbackFlights(origin: string, destination: string) {
  return [
    {
      id: 'fallback-1',
      airline: 'Air Canada',
      flightNumber: 'AC 123',
      departure: `${origin} (${origin})`,
      arrival: `${destination} (${destination})`,
      duration: '5h 30m',
      price: 450,
      stops: 0,
      departureTime: '08:30',
      arrivalTime: '13:00',
      currency: 'CAD',
    },
  ];
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.searchParams.get('origin') || 'YVR';
  const destination = request.nextUrl.searchParams.get('destination') || 'LAX';
  const departureDate = request.nextUrl.searchParams.get('departureDate') || new Date().toISOString().split('T')[0];
  const adults = Math.max(1, parseInt(request.nextUrl.searchParams.get('adults') || '1', 10));
  const max = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get('max') || '10', 10)));

  try {
    // 1. Prefer Duffel when DUFFEL_API_KEY is set
    if (isDuffelConfigured()) {
      const duffelFlights = await searchFlightsDuffel({
        origin,
        destination,
        departureDate,
        adults,
        max,
      });
      if (duffelFlights && duffelFlights.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Duffel',
          flights: duffelFlights,
          total: duffelFlights.length,
        });
      }
      // Duffel returned empty or failed — fall through to Amadeus or fallback
    }

    // 2. Amadeus (legacy) if configured
    if (amadeus) {
      const response = await amadeus.shopping.flightOffersSearch.get({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate,
        adults: String(adults),
        max: String(max),
        currencyCode: 'CAD',
      });
      const flights = (response.data || []).map((flight: any, index: number) => ({
        id: flight.id || `flight-${index}`,
        airline: flight.validatingAirlineCodes?.[0] || 'Unknown',
        flightNumber:
          (flight.itineraries?.[0]?.segments?.[0]?.carrierCode ?? '') +
          ' ' +
          (flight.itineraries?.[0]?.segments?.[0]?.number ?? ''),
        departure: `${origin} (${origin})`,
        arrival: `${destination} (${destination})`,
        duration: flight.itineraries?.[0]?.duration || '—',
        price: parseFloat(flight.price?.total) || 0,
        stops: (flight.itineraries?.[0]?.segments?.length || 1) - 1,
        departureTime: flight.itineraries?.[0]?.segments?.[0]?.departure?.at?.split('T')[1]?.slice(0, 5) || '—',
        arrivalTime:
          flight.itineraries?.[0]?.segments?.[flight.itineraries[0].segments.length - 1]?.arrival?.at
            ?.split('T')[1]
            ?.slice(0, 5) || '—',
        currency: flight.price?.currency || 'CAD',
      }));
      return NextResponse.json({
        success: true,
        message: 'Amadeus',
        flights,
        total: flights.length,
      });
    }

    // 3. Fallback
    const flights = fallbackFlights(origin, destination);
    return NextResponse.json({
      success: true,
      message: 'Fallback (no Duffel/Amadeus or search returned no results)',
      flights,
      total: flights.length,
    });
  } catch (error: any) {
    console.error('Flight search error:', error);
    const flights = fallbackFlights(origin, destination);
    return NextResponse.json({
      success: false,
      message: 'Using fallback after error',
      flights,
      total: flights.length,
      error: error?.message ?? String(error),
    });
  }
}
