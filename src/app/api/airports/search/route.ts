import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    
    if (!q || q.length < 2) {
      return NextResponse.json({ data: [] });
    }

    // Try to import and use searchLocations, fallback to mock data if it fails
    let locations = [];
    try {
      const { searchLocations } = await import('@/lib/amadeus');
      locations = await searchLocations({
        keyword: q,
        subType: 'CITY,AIRPORT',
        page: { limit: 20 }
      });

      // Format the data for frontend consumption
      const formattedData = locations.map((location: any) => ({
        id: location.iataCode,
        iataCode: location.iataCode,
        name: location.name,
        cityName: location.address?.cityName,
        countryName: location.address?.countryName,
        subType: location.subType,
        displayName: `${location.name} (${location.iataCode}) - ${location.address?.cityName}, ${location.address?.countryName}`
      }));

      return NextResponse.json({ data: formattedData });
    } catch (amadeusError) {
      console.log('Amadeus search failed, using fallback data:', amadeusError);
      // Continue to fallback below
    }

    // Enhanced fallback data based on search query
    const allAirports = [
      {
        id: 'MAD',
        iataCode: 'MAD',
        name: 'Madrid-Barajas Airport',
        cityName: 'Madrid',
        countryName: 'Spain',
        subType: 'AIRPORT',
        displayName: 'Madrid-Barajas Airport (MAD) - Madrid, Spain'
      },
      {
        id: 'BCN',
        iataCode: 'BCN',
        name: 'Barcelona-El Prat Airport',
        cityName: 'Barcelona',
        countryName: 'Spain',
        subType: 'AIRPORT',
        displayName: 'Barcelona-El Prat Airport (BCN) - Barcelona, Spain'
      },
      {
        id: 'YVR',
        iataCode: 'YVR',
        name: 'Vancouver International Airport',
        cityName: 'Vancouver',
        countryName: 'Canada',
        subType: 'AIRPORT',
        displayName: 'Vancouver International Airport (YVR) - Vancouver, Canada'
      },
      {
        id: 'YYZ',
        iataCode: 'YYZ',
        name: 'Toronto Pearson International Airport',
        cityName: 'Toronto',
        countryName: 'Canada',
        subType: 'AIRPORT',
        displayName: 'Toronto Pearson International Airport (YYZ) - Toronto, Canada'
      },
      {
        id: 'LHR',
        iataCode: 'LHR',
        name: 'London Heathrow Airport',
        cityName: 'London',
        countryName: 'United Kingdom',
        subType: 'AIRPORT',
        displayName: 'London Heathrow Airport (LHR) - London, United Kingdom'
      },
      {
        id: 'CDG',
        iataCode: 'CDG',
        name: 'Paris Charles de Gaulle Airport',
        cityName: 'Paris',
        countryName: 'France',
        subType: 'AIRPORT',
        displayName: 'Paris Charles de Gaulle Airport (CDG) - Paris, France'
      },
      {
        id: 'JFK',
        iataCode: 'JFK',
        name: 'John F Kennedy International Airport',
        cityName: 'New York',
        countryName: 'United States',
        subType: 'AIRPORT',
        displayName: 'John F Kennedy International Airport (JFK) - New York, United States'
      },
      {
        id: 'LAX',
        iataCode: 'LAX',
        name: 'Los Angeles International Airport',
        cityName: 'Los Angeles',
        countryName: 'United States',
        subType: 'AIRPORT',
        displayName: 'Los Angeles International Airport (LAX) - Los Angeles, United States'
      }
    ];

    const filteredAirports = allAirports.filter(airport => 
      airport.name.toLowerCase().includes(q.toLowerCase()) ||
      airport.cityName.toLowerCase().includes(q.toLowerCase()) ||
      airport.iataCode.toLowerCase().includes(q.toLowerCase()) ||
      airport.countryName.toLowerCase().includes(q.toLowerCase())
    );

    return NextResponse.json({ 
      data: filteredAirports,
      source: 'fallback'
    });

  } catch (error) {
    console.error('Airport search error:', error);
    return NextResponse.json(
      { error: 'Failed to search airports', data: [] },
      { status: 500 }
    );
  }
}
