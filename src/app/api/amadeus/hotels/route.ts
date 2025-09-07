import { NextRequest, NextResponse } from 'next/server';
import { searchHotels, hotelAutocomplete, HotelSearchParams } from '@/lib/amadeus';

export async function POST(request: NextRequest) {
  try {
    const params: HotelSearchParams = await request.json();
    
    // Validate required parameters
    if (!params.keyword) {
      return NextResponse.json(
        { error: 'Missing required parameter: keyword' },
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const keyword = searchParams.get('keyword');
    const subType = searchParams.get('subType') || 'HOTEL_LEISURE';
    const countryCode = searchParams.get('countryCode') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate required parameters
    if (!keyword) {
      return NextResponse.json(
        { error: 'Missing required parameter: keyword' },
        { status: 400 }
      );
    }

    // Search hotels using Amadeus
    const hotels = await searchHotels({
      keyword,
      subType,
      countryCode,
      page: {
        limit,
        offset
      }
    });
    
    return NextResponse.json({ 
      hotels,
      count: hotels.length,
      searchParams: { keyword, subType, countryCode, limit, offset }
    });
    
  } catch (error) {
    console.error('Hotel Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to search hotels', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
