import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '@/lib/supabase';

// Input validation schema
const TourGenerationSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  theme: z.string().min(1, "Theme is required"),
  duration: z.number().min(1).max(8, "Duration must be between 1-8 hours"),
  maxDistance: z.number().optional(),
  startLocation: z.string().optional(),
  difficulty: z.enum(['easy', 'moderate', 'challenging']),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'any']),
  interests: z.array(z.string()).optional(),
  budget: z.enum(['free', 'low', 'medium', 'high']),
  groupSize: z.number().min(1).max(10)
});

// Tour themes configuration
const TOUR_THEMES = {
  cultural: {
    name: "Cultural Heritage",
    description: "Explore historical sites, museums, and cultural landmarks",
    icon: "🏛️",
    color: "#8B5CF6"
  },
  food: {
    name: "Food & Dining",
    description: "Discover local cuisine, markets, and restaurants",
    icon: "🍽️",
    color: "#F59E0B"
  },
  nature: {
    name: "Nature & Outdoors",
    description: "Parks, gardens, and natural attractions",
    icon: "🌿",
    color: "#10B981"
  },
  shopping: {
    name: "Shopping & Markets",
    description: "Local markets, boutiques, and shopping districts",
    icon: "🛍️",
    color: "#EC4899"
  },
  photography: {
    name: "Photography",
    description: "Scenic viewpoints and photogenic locations",
    icon: "📸",
    color: "#3B82F6"
  },
  nightlife: {
    name: "Nightlife",
    description: "Bars, clubs, and evening entertainment",
    icon: "🌙",
    color: "#6366F1"
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = TourGenerationSchema.parse(body);
    
    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create the prompt for tour generation
    const prompt = `Generate a detailed walking tour for ${validatedData.destination} with the following specifications:

Theme: ${validatedData.theme}
Duration: ${validatedData.duration} hours
Difficulty: ${validatedData.difficulty}
Time of Day: ${validatedData.timeOfDay}
Budget Level: ${validatedData.budget}
Group Size: ${validatedData.groupSize} people
${validatedData.interests ? `Interests: ${validatedData.interests.join(', ')}` : ''}
${validatedData.startLocation ? `Start Location: ${validatedData.startLocation}` : ''}

Please provide a JSON response with the following structure:
{
  "title": "Tour title",
  "description": "Brief tour description",
  "totalDistance": number in meters,
  "totalDuration": number in minutes,
  "totalWalkTime": number in minutes,
  "difficulty": "easy|moderate|challenging",
  "bestTimeOfDay": "morning|afternoon|evening|any",
  "stops": [
    {
      "name": "Stop name",
      "description": "Brief description",
      "address": "Full address",
      "coordinates": {"lat": number, "lng": number},
      "type": "landmark|restaurant|cafe|museum|park|market|temple|viewpoint",
      "timeToSpend": number in minutes,
      "walkTimeToNext": number in minutes,
      "walkDistanceToNext": number in meters,
      "rating": number 1-5,
      "priceLevel": 1-4,
      "tips": ["tip1", "tip2"],
      "openingHours": "string if applicable"
    }
  ],
  "tags": ["tag1", "tag2"],
  "estimatedCost": number in USD
}

Make sure the tour is realistic, includes popular and hidden gems, and follows a logical walking route.`;

    // Generate tour with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional travel guide and tour planner. Generate detailed, accurate walking tours with specific locations, addresses, and practical information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const tourData = JSON.parse(completion.choices[0].message.content || '{}');

    // Save to Supabase if user is authenticated
    const supabase = createServerSupabaseClient();
    const authHeader = req.headers.get('authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase.from('tours').insert({
          user_id: user.id,
          city: validatedData.destination,
          path_type: validatedData.theme,
          total_distance_m: tourData.totalDistance,
          total_time_min: tourData.totalDuration,
          is_paid: false,
          raw_prompt: body,
          raw_response: tourData
        });
      }
    }

    return NextResponse.json({ 
      ok: true, 
      data: {
        ...tourData,
        theme: TOUR_THEMES[validatedData.theme as keyof typeof TOUR_THEMES] || TOUR_THEMES.cultural,
        destination: validatedData.destination,
        createdAt: new Date(),
        isPremium: false
      }
    });

  } catch (error: any) {
    console.error('Tour generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid input data', 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to generate tour' 
    }, { status: 500 });
  }
} 