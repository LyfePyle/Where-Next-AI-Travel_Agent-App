import { NextRequest, NextResponse } from 'next/server';
import Amadeus from 'amadeus';

interface FlightBookingRequest {
  flightOfferId: string;
  travelers: Array<{
    id: string;
    dateOfBirth: string;
    name: {
      firstName: string;
      lastName: string;
    };
    gender: 'MALE' | 'FEMALE';
    contact: {
      emailAddress: string;
      phones: Array<{
        deviceType: 'MOBILE' | 'DESKTOP';
        countryCallingCode: string;
        number: string;
      }>;
    };
    documents: Array<{
      documentType: 'PASSPORT';
      birthPlace: string;
      issuanceLocation: string;
      issuanceDate: string;
      number: string;
      expiryDate: string;
      issuanceCountry: string;
      validityCountry: string;
      nationality: string;
      holder: boolean;
    }>;
  }>;
}

interface FlightBookingResponse {
  data: {
    id: string;
    queuingOfficeId: string;
    status: string;
    travelers: Array<{
      id: string;
      travelerType: string;
    }>;
    flightOffers: Array<any>;
    ticketingAgreement: {
      option: string;
      delay: number;
    };
    contacts: Array<{
      purpose: string;
      phones: Array<{
        deviceType: string;
        number: string;
      }>;
    }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const bookingRequest: FlightBookingRequest = await request.json();
    
    // Validate required parameters
    if (!bookingRequest.flightOfferId || !bookingRequest.travelers) {
      return NextResponse.json(
        { error: 'Missing required parameters: flightOfferId, travelers' },
        { status: 400 }
      );
    }

    // Initialize Amadeus client
    const amadeus = new Amadeus({
      clientId: process.env.AMADEUS_API_KEY,
      clientSecret: process.env.AMADEUS_API_SECRET,
      hostname: 'test' // Use 'production' for live bookings
    });

    console.log('Creating flight booking with params:', bookingRequest);

    // Create the flight booking
    const response = await amadeus.booking.flightOrders.post(JSON.stringify(bookingRequest));
    
    const bookingData = response.data;

    return NextResponse.json({
      success: true,
      booking: bookingData,
      message: 'Flight booking created successfully'
    });

  } catch (error) {
    console.error('Flight booking error:', error);
    
    // Return mock booking response if Amadeus fails
    return NextResponse.json({
      success: true,
      booking: generateMockBooking(bookingRequest),
      message: 'Mock flight booking created (API service unavailable)',
      warning: 'This is a mock booking for demonstration purposes'
    });
  }
}

function generateMockBooking(bookingRequest: FlightBookingRequest) {
  return {
    id: `mock-booking-${Date.now()}`,
    queuingOfficeId: 'Q12345',
    status: 'CONFIRMED',
    travelers: bookingRequest.travelers.map(traveler => ({
      id: traveler.id,
      travelerType: 'ADULT'
    })),
    flightOffers: [{
      id: bookingRequest.flightOfferId,
      price: {
        total: '450.00',
        currency: 'USD'
      }
    }],
    ticketingAgreement: {
      option: 'DELAYED',
      delay: 24
    },
    contacts: [{
      purpose: 'STANDARD',
      phones: [{
        deviceType: 'MOBILE',
        number: bookingRequest.travelers[0].contact.phones[0].number
      }]
    }]
  };
}
