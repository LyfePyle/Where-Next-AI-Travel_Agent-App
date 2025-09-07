import { NextRequest, NextResponse } from 'next/server';
import { hotelAutocomplete } from '@/lib/amadeus';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const keyword = searchParams.get('keyword');
    const subType = searchParams.get('subType') || 'HOTEL_LEISURE';

    // Validate required parameters
    if (!keyword) {
      return NextResponse.json(
        { error: 'Missing required parameter: keyword' },
        { status: 400 }
      );
    }

    // Get hotel autocomplete suggestions
    const hotels = await hotelAutocomplete(keyword, subType);
    
    return NextResponse.json({ 
      hotels,
      count: hotels.length,
      searchParams: { keyword, subType }
    });
    
  } catch (error) {
    console.error('Hotel Autocomplete API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get hotel suggestions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { keyword, subType = 'HOTEL_LEISURE' } = await request.json();
    
    // Validate required parameters
    if (!keyword) {
      return NextResponse.json(
        { error: 'Missing required parameter: keyword' },
        { status: 400 }
      );
    }

    // Get hotel autocomplete suggestions
    const hotels = await hotelAutocomplete(keyword, subType);
    
    return NextResponse.json({ 
      hotels,
      count: hotels.length,
      searchParams: { keyword, subType }
    });
    
  } catch (error) {
    console.error('Hotel Autocomplete API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get hotel suggestions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
