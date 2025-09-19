import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userLocation = searchParams.get('location') || 'Unknown Location';
    const interests = searchParams.get('interests')?.split(',') || [];
    const budget = searchParams.get('budget') || 'moderate';
    const travelStyle = searchParams.get('style') || 'balanced';

    // Try to generate real AI recommendations
    let recommendations = [];
    
    try {
      const aiRecommendations = await generateAIRecommendations(userLocation, interests, budget, travelStyle);
      recommendations = aiRecommendations;
    } catch (aiError) {
      console.error('OpenAI generation failed, using enhanced fallback:', aiError);
      // Enhanced fallback that considers user location
      recommendations = generateLocationAwareFallback(userLocation, interests, budget);
    }

    return NextResponse.json({
      success: true,
      recommendations,
      message: 'AI trip recommendations loaded successfully',
      userLocation,
      source: recommendations.length > 0 && recommendations[0].isAiGenerated ? 'ai' : 'enhanced_fallback'
    });
  } catch (error) {
    console.error('Error loading AI trip recommendations:', error);
    // Final fallback
    const fallbackRecommendations = generateLocationAwareFallback('Unknown', [], 'moderate');
    return NextResponse.json({
      success: true,
      recommendations: fallbackRecommendations,
      message: 'Using fallback recommendations due to error',
      source: 'fallback'
    });
  }
}

async function generateAIRecommendations(userLocation: string, interests: string[], budget: string, travelStyle: string) {
  const interestsText = interests.length > 0 ? interests.join(', ') : 'general travel';
  
  const prompt = `You are a world-class travel expert. Generate 4 personalized travel destination recommendations for someone located in ${userLocation}.

User Profile:
- Current location: ${userLocation}
- Interests: ${interestsText}
- Budget preference: ${budget}
- Travel style: ${travelStyle}

For each destination, provide:
1. A destination that's NOT their current location
2. Why it's perfect for them based on their location and preferences
3. A realistic fit score (60-95)
4. Estimated total cost for a 5-7 day trip
5. Best time to visit
6. 4 specific highlights
7. Current season info

Return as JSON array with this exact structure:
[
  {
    "id": "1",
    "destination": "City, Country",
    "reason": "Detailed personalized explanation why this destination fits their preferences and location",
    "fitScore": 85,
    "estimatedCost": 1500,
    "bestTime": "March-May",
    "highlights": ["Specific attraction 1", "Experience 2", "Food 3", "Activity 4"],
    "weather": {"temp": 22, "condition": "Sunny", "icon": "☀️"},
    "crowdLevel": "Medium",
    "seasonality": "Current season description",
    "isAiGenerated": true
  }
]

Consider their location for:
- Flight accessibility and costs
- Cultural similarities/differences
- Climate preferences
- Visa requirements if applicable
- Time zone considerations`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a travel expert. Always respond with valid JSON only, no additional text."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.8,
    max_tokens: 2000
  });

  const response = completion.choices[0].message.content;
  if (!response) {
    throw new Error('No response from OpenAI');
  }

  try {
    const recommendations = JSON.parse(response);
    return Array.isArray(recommendations) ? recommendations : [recommendations];
  } catch (parseError) {
    console.error('Failed to parse AI response:', response);
    throw new Error('Invalid JSON response from AI');
  }
}

