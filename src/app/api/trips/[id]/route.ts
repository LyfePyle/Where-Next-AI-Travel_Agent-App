import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;

    // In a real app, you would fetch the trip from a database
    // For now, we'll return a mock trip based on the ID
    
    // Try to get destination from query params
    const destination = request.nextUrl.searchParams.get('destination') || 'Lisbon, Portugal';
    const [city, country] = destination.includes(',') 
      ? [destination.split(',')[0].trim(), destination.split(',')[1].trim()]
      : [destination, 'Unknown Country'];
    
    const mockTrip = {
      id: tripId,
      suggestion: {
        id: tripId,
        destination: destination,
        country: country,
        city: city,
        fitScore: 92,
        description: `Explore the amazing destination of ${city} with our curated recommendations`,
        weather: { temp: 22, condition: 'Sunny', icon: '☀️' },
        crowdLevel: 'Medium',
        seasonality: 'Perfect weather, moderate crowds',
        estimatedTotal: 1350,
        flightBand: { min: 650, max: 780 },
        hotelBand: { min: 90, max: 130, style: 'Comfortable', area: 'City Center' },
        highlights: ['Local attractions', 'Cultural experiences', 'Great food', 'Beautiful sights'],
        whyItFits: `Perfect destination for your travel preferences and budget in ${city}`,
        dailyItinerary: [
          {
            day: 1,
            title: `Arrival & First Impressions`,
            activities: ['Airport transfer', 'Check-in at hotel', `Explore ${city} center`, 'Local dinner'],
            estimatedCost: 120,
            tips: ['Book airport transfer in advance', 'Wear comfortable walking shoes']
          },
          {
            day: 2,
            title: `${city} Discovery`,
            activities: [`${city} highlights tour`, 'Visit local attractions', 'Cultural experience', 'Traditional lunch'],
            estimatedCost: 85,
            tips: ['Visit attractions early to avoid crowds', 'Bring water and comfortable shoes']
          }
        ],
        bestTimeToVisit: 'Year-round destination',
        localCurrency: 'Local currency',
        language: 'Local language',
        timezone: 'Local timezone'
      },
      selections: [],
      createdAt: new Date().toISOString(),
      status: 'draft'
    };

    return NextResponse.json(mockTrip);
  } catch (error) {
    console.error('Error fetching trip:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    );
  }
}
