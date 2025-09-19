import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface TripPreferences {
  from: string;
  tripDuration: number;
  budgetAmount: number;
  budgetStyle: string;
  vibes: string[];
  additionalDetails: string;
  adults: number;
  kids: number;
  startDate?: string;
  endDate?: string;
}

interface TripDetail {
  id: string;
  destination: string;
  country: string;
  city: string;
  fitScore: number;
  description: string;
  weather: {
    temp: number;
    condition: string;
    icon: string;
  };
  crowdLevel: 'Low' | 'Medium' | 'High';
  seasonality: string;
  estimatedTotal: number;
  flightBand: {
    min: number;
    max: number;
  };
  hotelBand: {
    min: number;
    max: number;
    style: string;
    area: string;
  };
  highlights: string[];
  whyItFits: string;
  dailyItinerary: {
    day: number;
    title: string;
    activities: string[];
    estimatedCost: number;
    tips: string[];
  }[];
  bestTimeToVisit: string;
  localCurrency: string;
  language: string;
  timezone: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different parameter formats
    const tripId = body.tripId || `trip_${Date.now()}`;
    const destination = body.destination;
    const preferences = body.preferences || {
      from: body.from || 'Unknown',
      tripDuration: body.duration || 5,
      budgetAmount: body.budget || 3000,
      budgetStyle: 'medium',
      vibes: body.interests || ['culture'],
      additionalDetails: '',
      adults: 2,
      kids: 0
    };
    
    // Generate AI-powered trip details based on preferences and destination
    const tripDetail = await generateAITripDetails(tripId, preferences, destination);
    
    if (!tripDetail) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ tripDetail });
  } catch (error) {
    console.error('AI Trip Details API Error:', error);
    
    // Fallback to mock data if OpenAI fails
    try {
      const fallbackTripDetail = await generateMockTripDetails(tripId, preferences, destination);
      return NextResponse.json({ 
        tripDetail: fallbackTripDetail,
        warning: 'Using fallback data due to AI service issue'
      });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return NextResponse.json(
        { error: 'Failed to generate trip details' },
        { status: 500 }
      );
    }
  }
}

