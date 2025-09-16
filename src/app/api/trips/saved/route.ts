import { NextRequest, NextResponse } from 'next/server';

interface SavedTrip {
  id: string;
  destination: string;
  estimatedCost: number;
  reason?: string;
  fitScore?: number;
  bestTime?: string;
  source: string;
  savedAt: string;
  tripDuration?: number;
  travelers?: number;
}

// In-memory storage for demo purposes
// In production, this would be stored in a database
let savedTrips: SavedTrip[] = [];

export async function GET() {
  try {
    // Return saved trips sorted by most recently saved
    const sortedTrips = savedTrips.sort((a, b) => 
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
    
    return NextResponse.json(sortedTrips);
  } catch (error) {
    console.error('Error fetching saved trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved trips' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { destination, estimatedCost, reason, fitScore, bestTime, source, tripDuration, travelers } = body;

    // Validate required fields
    if (!destination || !estimatedCost || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: destination, estimatedCost, source' },
        { status: 400 }
      );
    }

    // Check if we're at the free plan limit (3 trips)
    if (savedTrips.length >= 3) {
      return NextResponse.json(
        { error: 'Free plan limit reached. Upgrade to Pro to save unlimited trips.' },
        { status: 429 } // Too Many Requests
      );
    }

    // Check if destination is already saved
    const existingTrip = savedTrips.find(trip => 
      trip.destination.toLowerCase() === destination.toLowerCase()
    );

    if (existingTrip) {
      return NextResponse.json(
        { error: 'This destination is already in your saved trips' },
        { status: 409 } // Conflict
      );
    }

    // Create new saved trip
    const newTrip: SavedTrip = {
      id: `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      destination,
      estimatedCost: Number(estimatedCost),
      reason,
      fitScore: fitScore ? Number(fitScore) : undefined,
      bestTime,
      source,
      savedAt: new Date().toISOString(),
      tripDuration: tripDuration ? Number(tripDuration) : undefined,
      travelers: travelers ? Number(travelers) : undefined
    };

    savedTrips.push(newTrip);

    return NextResponse.json({ 
      success: true, 
      trip: newTrip,
      message: 'Trip saved successfully!'
    });

  } catch (error) {
    console.error('Error saving trip:', error);
    return NextResponse.json(
      { error: 'Failed to save trip' },
      { status: 500 }
    );
  }
}
