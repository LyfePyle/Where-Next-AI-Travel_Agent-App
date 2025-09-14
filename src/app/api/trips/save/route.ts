import { NextRequest, NextResponse } from 'next/server';

interface SaveTripRequest {
  tripDetail: any;
  preferences: any;
}

export async function POST(request: NextRequest) {
  try {
    const { tripDetail, preferences }: SaveTripRequest = await request.json();

    // In a real app, this would save to a database
    // For now, we'll create a structured response that can be stored in localStorage
    
    const savedTrip = {
      id: tripDetail.id || `trip-${Date.now()}`,
      title: `${tripDetail.city} Adventure`,
      destination: tripDetail.destination,
      country: tripDetail.country,
      city: tripDetail.city,
      status: 'planning' as const,
      dates: {
        startDate: preferences.startDate,
        endDate: preferences.endDate,
        flexible: false
      },
      budget: {
        total: preferences.budgetAmount,
        saved: Math.round(preferences.budgetAmount * 0.3), // Assume 30% saved
        currency: 'USD'
      },
      travelers: {
        adults: preferences.adults,
        kids: preferences.kids
      },
      preferences: {
        vibes: preferences.vibes,
        budgetStyle: preferences.budgetStyle
      },
      progress: {
        flights: false,
        accommodation: false,
        activities: true, // Planning is started
        planning: 25
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedCost: tripDetail.estimatedTotal,
      fitScore: tripDetail.fitScore,
      image: undefined
    };

    return NextResponse.json({
      success: true,
      trip: savedTrip,
      message: 'Trip saved successfully'
    });

  } catch (error) {
    console.error('Error saving trip:', error);
    return NextResponse.json(
      { error: 'Failed to save trip' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // In a real app, this would fetch from a database
    // For now, return empty array - frontend will use localStorage
    return NextResponse.json({
      trips: []
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}