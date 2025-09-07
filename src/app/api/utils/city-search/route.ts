import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Query must be at least 2 characters long' 
      }, { status: 400 });
    }

    // Use OpenWeatherMap Geocoding API
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Weather API key not configured' 
      }, { status: 500 });
    }

    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=10&appid=${apiKey}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform the data to match our City interface
    const cities = data.map((item: any) => ({
      name: item.name,
      country: item.country,
      state: item.state || undefined,
      lat: item.lat,
      lon: item.lon
    }));

    return NextResponse.json({
      ok: true,
      cities
    });

  } catch (error) {
    console.error('City search error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Failed to search cities' 
    }, { status: 500 });
  }
}
