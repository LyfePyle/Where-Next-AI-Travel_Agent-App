import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suggestion, selections } = body;

    // Generate a unique ID for the trip
    const tripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real app, you would save this to a database
    // For now, we'll just return the trip data with the new ID
    const trip = {
      id: tripId,
      suggestion: {
        ...suggestion,
        id: tripId
      },
      selections: selections || [],
      createdAt: new Date().toISOString(),
      status: 'draft'
    };

    return NextResponse.json(trip);
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // In a real app, you would fetch trips from a database
    return NextResponse.json({ trips: [] });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}
