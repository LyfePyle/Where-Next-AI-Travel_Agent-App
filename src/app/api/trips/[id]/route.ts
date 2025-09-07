import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;

    // In a real app, you would fetch the trip from a database
    // For now, we'll return a mock trip based on the ID
    const mockTrip = {
      id: tripId,
      suggestion: {
        id: tripId,
        destination: 'Lisbon, Portugal',
        country: 'Portugal',
        city: 'Lisbon',
        fitScore: 92,
        description: 'Historic charm meets modern culture in Portugal\'s vibrant capital',
        weather: { temp: 22, condition: 'Sunny', icon: '☀️' },
        crowdLevel: 'Medium',
        seasonality: 'Perfect weather, moderate crowds',
        estimatedTotal: 1350,
        flightBand: { min: 650, max: 780 },
        hotelBand: { min: 90, max: 130, style: 'Boutique', area: 'Alfama/Baixa' },
        highlights: ['Historic tram rides', 'Pasteis de Belém', 'Fado music', 'Time Out Market'],
        whyItFits: 'Perfect for food lovers with amazing local cuisine and cultural experiences',
        dailyItinerary: [
          {
            day: 1,
            title: 'Arrival & Alfama Exploration',
            activities: ['Airport transfer', 'Check-in at hotel', 'Alfama neighborhood walk', 'Fado dinner'],
            estimatedCost: 120,
            tips: ['Book Fado dinner in advance', 'Wear comfortable walking shoes']
          },
          {
            day: 2,
            title: 'Historic Lisbon',
            activities: ['Tram 28 ride', 'São Jorge Castle', 'Miradouro viewpoints', 'Time Out Market lunch'],
            estimatedCost: 85,
            tips: ['Buy tram ticket in advance', 'Visit castle early to avoid crowds']
          }
        ],
        bestTimeToVisit: 'March to June, September to November',
        localCurrency: 'Euro (€)',
        language: 'Portuguese',
        timezone: 'WET/WEST (UTC+0/+1)'
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
