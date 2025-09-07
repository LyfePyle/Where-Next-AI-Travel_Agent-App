import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Amadeus from 'amadeus';

export async function GET(request: NextRequest) {
  const results = {
    openai: { status: 'unknown', message: '', data: null },
    amadeus: { status: 'unknown', message: '', data: null },
    ai_suggestions: { status: 'unknown', message: '', data: null },
    ai_trip_details: { status: 'unknown', message: '', data: null },
    ai_itinerary: { status: 'unknown', message: '', data: null },
    ai_walking_tour: { status: 'unknown', message: '', data: null },
    flights_search: { status: 'unknown', message: '', data: null },
    hotels_search: { status: 'unknown', message: '', data: null },
    timestamp: new Date().toISOString()
  };

  // Test OpenAI
  try {
    console.log('Testing OpenAI...');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say 'OpenAI is working!' and nothing else." }],
      max_tokens: 20
    });
    results.openai = { status: 'success', message: 'OpenAI API is working', data: completion.choices[0].message.content };
  } catch (error) {
    results.openai = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error', data: null };
  }

  // Test Amadeus
  try {
    console.log('Testing Amadeus...');
    const amadeus = new Amadeus({
      clientId: process.env.AMADEUS_API_KEY,
      clientSecret: process.env.AMADEUS_API_SECRET,
      hostname: 'test'
    });
    const response = await amadeus.referenceData.locations.hotel.get({ keyword: 'PARI', subType: 'HOTEL_LEISURE' });
    results.amadeus = { status: 'success', message: `Amadeus API is working - Found ${response.data.length} hotels`, data: response.data.slice(0, 2) };
  } catch (error) {
    results.amadeus = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error', data: null };
  }

  // Test AI Suggestions API
  try {
    console.log('Testing AI Suggestions...');
    const response = await fetch(`${request.nextUrl.origin}/api/ai/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Vancouver',
        tripDuration: 7,
        budgetAmount: 2000,
        budgetStyle: 'comfortable',
        vibes: ['culture', 'food'],
        additionalDetails: 'Looking for authentic experiences',
        adults: 2,
        kids: 0
      })
    });
    const data = await response.json();
    results.ai_suggestions = { 
      status: 'success', 
      message: `AI Suggestions working - Generated ${data.suggestions?.length || 0} suggestions`, 
      data: data.suggestions?.slice(0, 1) 
    };
  } catch (error) {
    results.ai_suggestions = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error', data: null };
  }

  // Test AI Trip Details API
  try {
    console.log('Testing AI Trip Details...');
    const response = await fetch(`${request.nextUrl.origin}/api/ai/trip-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: '1',
        preferences: {
          from: 'Vancouver',
          tripDuration: 7,
          budgetAmount: 2000,
          budgetStyle: 'comfortable',
          vibes: ['culture', 'food'],
          additionalDetails: 'Looking for authentic experiences',
          adults: 2,
          kids: 0
        }
      })
    });
    const data = await response.json();
    results.ai_trip_details = { 
      status: 'success', 
      message: 'AI Trip Details working', 
      data: data.tripDetail ? { destination: data.tripDetail.destination, hasItinerary: !!data.tripDetail.dailyItinerary } : null 
    };
  } catch (error) {
    results.ai_trip_details = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error', data: null };
  }

  // Test AI Itinerary API
  try {
    console.log('Testing AI Itinerary...');
    const response = await fetch(`${request.nextUrl.origin}/api/ai/itinerary-builder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: '1',
        preferences: {
          from: 'Vancouver',
          tripDuration: 7,
          budgetAmount: 2000,
          budgetStyle: 'comfortable',
          vibes: ['culture', 'food'],
          additionalDetails: 'Looking for authentic experiences',
          adults: 2,
          kids: 0
        }
      })
    });
    const data = await response.json();
    results.ai_itinerary = { 
      status: 'success', 
      message: `AI Itinerary working - Generated ${data.itinerary?.length || 0} days`, 
      data: data.itinerary?.slice(0, 1) 
    };
  } catch (error) {
    results.ai_itinerary = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error', data: null };
  }

  // Test AI Walking Tour API
  try {
    console.log('Testing AI Walking Tour...');
    const response = await fetch(`${request.nextUrl.origin}/api/ai/walking-tour`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'Lisbon, Portugal',
        preferences: {
          duration: 3,
          interests: ['culture', 'history'],
          fitnessLevel: 'moderate',
          groupSize: 2,
          startLocation: 'City Center'
        }
      })
    });
    const data = await response.json();
    results.ai_walking_tour = { 
      status: 'success', 
      message: 'AI Walking Tour working', 
      data: data.walkingTour ? { title: data.walkingTour.title, stops: data.walkingTour.stops?.length } : null 
    };
  } catch (error) {
    results.ai_walking_tour = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error', data: null };
  }

  // Test Flight Search API
  try {
    console.log('Testing Flight Search...');
    const response = await fetch(`${request.nextUrl.origin}/api/flights/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originLocationCode: 'YVR',
        destinationLocationCode: 'LAX',
        departureDate: '2024-02-01',
        adults: 1,
        currencyCode: 'USD'
      })
    });
    const data = await response.json();
    results.flights_search = { 
      status: 'success', 
      message: `Flight Search working - Found ${data.flights?.length || 0} flights`, 
      data: data.flights?.slice(0, 1) 
    };
  } catch (error) {
    results.flights_search = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error', data: null };
  }

  // Test Hotel Search API
  try {
    console.log('Testing Hotel Search...');
    const response = await fetch(`${request.nextUrl.origin}/api/hotels/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cityCode: 'LAX',
        checkInDate: '2024-02-01',
        checkOutDate: '2024-02-08',
        adults: 2,
        currency: 'USD'
      })
    });
    const data = await response.json();
    results.hotels_search = { 
      status: 'success', 
      message: `Hotel Search working - Found ${data.hotels?.length || 0} hotels`, 
      data: data.hotels?.slice(0, 1) 
    };
  } catch (error) {
    results.hotels_search = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error', data: null };
  }

  return NextResponse.json(results);
}
