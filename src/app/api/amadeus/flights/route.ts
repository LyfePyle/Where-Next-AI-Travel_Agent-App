import { NextRequest, NextResponse } from 'next/server';
import { searchFlights, FlightSearchParams } from '@/lib/amadeus';

export async function POST(request: NextRequest) {
  try {
    const params: FlightSearchParams = await request.json();
    
    // Validate required parameters
    if (!params.originLocationCode || !params.destinationLocationCode || !params.departureDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: originLocationCode, destinationLocationCode, departureDate' },
        { status: 400 }
      );
    }

    // Search flights using Amadeus
    const flights = await searchFlights(params);
    
    return NextResponse.json({ 
      flights,
      count: flights.length,
      searchParams: params
    });
    
  } catch (error) {
    console.error('Flight Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to search flights', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
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

    // Search flights using Amadeus
    const flights = await searchFlights(params);
    
    return NextResponse.json({ 
      flights,
      count: flights.length,
      searchParams: params
    });
    
  } catch (error) {
    console.error('Flight Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to search flights', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
