import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const ItineraryRequestSchema = z.object({
  tripId: z.string(),
  destination: z.string().min(1),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  tripDuration: z.number().int().positive(),
  travelers: z.number().int().positive().optional(),
  budget: z.number().nonnegative().optional(),
  budgetStyle: z.enum(['budget', 'comfortable', 'luxury']).optional(),
  preferences: z.union([z.array(z.string()), z.string()]).optional(),
  from: z.string().optional(),
  singleActivity: z.boolean().optional(),
  dayNumber: z.number().int().positive().optional(),
  existingActivities: z.array(z.string()).optional(),
});

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

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function buildItineraryPreferences(parsed: z.infer<typeof ItineraryRequestSchema>) {
  const preferences = Array.isArray(parsed.preferences)
    ? parsed.preferences
    : parsed.preferences
      ? [parsed.preferences]
      : [];

  return {
    destination: parsed.destination,
    tripDuration: parsed.tripDuration,
    budgetAmount: parsed.budget ?? 3000,
    budgetStyle: parsed.budgetStyle ?? 'comfortable',
    vibes: preferences,
    additionalDetails: '',
    adults: parsed.travelers ?? 2,
    kids: 0,
    from: parsed.from ?? 'Vancouver',
    startDate: parsed.startDate ?? undefined,
    endDate: parsed.endDate ?? undefined,
  };
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('fastly-client-ip') ||
    request.headers.get('true-client-ip') ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit({
    key: `ai-itinerary:${ip}`,
    limit: 5,
    windowMs: 60 * 1000,
  });

  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again soon.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfter),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': String(limit.remaining),
          'X-RateLimit-Reset': String(Math.floor(limit.resetAt / 1000)),
        },
      }
    );
  }

  let tripId = '';
  let requestBody: any = null;
  let itineraryPreferences: ReturnType<typeof buildItineraryPreferences> | null = null;
  try {
    requestBody = await request.json().catch(() => null);
    const parsed = ItineraryRequestSchema.safeParse(requestBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    ({ tripId } = parsed.data);
    itineraryPreferences = buildItineraryPreferences(parsed.data);

    if (parsed.data.singleActivity) {
      const activity = await generateAIActivity({
        destination: itineraryPreferences.destination,
        budgetAmount: itineraryPreferences.budgetAmount,
        budgetStyle: itineraryPreferences.budgetStyle,
        vibes: itineraryPreferences.vibes,
        dayNumber: parsed.data.dayNumber ?? 1,
        existingActivities: parsed.data.existingActivities ?? [],
      });

      return NextResponse.json({ activity });
    }

    const itinerary = await generateAIItinerary(tripId, itineraryPreferences);
    
    return NextResponse.json({ itinerary });
  } catch (error) {
    console.error('AI Itinerary Builder API Error:', error);
    
    // Fallback to mock data if OpenAI fails
    try {
      if (!itineraryPreferences) {
        return NextResponse.json(
          { error: 'Failed to generate itinerary' },
          { status: 500 }
        );
      }

      if (requestBody?.singleActivity) {
        const activity = buildFallbackActivity(
          itineraryPreferences.destination,
          requestBody?.dayNumber ?? 1
        );
        return NextResponse.json({
          activity,
          warning: 'Using fallback data due to AI service issue',
        });
      }

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

type ActivityResponse = {
  id: string;
  name: string;
  type: 'attraction' | 'restaurant' | 'transport' | 'shopping' | 'experience' | 'rest';
  duration: number;
  cost: number;
  location: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  description: string;
  rating: number;
  tips: string[];
  timeSlot: { start: string; end: string };
  bookingUrl?: string;
};

function buildFallbackActivity(destination: string, dayNumber: number): ActivityResponse {
  const city = destination.split(',')[0]?.trim() || destination;
  return {
    id: `fallback-${Date.now()}`,
    name: `${city} Local Experience`,
    type: 'experience',
    duration: 120,
    cost: 35,
    location: {
      name: `${city} Central District`,
      address: `${city} City Center`,
      coordinates: { lat: 35.6762, lng: 139.6503 },
    },
    description: `Explore a recommended local experience in ${city} with flexible timing.`,
    rating: 4.4,
    tips: ['Arrive early to avoid crowds', 'Bring comfortable walking shoes'],
    timeSlot: { start: dayNumber === 1 ? '11:00' : '10:00', end: dayNumber === 1 ? '13:00' : '12:00' },
    bookingUrl: 'https://www.getyourguide.com/?ref=wherenext',
  };
}

async function generateAIActivity(params: {
  destination: string;
  budgetAmount: number;
  budgetStyle: string;
  vibes: string[];
  dayNumber: number;
  existingActivities: string[];
}): Promise<ActivityResponse> {
  if (!openai) {
    return buildFallbackActivity(params.destination, params.dayNumber);
  }

  const existing = params.existingActivities.length
    ? params.existingActivities.join(', ')
    : 'None yet';

  const prompt = `You are a travel expert. Suggest ONE single activity for day ${params.dayNumber} in ${params.destination}.
Budget: $${params.budgetAmount} (${params.budgetStyle})
Vibes: ${params.vibes.join(', ') || 'general'}
Already planned: ${existing}

Return ONLY a single JSON object with these exact fields:
{
  "id": "activity_id",
  "name": "Specific Activity Name",
  "type": "attraction | restaurant | transport | shopping | experience | rest",
  "duration": 120,
  "cost": 25,
  "location": {
    "name": "Specific Location",
    "address": "Full Address",
    "coordinates": {"lat": 0, "lng": 0}
  },
  "description": "Short description",
  "rating": 4.5,
  "tips": ["Tip 1", "Tip 2"],
  "timeSlot": {"start": "13:00", "end": "15:00"},
  "bookingUrl": "https://example.com/book"
}

No markdown. No extra text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return buildFallbackActivity(params.destination, params.dayNumber);
    }

    const obj = JSON.parse(raw.slice(start, end + 1));
    return {
      id: obj.id || `activity_${Date.now()}`,
      name: obj.name || 'Local Activity',
      type: obj.type || 'experience',
      duration: obj.duration || 90,
      cost: obj.cost || 25,
      location: obj.location || {
        name: params.destination,
        address: params.destination,
        coordinates: { lat: 0, lng: 0 },
      },
      description: obj.description || 'AI-suggested activity.',
      rating: obj.rating || 4.4,
      tips: Array.isArray(obj.tips) ? obj.tips : ['Book in advance'],
      timeSlot: obj.timeSlot || { start: '13:00', end: '15:00' },
      bookingUrl: obj.bookingUrl,
    };
  } catch (error: any) {
    console.error('OpenAI activity generation error:', error?.message ?? error);
    return buildFallbackActivity(params.destination, params.dayNumber);
  }
}

async function generateAIItinerary(tripId: string, preferences: any): Promise<ItineraryDay[]> {
  const { tripDuration, vibes, additionalDetails, budgetStyle, budgetAmount, from, destination } = preferences;
  
  // Get destination info - try from preferences first, then fallback to tripId lookup
  let destinationInfo = destination ? { destination, city: destination.split(',')[0].trim() } : await getDestinationInfo(tripId);
  if (!destinationInfo) return [];

  if (!openai) {
    return generateMockItinerary(tripId, preferences);
  }
  
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
      model: "gpt-4o-mini",
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
    
    // Clean and extract JSON from the response
    let jsonString = response || '[]';
    
    // Try to extract JSON if it's wrapped in markdown or other text
    const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
    
    // Clean up common issues
    jsonString = jsonString
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .trim();
    
    let itinerary;
    try {
      itinerary = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.log('Raw response:', response);
      console.log('Cleaned JSON string:', jsonString);
      
      // Fallback to mock data if JSON parsing fails
      console.log('Using fallback mock data due to JSON parse error');
      return generateMockItinerary(tripId, preferences);
    }
    
    return itinerary;
    
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    if (error.message?.includes('401') || error.message?.includes('invalid_api_key')) {
      console.error('OpenAI API key issue - using fallback');
      return generateMockItinerary(tripId, preferences);
    } else {
      throw error;
    }
  }
}

async function getDestinationInfo(tripId: string): Promise<any> {
  const destinations: Record<string, { destination: string; city: string }> = {
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
  
  const dailyBudget = budgetStyle === 'budget' ? 60 : budgetStyle === 'luxury' ? 200 : 120;
  
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

