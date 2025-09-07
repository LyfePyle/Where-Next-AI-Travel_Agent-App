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
    if (!amadeus) {
      return NextResponse.json({
        success: false,
        message: 'Amadeus API not configured - missing environment variables',
        error: 'AMADEUS_API_KEY and AMADEUS_API_SECRET are required'
      }, { status: 500 });
    }

    // Test the connection by searching for flights
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: 'YVR',
      destinationLocationCode: 'LAX',
      departureDate: '2024-06-01',
      adults: '1',
      max: 5
    });

    return NextResponse.json({
      success: true,
      message: 'Amadeus API connection successful!',
      data: response.data
    });
  } catch (error: any) {
    console.error('Amadeus API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Amadeus API connection failed',
      error: error.message
    }, { status: 500 });
  }
}
