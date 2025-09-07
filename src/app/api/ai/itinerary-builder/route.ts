import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ItineraryRequest {
  tripId: string;
  preferences: {
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
  };
}

interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
  estimatedCost: number;
  tips: string[];
  weather: {
    temp: number;
    condition: string;
    icon: string;
  };
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { tripId, preferences }: ItineraryRequest = await request.json();
    
    // Generate AI-powered itinerary based on preferences
    const itinerary = await generateAIItinerary(tripId, preferences);
    
    return NextResponse.json({ itinerary });
  } catch (error) {
    console.error('AI Itinerary Builder API Error:', error);
    
    // Fallback to mock data if OpenAI fails
    try {
      const fallbackItinerary = await generateMockItinerary(tripId, preferences);
      return NextResponse.json({ 
        itinerary: fallbackItinerary,
        warning: 'Using fallback data due to AI service issue'
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to generate itinerary' },
        { status: 500 }
      );
    }
  }
}

async function generateAIItinerary(tripId: string, preferences: any): Promise<ItineraryDay[]> {
  const { tripDuration, vibes, additionalDetails, budgetStyle, budgetAmount, from } = preferences;
  
  // Get destination info
  const destinationInfo = await getDestinationInfo(tripId);
  if (!destinationInfo) return [];
  
  const prompt = `You are an expert travel planner. Create a detailed ${tripDuration}-day itinerary for ${destinationInfo.destination}.

User Preferences:
- From: ${from}
- Duration: ${tripDuration} days
- Budget: $${budgetAmount} (${budgetStyle})
- Vibes: ${vibes.join(', ')}
- Additional Details: ${additionalDetails}

Create a detailed day-by-day itinerary with:

1. Each day should include:
   - A creative title for the day
   - 3-4 specific activities with timing
   - Estimated daily cost (consider budget style)
   - 2-3 practical tips for that day
   - Expected weather conditions

2. Consider:
   - User's vibes and interests
   - Budget constraints
   - Logical flow and transportation
   - Mix of popular attractions and hidden gems
   - Local customs and timing
   - Seasonal factors

3. Budget breakdown:
   - Thrifty: Focus on free/low-cost activities
   - Comfortable: Mix of paid and free activities
   - Splurge: Premium experiences and dining

Return as JSON array with this structure:
[
  {
    "day": 1,
    "title": "Creative Day Title",
    "activities": ["Activity 1", "Activity 2", "Activity 3"],
    "estimatedCost": 80,
    "tips": ["Tip 1", "Tip 2"],
    "weather": {"temp": 22, "condition": "Sunny", "icon": "☀️"}
  }
]

Make it personalized, practical, and enjoyable for their specific preferences.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a travel expert. Always respond with valid JSON arrays containing detailed itineraries."
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
    const itinerary = JSON.parse(response || '[]');
    
    return itinerary;
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error.message.includes('401') || error.message.includes('invalid_api_key')) {
      console.error('OpenAI API key issue - using fallback');
      return generateMockItinerary(tripId, preferences);
    } else {
      throw error;
    }
  }
}

async function getDestinationInfo(tripId: string): Promise<any> {
  const destinations = {
    '1': { destination: 'Lisbon, Portugal', city: 'Lisbon' },
    '2': { destination: 'Barcelona, Spain', city: 'Barcelona' },
    '3': { destination: 'Porto, Portugal', city: 'Porto' },
    '4': { destination: 'Valencia, Spain', city: 'Valencia' },
    '5': { destination: 'Seville, Spain', city: 'Seville' },
    '6': { destination: 'Madrid, Spain', city: 'Madrid' },
    '7': { destination: 'Granada, Spain', city: 'Granada' }
  };
  
  return destinations[tripId] || null;
}

async function generateMockItinerary(tripId: string, preferences: any): Promise<ItineraryDay[]> {
  const { tripDuration, vibes, budgetStyle } = preferences;
  const destinationInfo = await getDestinationInfo(tripId);
  
  if (!destinationInfo) return [];
  
  // Generate mock itinerary based on duration
  return Array.from({ length: tripDuration }, (_, i) => ({
    day: i + 1,
    title: `Day ${i + 1} in ${destinationInfo.city}`,
    activities: [
      `Morning: Explore ${destinationInfo.city} highlights`,
      `Afternoon: Visit local attractions`,
      `Evening: Enjoy local cuisine`
    ],
    estimatedCost: budgetStyle === 'thrifty' ? 40 : budgetStyle === 'splurge' ? 120 : 80,
    tips: [
      'Wear comfortable walking shoes',
      'Book popular attractions in advance'
    ],
    weather: { temp: 22, condition: 'Sunny', icon: '☀️' }
  }));
}

