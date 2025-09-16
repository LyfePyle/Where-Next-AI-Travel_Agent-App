import { NextRequest, NextResponse } from 'next/server';
import { searchHotels, HotelSearchParams } from '@/lib/amadeus';

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

    // Search hotels using Amadeus
    const hotels = await searchHotels(params);
    
    return NextResponse.json({ 
      hotels,
      count: hotels.length,
      searchParams: params
    });
    
  } catch (error) {
    console.error('Hotel Search API Error:', error);
    
    // Return mock data if Amadeus fails
    const mockHotels = [
      {
        id: 'mock_hotel_1',
        hotel: {
          hotelId: 'HTL001',
          name: 'Grand City Hotel',
          rating: '4.5',
          chainCode: 'HI',
          amenities: ['FREE_WIFI', 'PARKING', 'GYM', 'POOL', 'RESTAURANT'],
          address: {
            cityName: 'City Center',
            lines: ['123 Main Street'],
            postalCode: '12345',
            countryCode: 'ES'
          }
        },
        offers: [{
          id: 'offer_1',
          price: {
            currency: 'USD',
            total: '186.00',
            base: '156.00'
          },
          room: {
            type: 'DELUXE',
            typeEstimated: {
              category: 'DELUXE_ROOM',
              beds: 1,
              bedType: 'KING'
            }
          }
        }]
      },
      {
        id: 'mock_hotel_2',
        hotel: {
          hotelId: 'HTL002',
          name: 'Boutique Heritage Inn',
          rating: '4.2',
          chainCode: 'AC',
          amenities: ['FREE_WIFI', 'BREAKFAST', 'CONCIERGE'],
          address: {
            cityName: 'Historic Quarter',
            lines: ['456 Heritage Lane'],
            postalCode: '12346',
            countryCode: 'ES'
          }
        },
        offers: [{
          id: 'offer_2',
          price: {
            currency: 'USD',
            total: '125.00',
            base: '105.00'
          },
          room: {
            type: 'STANDARD',
            typeEstimated: {
              category: 'STANDARD_ROOM',
              beds: 1,
              bedType: 'QUEEN'
            }
          }
        }]
      }
    ];
    
    return NextResponse.json({ 
      hotels: mockHotels,
      count: mockHotels.length,
      searchParams: params,
      source: 'fallback'
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: HotelSearchParams = {
      cityCode: searchParams.get('cityCode') || '',
      checkInDate: searchParams.get('checkInDate') || '',
      checkOutDate: searchParams.get('checkOutDate') || '',
      adults: parseInt(searchParams.get('adults') || '2'),
      children: parseInt(searchParams.get('children') || '0'),
      currency: searchParams.get('currency') || 'USD'
    };

    // Validate required parameters
    if (!params.cityCode || !params.checkInDate || !params.checkOutDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: cityCode, checkInDate, checkOutDate' },
        { status: 400 }
      );
    }

    // Search hotels using Amadeus
    const hotels = await searchHotels(params);
    
    return NextResponse.json({ 
      hotels,
      count: hotels.length,
      searchParams: params
    });
    
  } catch (error) {
    console.error('Hotel Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to search hotels', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}