import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { createApiSupabaseClient } from '@/lib/supabase';

// Trip planning input schema
const TripPlanningSchema = z.object({
  departureCity: z.string().min(1, "Departure city is required"),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.string().optional(),
  travelers: z.number().min(1).max(10, "1-10 travelers allowed"),
  interests: z.array(z.string()).optional(),
  whenever: z.boolean().default(false),
  goAnywhere: z.boolean().default(false),
  planningMode: z.enum(['cheapest', 'fastest', 'easiest']).default('cheapest')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = TripPlanningSchema.parse(body);
    
    const supabase = createApiSupabaseClient();
    const authHeader = req.headers.get('authorization');
    
    let user = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      user = authUser;
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Calculate trip duration if dates are provided
    let daysDiff = 7; // Default to 7 days
    if (!validatedData.whenever && validatedData.startDate && validatedData.endDate) {
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(validatedData.endDate);
      daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Create the planning prompt with mode-specific instructions
    const modeInstructions = {
      cheapest: "Prioritize budget-friendly options: look for deals, consider budget airlines, affordable accommodations, and cost-effective activities. Focus on maximizing value for money.",
      fastest: "Prioritize speed and efficiency: prefer direct flights, minimize layovers, choose convenient transportation options, and optimize for time savings.",
      easiest: "Prioritize convenience and simplicity: avoid complex itineraries, prefer direct routes, choose tourist-friendly destinations, and minimize logistical challenges."
    };

    const prompt = `Plan a ${daysDiff}-day trip with the following requirements:

Departure: ${validatedData.departureCity}
${validatedData.goAnywhere ? 'Destination: Anywhere (surprise me with the best options based on my interests and budget)' : `Destination: ${validatedData.destination || 'Not specified'}`}
${validatedData.whenever ? 'Dates: Flexible (find best deals)' : `Dates: ${validatedData.startDate || 'Not specified'} to ${validatedData.endDate || 'Not specified'}`}
Budget: ${validatedData.budget ? `$${validatedData.budget}` : 'Not specified'} (total for ${validatedData.travelers} travelers)
Interests: ${validatedData.interests?.join(', ') || 'Not specified'}
Planning Mode: ${validatedData.planningMode.toUpperCase()}

${modeInstructions[validatedData.planningMode]}

Please provide a JSON response with the following structure:
{
  "destinations": [
    {
      "city": "City name",
      "country": "Country name",
      "fitScore": 85,
      "estFlight": 450,
      "estStay": 120,
      "estDaily": 80,
      "rationale": "Why this destination fits the requirements"
    }
  ],
  "days": [
    {
      "day": 1,
      "theme": "Day theme",
      "morning": ["Activity 1", "Activity 2"],
      "afternoon": ["Activity 1", "Activity 2"],
      "evening": ["Activity 1", "Activity 2"],
      "estCost": 150
    }
  ],
  "totals": {
    "estTotal": 2500,
    "estFlights": 450,
    "estAccommodation": 840,
    "estActivities": 560,
    "estFood": 420,
    "estTransport": 230
  },
  "recommendations": {
    "bestTimeToBook": "string",
    "moneySavingTips": ["tip1", "tip2"],
    "packingSuggestions": ["item1", "item2"],
    "localInsights": ["insight1", "insight2"]
  }
}

Focus on realistic destinations, accurate cost estimates, and practical itinerary planning that aligns with the ${validatedData.planningMode} planning mode. Ensure the JSON is properly formatted and valid.`;

    // Generate trip plan with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert travel planner with deep knowledge of destinations, costs, and logistics. Provide accurate, practical, and personalized trip recommendations. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    let tripPlan;
    try {
      tripPlan = JSON.parse(completion.choices[0].message.content || '{}');
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', completion.choices[0].message.content);
      
      // Return a fallback response if JSON parsing fails
      tripPlan = {
        destinations: [
          {
            city: "Paris",
            country: "France",
            fitScore: 85,
            estFlight: 800,
            estStay: 150,
            estDaily: 100,
            rationale: "Classic destination with rich culture and history"
          }
        ],
        days: [
          {
            day: 1,
            theme: "Arrival & Orientation",
            morning: ["Check into hotel", "Visit Eiffel Tower"],
            afternoon: ["Lunch at local bistro", "Walk along Seine"],
            evening: ["Dinner in Montmartre", "Evening stroll"],
            estCost: 150
          }
        ],
        totals: {
          estTotal: 2500,
          estFlights: 800,
          estAccommodation: 1050,
          estActivities: 400,
          estFood: 200,
          estTransport: 50
        },
        recommendations: {
          bestTimeToBook: "3-6 months in advance",
          moneySavingTips: ["Book flights on Tuesdays", "Stay in arrondissements 11-20"],
          packingSuggestions: ["Comfortable walking shoes", "Light jacket"],
          localInsights: ["Learn basic French phrases", "Avoid tourist traps"]
        }
      };
    }

    // Save to database if user is authenticated
    if (user) {
      await supabase.from('itineraries').insert({
        user_id: user.id,
        raw_prompt: body,
        raw_response: tripPlan,
        summary: `Trip from ${validatedData.departureCity} to ${tripPlan.destinations?.[0]?.city || 'Multiple destinations'}`,
        total_estimated_cents: Math.round((tripPlan.totals?.estTotal || 0) * 100),
        planning_mode: validatedData.planningMode
      });
    }

    return NextResponse.json({ 
      ok: true, 
      data: {
        ...tripPlan,
        planningContext: {
          departureCity: validatedData.departureCity,
          destination: validatedData.goAnywhere ? 'Anywhere (surprise me!)' : validatedData.destination,
          dates: validatedData.whenever ? 'Flexible' : `${validatedData.startDate || 'Not specified'} to ${validatedData.endDate || 'Not specified'}`,
          budget: validatedData.budget,
          travelers: validatedData.travelers,
          interests: validatedData.interests,
          whenever: validatedData.whenever,
          goAnywhere: validatedData.goAnywhere,
          duration: daysDiff,
          planningMode: validatedData.planningMode
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Trip planning error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid input data', 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to generate trip plan' 
    }, { status: 500 });
  }
}

// Get saved itineraries
export async function GET(req: NextRequest) {
  try {
    const supabase = createApiSupabaseClient();
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user's saved itineraries
    const { data: itineraries, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Itinerary fetch error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to fetch itineraries' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: itineraries });

  } catch (error: any) {
    console.error('Itinerary fetch error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to fetch itineraries' 
    }, { status: 500 });
  }
} 