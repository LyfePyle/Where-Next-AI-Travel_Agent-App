import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock AI trip recommendations data
    const recommendations = [
      {
        id: '1',
        destination: 'Lisbon, Portugal',
        reason: 'Perfect weather, rich culture, and amazing food scene. Great value for money with authentic experiences.',
        fitScore: 92,
        estimatedCost: 1350,
        bestTime: 'March-May',
        highlights: ['Historic tram rides', 'Pasteis de Belém', 'Fado music', 'Time Out Market'],
        weather: { temp: 22, condition: 'Sunny', icon: '☀️' },
        crowdLevel: 'Medium',
        seasonality: 'Perfect weather, moderate crowds'
      },
      {
        id: '2',
        destination: 'Barcelona, Spain',
        reason: 'Vibrant city with stunning architecture and Mediterranean charm. Perfect for culture and food lovers.',
        fitScore: 88,
        estimatedCost: 1850,
        bestTime: 'April-June',
        highlights: ['Sagrada Familia', 'Gaudí architecture', 'Beach life', 'Tapas culture'],
        weather: { temp: 24, condition: 'Warm', icon: '🌤️' },
        crowdLevel: 'High',
        seasonality: 'Peak season, book early'
      },
      {
        id: '3',
        destination: 'Porto, Portugal',
        reason: 'Authentic Portuguese charm with world-famous port wine. Great value destination for authentic experiences.',
        fitScore: 85,
        estimatedCost: 1100,
        bestTime: 'March-May',
        highlights: ['Port wine tasting', 'Historic center', 'River views', 'Authentic cuisine'],
        weather: { temp: 20, condition: 'Mild', icon: '🌦️' },
        crowdLevel: 'Low',
        seasonality: 'Shoulder season, great deals'
      },
      {
        id: '4',
        destination: 'Valencia, Spain',
        reason: 'Modern city with futuristic architecture and paella birthplace. Perfect blend of old and new.',
        fitScore: 82,
        estimatedCost: 1400,
        bestTime: 'March-May',
        highlights: ['Paella birthplace', 'City of Arts', 'Beaches', 'Futuristic architecture'],
        weather: { temp: 26, condition: 'Sunny', icon: '☀️' },
        crowdLevel: 'Medium',
        seasonality: 'Great weather, moderate crowds'
      },
      {
        id: '5',
        destination: 'Seville, Spain',
        reason: 'Andalusian charm with flamenco and historic palaces. Rich cultural heritage and vibrant nightlife.',
        fitScore: 80,
        estimatedCost: 1500,
        bestTime: 'March-May',
        highlights: ['Alcázar Palace', 'Flamenco shows', 'Orange trees', 'Tapas bars'],
        weather: { temp: 28, condition: 'Hot', icon: '🌡️' },
        crowdLevel: 'Medium',
        seasonality: 'Warm weather, cultural events'
      },
      {
        id: '6',
        destination: 'Madrid, Spain',
        reason: 'Cosmopolitan capital with world-class museums and vibrant atmosphere. Perfect for art and culture.',
        fitScore: 78,
        estimatedCost: 1700,
        bestTime: 'March-May',
        highlights: ['Prado Museum', 'Royal Palace', 'Retiro Park', 'Madrid nightlife'],
        weather: { temp: 25, condition: 'Warm', icon: '🌤️' },
        crowdLevel: 'High',
        seasonality: 'Peak season, cultural events'
      }
    ];

    return NextResponse.json({
      success: true,
      recommendations,
      message: 'AI trip recommendations loaded successfully',
      source: 'mock' // Indicates this is mock data for now
    });
  } catch (error) {
    console.error('Error loading AI trip recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load AI trip recommendations' },
      { status: 500 }
    );
  }
}