async function generateAITripDetails(tripId: string, preferences: TripPreferences, destination?: string): Promise<TripDetail | null> {
  const { tripDuration, vibes, additionalDetails, budgetAmount, budgetStyle, from } = preferences;
  
  // Use the actual destination from the suggestion, or fallback to a default
  const actualDestination = destination || 'Lisbon, Portugal';
  const [city, country] = actualDestination.includes(',') 
    ? [actualDestination.split(',')[0].trim(), actualDestination.split(',')[1].trim()]
    : [actualDestination, 'Unknown Country'];
  
  const prompt = `You are an expert travel planner. Create detailed trip information for ${actualDestination}.

User Preferences:
- From: ${from}
- Duration: ${tripDuration} days
- Budget: $${budgetAmount} (${budgetStyle})
- Vibes: ${vibes.join(', ')}
- Additional Details: ${additionalDetails}

Create a detailed trip plan with:

1. Daily Itinerary (${tripDuration} days):
   - Create specific day-by-day activities with realistic timing
   - Mix popular attractions with hidden gems based on their vibes
   - Include specific restaurant recommendations and meal times
   - Add transportation details between activities
   - Consider their budget and travel style
   - Include estimated costs for each day

2. Practical Information:
   - Best time to visit with specific months
   - Local currency and current exchange rates
   - Language tips and useful phrases
   - Timezone information

3. Enhanced Details:
   - Current weather expectations
   - Crowd levels and peak times to avoid
   - Local customs and etiquette tips
   - Transportation options and costs
   - Safety considerations

Return as JSON with this structure:
{
  "id": "${tripId}",
  "destination": "${actualDestination}",
  "country": "${country}",
  "city": "${city}",
  "fitScore": 92,
  "description": "Detailed description of why this destination is perfect",
  "weather": {"temp": 22, "condition": "Sunny", "icon": "☀️"},
  "crowdLevel": "Medium",
  "seasonality": "Perfect weather, moderate crowds",
  "estimatedTotal": ${Math.round(budgetAmount * 0.8)},
  "flightBand": {"min": 650, "max": 780},
  "hotelBand": {"min": 90, "max": 130, "style": "Boutique", "area": "City Center"},
  "highlights": ["Specific highlight 1", "Specific highlight 2", "Specific highlight 3"],
  "whyItFits": "Detailed explanation of why this destination matches their preferences",
  "dailyItinerary": [
    {
      "day": 1,
      "title": "Arrival and First Impressions",
      "activities": [
        "9:00 AM - Arrive at airport and transfer to hotel",
        "11:00 AM - Check-in and freshen up",
        "12:30 PM - Lunch at [specific restaurant name]",
        "2:00 PM - Walking tour of [specific area]",
        "4:00 PM - Visit [specific attraction]",
        "6:30 PM - Dinner at [specific restaurant]",
        "8:00 PM - Evening stroll along [specific location]"
      ],
      "estimatedCost": 120,
      "tips": ["Book airport transfer in advance", "Wear comfortable walking shoes"]
    }
  ],
  "bestTimeToVisit": "March to June, September to November",
  "localCurrency": "Local currency code",
  "language": "Local language",
  "timezone": "Local timezone"
}

Make each day's itinerary specific and actionable with real place names, timing, and costs. Consider their vibes: ${vibes.join(', ')} and budget style: ${budgetStyle}.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a travel expert. Always respond with valid JSON containing detailed trip information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const response = completion.choices[0].message.content;
    const tripDetail = JSON.parse(response || '{}');
    
    return tripDetail;
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error.message.includes('401') || error.message.includes('invalid_api_key')) {
      console.error('OpenAI API key issue - using fallback');
      return generateMockTripDetails(tripId, preferences, destination);
    } else {
      throw error;
    }
  }
}

async function generateMockTripDetails(tripId: string, preferences: TripPreferences, destination?: string): Promise<TripDetail | null> {
  const actualDestination = destination || 'Unknown Destination';
  const [city, country] = actualDestination.includes(',') 
    ? [actualDestination.split(',')[0].trim(), actualDestination.split(',')[1].trim()]
    : [actualDestination, 'Unknown Country'];
  
  const { tripDuration, budgetAmount } = preferences;
  
  // Generate daily itinerary
  const dailyItinerary = Array.from({ length: tripDuration }, (_, i) => ({
    day: i + 1,
    title: i === 0 ? `Arrival and First Impressions` : `Day ${i + 1} in ${city}`,
    activities: [
      i === 0 ? `9:00 AM - Arrive at airport and transfer to hotel` : `9:00 AM - Breakfast at local café`,
      i === 0 ? `11:00 AM - Check-in and freshen up` : `10:00 AM - Explore ${city} highlights`,
      i === 0 ? `12:30 PM - Lunch at local restaurant` : `12:30 PM - Lunch at traditional eatery`,
      i === 0 ? `2:00 PM - Walking tour of city center` : `2:00 PM - Visit local attractions`,
      i === 0 ? `4:00 PM - Visit main landmark` : `4:00 PM - Cultural experience`,
      i === 0 ? `6:30 PM - Dinner at recommended restaurant` : `6:30 PM - Dinner at local favorite`,
      i === 0 ? `8:00 PM - Evening stroll along waterfront` : `8:00 PM - Evening entertainment`
    ],
    estimatedCost: Math.round(budgetAmount / tripDuration * 0.8),
    tips: [
      i === 0 ? "Book airport transfer in advance" : "Wear comfortable walking shoes",
      i === 0 ? "Have local currency ready" : "Bring water and snacks",
      "Check opening hours for attractions"
    ]
  }));
  
  return {
    id: tripId,
    destination: actualDestination,
    country: country,
    city: city,
    fitScore: 92,
    description: `Experience the magic of ${city} with this personalized itinerary.`,
    weather: { temp: 22, condition: 'Sunny', icon: '☀️' },
    crowdLevel: 'Medium',
    seasonality: 'Perfect weather, moderate crowds',
    estimatedTotal: Math.round(budgetAmount * 0.8),
    flightBand: { min: 650, max: 780 },
    hotelBand: { min: 90, max: 130, style: 'Boutique', area: 'City Center' },
    highlights: ['Historic sites', 'Local cuisine', 'Cultural experiences'],
    whyItFits: 'Perfect match for your travel preferences',
    dailyItinerary,
    bestTimeToVisit: 'March - October',
    localCurrency: country === 'Portugal' ? 'Euro (€)' : 'Local currency',
    language: country === 'Portugal' ? 'Portuguese' : 'Local language',
    timezone: 'Local timezone'
  };
}