function generateLocationAwareFallback(userLocation: string, interests: string[], budget: string) {
  // Enhanced fallback that considers user location
  const isNorthAmerica = userLocation.toLowerCase().includes('vancouver') || 
                        userLocation.toLowerCase().includes('canada') ||
                        userLocation.toLowerCase().includes('united states') ||
                        userLocation.toLowerCase().includes('usa');
  
  const isEurope = userLocation.toLowerCase().includes('europe') ||
                  userLocation.toLowerCase().includes('uk') ||
                  userLocation.toLowerCase().includes('france') ||
                  userLocation.toLowerCase().includes('germany');

  let baseRecommendations = [];
  
  if (isNorthAmerica) {
    baseRecommendations = [
      {
        id: '1',
        destination: 'Lisbon, Portugal',
        reason: `From ${userLocation}, Lisbon offers an incredible value for European exploration. Direct flights available, favorable exchange rate, and perfect weather make it ideal for North American travelers.`,
        fitScore: 92,
        estimatedCost: 1350,
        bestTime: 'March-May',
        highlights: ['Historic tram rides', 'Pastéis de Belém', 'Fado music', 'Time Out Market'],
        weather: { temp: 22, condition: 'Sunny', icon: '☀️' },
        crowdLevel: 'Medium',
        seasonality: 'Perfect weather, moderate crowds',
        isAiGenerated: false
      },
      {
        id: '2',
        destination: 'Tokyo, Japan',
        reason: `Flying from ${userLocation} to Tokyo is convenient with direct flights. Experience a fascinating cultural contrast with incredible food, technology, and hospitality.`,
        fitScore: 89,
        estimatedCost: 2200,
        bestTime: 'March-May',
        highlights: ['Cherry blossoms', 'Tsukiji Market', 'Modern technology', 'Traditional temples'],
        weather: { temp: 18, condition: 'Mild', icon: '🌸' },
        crowdLevel: 'High',
        seasonality: 'Spring season, cherry blossom time',
        isAiGenerated: false
      }
    ];
  } else if (isEurope) {
    baseRecommendations = [
      {
        id: '1',
        destination: 'Marrakech, Morocco',
        reason: `From ${userLocation}, Morocco offers an exotic adventure that's close and affordable. Experience African culture, incredible food, and stunning architecture just a short flight away.`,
        fitScore: 88,
        estimatedCost: 1100,
        bestTime: 'March-May',
        highlights: ['Jemaa el-Fnaa', 'Atlas Mountains', 'Moroccan cuisine', 'Traditional riads'],
        weather: { temp: 25, condition: 'Warm', icon: '🌞' },
        crowdLevel: 'Medium',
        seasonality: 'Perfect weather for exploring',
        isAiGenerated: false
      },
      {
        id: '2',
        destination: 'Istanbul, Turkey',
        reason: `From ${userLocation}, Istanbul bridges Europe and Asia with rich history, incredible food, and affordable luxury. Easy access with great value for European travelers.`,
        fitScore: 85,
        estimatedCost: 1300,
        bestTime: 'April-June',
        highlights: ['Hagia Sophia', 'Grand Bazaar', 'Turkish baths', 'Bosphorus views'],
        weather: { temp: 22, condition: 'Pleasant', icon: '🌤️' },
        crowdLevel: 'Medium',
        seasonality: 'Ideal spring weather',
        isAiGenerated: false
      }
    ];
  } else {
    // Default recommendations for unknown locations
    baseRecommendations = [
      {
        id: '1',
        destination: 'Barcelona, Spain',
        reason: `A vibrant city with stunning architecture and Mediterranean charm. Perfect for culture and food lovers, with excellent connectivity from most locations.`,
        fitScore: 88,
        estimatedCost: 1850,
        bestTime: 'April-June',
        highlights: ['Sagrada Familia', 'Gaudí architecture', 'Beach life', 'Tapas culture'],
        weather: { temp: 24, condition: 'Warm', icon: '🌤️' },
        crowdLevel: 'High',
        seasonality: 'Peak season, book early',
        isAiGenerated: false
      },
      {
        id: '2',
        destination: 'Porto, Portugal',
        reason: `Authentic Portuguese charm with world-famous port wine. Great value destination for authentic experiences with good flight connections.`,
        fitScore: 85,
        estimatedCost: 1100,
        bestTime: 'March-May',
        highlights: ['Port wine tasting', 'Historic center', 'River views', 'Authentic cuisine'],
        weather: { temp: 20, condition: 'Mild', icon: '🌦️' },
        crowdLevel: 'Low',
        seasonality: 'Shoulder season, great deals',
        isAiGenerated: false
      }
    ];
  }

  // Adjust recommendations based on interests
  if (interests.includes('beach')) {
    baseRecommendations.push({
      id: '3',
      destination: 'Santorini, Greece',
      reason: 'Stunning beaches and iconic sunsets perfect for beach lovers.',
      fitScore: 87,
      estimatedCost: 1600,
      bestTime: 'May-September',
      highlights: ['Blue domes', 'Sunset views', 'Beach clubs', 'Greek cuisine'],
      weather: { temp: 26, condition: 'Sunny', icon: '☀️' },
      crowdLevel: 'High',
      seasonality: 'Peak beach season',
      isAiGenerated: false
    });
  }

  if (interests.includes('culture') || interests.includes('history')) {
    baseRecommendations.push({
      id: '4',
      destination: 'Prague, Czech Republic',
      reason: 'Rich history and stunning architecture perfect for culture enthusiasts.',
      fitScore: 83,
      estimatedCost: 1200,
      bestTime: 'April-June',
      highlights: ['Prague Castle', 'Charles Bridge', 'Old Town Square', 'Czech beer'],
      weather: { temp: 19, condition: 'Mild', icon: '🌤️' },
      crowdLevel: 'Medium',
      seasonality: 'Pleasant spring weather',
      isAiGenerated: false
    });
  }

  return baseRecommendations.slice(0, 4); // Return up to 4 recommendations
}
