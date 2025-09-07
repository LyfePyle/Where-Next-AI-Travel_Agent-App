import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userPreferences, 
      searchHistory = [], 
      currentLocation = 'Vancouver',
      budget = 2000,
      duration = 7,
      interests = ['culture', 'food'],
      travelStyle = 'comfortable'
    } = body;

    // Analyze user preferences and history
    const prompt = `
    Based on the user's travel preferences and history, suggest personalized travel deals and destinations.
    
    User Profile:
    - Current Location: ${currentLocation}
    - Budget: $${budget}
    - Trip Duration: ${duration} days
    - Interests: ${interests.join(', ')}
    - Travel Style: ${travelStyle}
    - Search History: ${searchHistory.join(', ') || 'No previous searches'}
    
    Please provide 6 personalized destination recommendations with:
    1. Destination name and country
    2. Why it matches their preferences (2-3 sentences)
    3. Estimated cost breakdown (flights, accommodation, activities, food, transport)
    4. Best time to visit
    5. Match percentage (0-100%)
    6. Key attractions/activities
    7. Travel tips specific to their interests
    
    Focus on destinations that offer good value for their budget and match their interests.
    Consider seasonal factors and current travel trends.
    
    Return as JSON with this structure:
    {
      "recommendations": [
        {
          "destination": "City, Country",
          "matchPercentage": 95,
          "reasoning": "Why this destination matches their preferences",
          "estimatedCost": 1850,
          "costBreakdown": {
            "flights": 650,
            "accommodation": 700,
            "activities": 300,
            "food": 150,
            "transport": 50
          },
          "bestTimeToVisit": "March-May, September-November",
          "keyAttractions": ["Attraction 1", "Attraction 2", "Attraction 3"],
          "travelTips": ["Tip 1", "Tip 2", "Tip 3"],
          "dealType": "Hot Deal" | "Good Deal" | "Regular",
          "savings": 20
        }
      ]
    }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a travel expert who provides personalized destination recommendations based on user preferences, budget, and travel history. Always provide practical, actionable advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const recommendations = JSON.parse(response);

    return NextResponse.json({
      success: true,
      recommendations: recommendations.recommendations || [],
      userProfile: {
        location: currentLocation,
        budget,
        duration,
        interests,
        travelStyle,
        searchHistory
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating personalized deals:', error);
    
    // Fallback recommendations based on preferences
    const fallbackRecommendations = [
      {
        destination: "Lisbon, Portugal",
        matchPercentage: 92,
        reasoning: "Perfect for food lovers with amazing local cuisine and cultural experiences. Great value for money with authentic experiences.",
        estimatedCost: 1350,
        costBreakdown: {
          flights: 650,
          accommodation: 400,
          activities: 200,
          food: 80,
          transport: 20
        },
        bestTimeToVisit: "March-May, September-November",
        keyAttractions: ["Historic tram rides", "Fado music", "Pasteis de Belém", "Time Out Market"],
        travelTips: ["Try local pastries at Pastéis de Belém", "Take tram 28 for city views", "Visit during shoulder season for better prices"],
        dealType: "Hot Deal",
        savings: 25
      },
      {
        destination: "Barcelona, Spain",
        matchPercentage: 88,
        reasoning: "Vibrant city with stunning architecture and Mediterranean charm. Perfect for culture and food lovers.",
        estimatedCost: 1850,
        costBreakdown: {
          flights: 720,
          accommodation: 600,
          activities: 350,
          food: 150,
          transport: 30
        },
        bestTimeToVisit: "April-June, September-October",
        keyAttractions: ["Sagrada Familia", "Park Güell", "La Boqueria Market", "Gothic Quarter"],
        travelTips: ["Book Sagrada Familia tickets in advance", "Try authentic paella", "Visit local markets for fresh produce"],
        dealType: "Good Deal",
        savings: 15
      },
      {
        destination: "Porto, Portugal",
        matchPercentage: 85,
        reasoning: "Authentic Portuguese charm with world-famous port wine. Great value destination for authentic experiences.",
        estimatedCost: 1100,
        costBreakdown: {
          flights: 600,
          accommodation: 300,
          activities: 150,
          food: 40,
          transport: 10
        },
        bestTimeToVisit: "March-May, September-November",
        keyAttractions: ["Port wine cellars", "Ribeira district", "Livraria Lello", "Dom Luís I Bridge"],
        travelTips: ["Take a port wine tasting tour", "Walk along the Douro River", "Visit during wine harvest season"],
        dealType: "Hot Deal",
        savings: 30
      }
    ];

    return NextResponse.json({
      success: true,
      recommendations: fallbackRecommendations,
      userProfile: {
        location: body.currentLocation || 'Vancouver',
        budget: body.budget || 2000,
        duration: body.duration || 7,
        interests: body.interests || ['culture', 'food'],
        travelStyle: body.travelStyle || 'comfortable',
        searchHistory: body.searchHistory || []
      },
      generatedAt: new Date().toISOString(),
      note: 'Using fallback recommendations - AI service temporarily unavailable'
    });
  }
}

