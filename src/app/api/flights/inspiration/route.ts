import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock flight inspiration data
    const flights = [
      {
        id: '1',
        origin: 'Vancouver',
        destination: 'Tokyo',
        price: 850,
        airline: 'Air Canada',
        duration: '10h 30m',
        stops: 0,
        departureTime: '10:30 AM',
        arrivalTime: '2:00 PM +1'
      },
      {
        id: '2',
        origin: 'Vancouver',
        destination: 'London',
        price: 720,
        airline: 'British Airways',
        duration: '9h 45m',
        stops: 0,
        departureTime: '8:15 PM',
        arrivalTime: '2:00 PM +1'
      },
      {
        id: '3',
        origin: 'Vancouver',
        destination: 'Paris',
        price: 890,
        airline: 'Air France',
        duration: '10h 15m',
        stops: 0,
        departureTime: '11:45 AM',
        arrivalTime: '8:00 AM +1'
      },
      {
        id: '4',
        origin: 'Vancouver',
        destination: 'Sydney',
        price: 1250,
        airline: 'Qantas',
        duration: '15h 30m',
        stops: 1,
        departureTime: '11:30 PM',
        arrivalTime: '8:00 AM +2'
      },
      {
        id: '5',
        origin: 'Vancouver',
        destination: 'New York',
        price: 450,
        airline: 'WestJet',
        duration: '5h 15m',
        stops: 0,
        departureTime: '7:00 AM',
        arrivalTime: '3:15 PM'
      },
      {
        id: '6',
        origin: 'Vancouver',
        destination: 'Barcelona',
        price: 980,
        airline: 'Iberia',
        duration: '11h 20m',
        stops: 1,
        departureTime: '2:30 PM',
        arrivalTime: '11:50 AM +1'
      }
    ];

    return NextResponse.json({
      success: true,
      flights,
      message: 'Flight inspiration data loaded successfully'
    });
  } catch (error) {
    console.error('Error loading flight inspiration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load flight inspiration' },
      { status: 500 }
    );
  }
}
