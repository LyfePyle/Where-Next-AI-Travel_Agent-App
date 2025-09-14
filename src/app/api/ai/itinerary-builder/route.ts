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
    const requestBody = await request.json();
    const { tripId, destination, startDate, endDate, tripDuration, travelers, budget, preferences } = requestBody;
    
    // Convert to expected format
    const itineraryPreferences = {
      destination,
      tripDuration,
      budgetAmount: budget,
      budgetStyle: 'comfortable', // default
      vibes: Array.isArray(preferences) ? preferences : [preferences].filter(Boolean),
      additionalDetails: '',
      adults: travelers || 2,
      kids: 0,
      from: 'Vancouver' // default
    };
    
    // Generate AI-powered itinerary based on preferences
    const itinerary = await generateAIItinerary(tripId, itineraryPreferences);
    
    return NextResponse.json({ itinerary });
  } catch (error) {
    console.error('AI Itinerary Builder API Error:', error);
    
    // Fallback to mock data if OpenAI fails
    try {
      const fallbackItinerary = await generateMockItinerary(tripId, itineraryPreferences);
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
  const { tripDuration, vibes, additionalDetails, budgetStyle, budgetAmount, from, destination } = preferences;
  
  // Get destination info - try from preferences first, then fallback to tripId lookup
  let destinationInfo = destination ? { destination, city: destination.split(',')[0].trim() } : await getDestinationInfo(tripId);
  if (!destinationInfo) return [];
  
  const prompt = `You are an expert travel planner. Create a detailed ${tripDuration}-day itinerary for ${destinationInfo.destination}.

User Preferences:
- From: ${from}
- Duration: ${tripDuration} days
- Budget: $${budgetAmount} (${budgetStyle})
- Vibes: ${vibes.join(', ')}
- Additional Details: ${additionalDetails}

Create a comprehensive day-by-day itinerary with detailed activities:

Return as JSON array with this EXACT structure:
[
  {
    "day": 1,
    "title": "Creative Day Title",
    "theme": "Cultural Exploration",
    "estimatedCost": 80,
    "totalDuration": 480,
    "activities": [
      {
        "id": "activity_1_1",
        "name": "Specific Activity Name",
        "type": "attraction",
        "duration": 120,
        "cost": 25,
        "location": {
          "name": "Specific Location",
          "address": "Full Address",
          "coordinates": {"lat": 0, "lng": 0}
        },
        "description": "Detailed description of what to expect",
        "rating": 4.5,
        "tips": ["Specific tip 1", "Specific tip 2"],
        "timeSlot": {
          "start": "09:00",
          "end": "11:00"
        },
        "bookingUrl": "https://example.com/book"
      }
    ],
    "notes": "Overall day guidance",
    "weather": {"temp": 22, "condition": "Sunny", "icon": "☀️"},
    "walkingTour": {
      "name": "Optional Walking Tour",
      "duration": 180,
      "stops": 6,
      "difficulty": "moderate"
    }
  }
]

IMPORTANT REQUIREMENTS:
1. Generate 4-6 activities per day with specific times (8 AM to 8 PM)
2. Include exact locations, addresses, and realistic costs
3. Mix activity types: attraction, restaurant, transport, shopping, experience
4. Ensure activities flow logically by location and time
5. Consider ${budgetStyle} budget: thrifty (low-cost), comfortable (mixed), splurge (premium)
6. Match ${vibes.join(', ')} preferences in activity selection
7. Include practical tips for each activity
8. Use real place names and attractions in ${destinationInfo.destination}

Make it practical, detailed, and perfectly tailored to their preferences.`;

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

async function generateMockItinerary(tripId: string, preferences: any): Promise<any[]> {
  const { tripDuration, vibes, budgetStyle, destination } = preferences;
  
  // Get destination info - try from preferences first, then fallback to tripId lookup
  let destinationInfo = destination ? { destination, city: destination.split(',')[0].trim() } : await getDestinationInfo(tripId);
  if (!destinationInfo) return [];
  
  const dailyBudget = budgetStyle === 'thrifty' ? 60 : budgetStyle === 'splurge' ? 200 : 120;
  
  // Generate enhanced mock itinerary based on duration
  return Array.from({ length: tripDuration }, (_, i) => ({
    day: i + 1,
    title: `Day ${i + 1}: Exploring ${destinationInfo.city}`,
    theme: ['Cultural Discovery', 'Local Flavors', 'Hidden Gems', 'Adventure Day', 'Relaxation', 'Shopping & Leisure', 'Final Exploration'][i % 7],
    estimatedCost: dailyBudget,
    totalDuration: 480,
    activities: [
      {
        id: `activity_${i + 1}_1`,
        name: `Morning at ${destinationInfo.city} Main Square`,
        type: 'attraction',
        duration: 120,
        cost: dailyBudget * 0.15,
        location: {
          name: `${destinationInfo.city} Central Square`,
          address: `Main Square, ${destinationInfo.city}`,
          coordinates: { lat: 0, lng: 0 }
        },
        description: `Start your day exploring the heart of ${destinationInfo.city} with its historic architecture and vibrant atmosphere.`,
        rating: 4.5,
        tips: ['Arrive early to avoid crowds', 'Bring a camera for great photos'],
        timeSlot: { start: '09:00', end: '11:00' },
        bookingUrl: `https://www.getyourguide.com/s/?q=${destinationInfo.city}&ref=wherenext`
      },
      {
        id: `activity_${i + 1}_2`,
        name: `Local Market Experience`,
        type: 'experience',
        duration: 90,
        cost: dailyBudget * 0.2,
        location: {
          name: `${destinationInfo.city} Market`,
          address: `Market Street, ${destinationInfo.city}`,
          coordinates: { lat: 0, lng: 0 }
        },
        description: `Immerse yourself in local culture at the traditional market with fresh produce and local specialties.`,
        rating: 4.3,
        tips: ['Try local specialties', 'Bring cash for small vendors'],
        timeSlot: { start: '11:30', end: '13:00' },
        bookingUrl: `https://www.viator.com/searchresults/all?destination=${destinationInfo.city}&ref=wherenext`
      },
      {
        id: `activity_${i + 1}_3`,
        name: `Traditional Lunch`,
        type: 'restaurant',
        duration: 75,
        cost: dailyBudget * 0.25,
        location: {
          name: `Local Restaurant`,
          address: `Restaurant District, ${destinationInfo.city}`,
          coordinates: { lat: 0, lng: 0 }
        },
        description: `Enjoy authentic local cuisine at a highly-rated traditional restaurant.`,
        rating: 4.6,
        tips: ['Try the local specialty dish', 'Make reservations if possible'],
        timeSlot: { start: '13:15', end: '14:30' },
        bookingUrl: `https://www.opentable.com/s/?covers=2&query=${destinationInfo.city}&ref=wherenext`
      },
      {
        id: `activity_${i + 1}_4`,
        name: `Afternoon Cultural Site`,
        type: 'attraction',
        duration: 150,
        cost: dailyBudget * 0.3,
        location: {
          name: `${destinationInfo.city} Museum`,
          address: `Cultural District, ${destinationInfo.city}`,
          coordinates: { lat: 0, lng: 0 }
        },
        description: `Discover the rich history and culture of ${destinationInfo.city} at this renowned cultural institution.`,
        rating: 4.7,
        tips: ['Audio guide recommended', 'Check for special exhibitions'],
        timeSlot: { start: '15:00', end: '17:30' },
        bookingUrl: `https://www.getyourguide.com/s/?q=${destinationInfo.city}&ref=wherenext`
      }
    ],
    notes: `Perfect day to explore the essence of ${destinationInfo.city}. Comfortable walking shoes recommended.`,
    weather: { temp: 22, condition: 'Sunny', icon: '☀️' },
    walkingTour: {
      name: `${destinationInfo.city} Historical Walking Tour`,
      duration: 180,
      stops: 8,
      difficulty: 'moderate'
    }
  }));
}

