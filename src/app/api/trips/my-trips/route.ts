import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // In a real app, this would fetch user's trips from a database
    // For now, return empty array so frontend uses localStorage with sample data
    return NextResponse.json({
      trips: []
    });
  } catch (error) {
    console.error('Error fetching user trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}


