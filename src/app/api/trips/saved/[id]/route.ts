import { NextRequest, NextResponse } from 'next/server';

// This would be imported from the main saved trips route in a real implementation
// For now, we'll use a reference to the same in-memory storage
// In production, this would be stored in a database

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

// Mock storage - in production this would be a database
let savedTrips: SavedTrip[] = [];

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id;

    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      );
    }

    // Find the trip to delete
    const tripIndex = savedTrips.findIndex(trip => trip.id === tripId);

    if (tripIndex === -1) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    // Remove the trip from the array
    const deletedTrip = savedTrips.splice(tripIndex, 1)[0];

    return NextResponse.json({ 
      success: true, 
      message: 'Trip deleted successfully',
      deletedTrip 
    });

  } catch (error) {
    console.error('Error deleting saved trip:', error);
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}
