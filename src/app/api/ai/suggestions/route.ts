import { NextRequest, NextResponse } from 'next/server';
import { suggestionCache, generateCacheKey, cacheMetrics } from '@/lib/cache';
import seedSuggestions from '@/data/seed/suggestions.json';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, budget, budgetAmount, vibes, additionalDetails, adults, kids, startDate, endDate } = body;
    
    // Normalize parameters
    const normalizedParams = {
      from: from || 'Vancouver',
      budget: budget || budgetAmount || 2000,
      vibes: Array.isArray(vibes) ? vibes : [],
      adults: adults || 2,
      kids: kids || 0
    };

    // Generate cache key
    const cacheKey = generateCacheKey.suggestions(normalizedParams);
    
    // Check cache first
    const cachedSuggestions = suggestionCache.get(cacheKey);
    if (cachedSuggestions) {
      cacheMetrics.recordHit();
      console.log('Cache hit for suggestions:', cacheKey);
      return NextResponse.json({
        suggestions: cachedSuggestions,
        source: 'cache',
        cacheStats: cacheMetrics.getStats()
      });
    }
    
    cacheMetrics.recordMiss();

    // Check if OpenAI API key is configured and feature flag enabled
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const useAI = process.env.ENABLE_AI_SUGGESTIONS !== 'false' && openaiApiKey;
    
    let suggestions;
    let source = 'fallback';

    if (useAI) {
      try {
        // Try AI-powered suggestions
        suggestions = await generateAISuggestions({
          from: normalizedParams.from,
          budget: normalizedParams.budget,
          vibes: normalizedParams.vibes,
          additionalDetails,
          adults: normalizedParams.adults,
          kids: normalizedParams.kids,
          startDate,
          endDate
        });
        source = 'ai';
        
        // Cache successful AI results
        suggestionCache.set(cacheKey, suggestions);
      } catch (aiError) {
        console.log('AI suggestions failed, falling back to seeded data:', aiError);
        suggestions = getSeededSuggestions(normalizedParams);
      }
    } else {
      console.log('AI disabled or not configured, using seeded data');
      suggestions = getSeededSuggestions(normalizedParams);
    }

    // Cache the results
    if (suggestions) {
      suggestionCache.set(cacheKey, suggestions);
    }

    return NextResponse.json({
      suggestions: suggestions || getDefaultSuggestions(),
      source,
      cacheStats: cacheMetrics.getStats()
    });
  } catch (error) {
    console.error('Error in suggestions API:', error);
    
    // Final fallback to default suggestions
    return NextResponse.json({
      suggestions: getDefaultSuggestions(),
      source: 'default_fallback',
      error: 'Service temporarily unavailable'
    });
  }
}

async function generateAISuggestions(preferences: any) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  const prompt = `You are an expert travel AI assistant. Generate 4 personalized trip suggestions based on the following preferences:

Traveler Details:
- Departing from: ${preferences.from}
- Trip duration: ${preferences.tripDuration} days
- Budget: $${preferences.budgetAmount} (${preferences.budgetStyle} style)
- Travelers: ${preferences.adults} adults, ${preferences.kids} kids
- Interests/Vibes: ${preferences.vibes.join(', ')}
- Additional details: ${preferences.additionalDetails || 'None provided'}

Please provide 3 diverse destination suggestions that match these preferences. For each suggestion, include:

1. A unique destination that fits the budget and interests
2. Realistic pricing estimates based on the budget style
3. Specific highlights and attractions
4. Why this destination fits their preferences
5. Current weather conditions and crowd levels
6. Flight and hotel price bands

Format the response as a JSON array with exactly this structure:
[
  {
    "id": "1",
    "destination": "City, Country",
    "country": "Country",
    "city": "City",
    "fitScore": 85-95,
    "description": "Brief description",
    "weather": {
      "temp": 20-30,
      "condition": "Sunny/Cloudy/Rainy",
      "icon": "☀️/🌤️/🌦️/🌧️"
    },
    "crowdLevel": "Low/Medium/High",
    "seasonality": "Description of season",
    "estimatedTotal": 1000-3000,
    "flightBand": {
      "min": 400-800,
      "max": 600-1200
    },
    "hotelBand": {
      "min": 60-200,
      "max": 100-300,
      "style": "Boutique/Modern/Historic/Luxury",
      "area": "Specific neighborhood"
    },
    "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4"],
    "whyItFits": "Detailed explanation of why this destination matches their preferences"
  }
]

Make sure the suggestions are diverse, realistic, and truly personalized to their interests and budget. Consider seasonal factors, current travel trends, and the specific interests mentioned.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert travel AI assistant. Always respond with valid JSON arrays containing trip suggestions. Never include explanations outside the JSON structure.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response
    const suggestions = JSON.parse(content);
    
    // Validate the response structure
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('Invalid response format from AI');
    }

    return suggestions;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

function getMockSuggestions() {
  const suggestions = [
    {
      id: '1',
      destination: 'Lisbon, Portugal',
      country: 'Portugal',
      city: 'Lisbon',
      fitScore: 92,
      description: 'Historic charm meets modern culture in Portugal\'s vibrant capital',
      weather: { temp: 22, condition: 'Sunny', icon: '☀️' },
      crowdLevel: 'Medium',
      seasonality: 'Perfect weather, moderate crowds',
      estimatedTotal: 1350,
      flightBand: { min: 650, max: 780 },
      hotelBand: { min: 90, max: 130, style: 'Boutique', area: 'Alfama/Baixa' },
      highlights: ['Historic tram rides', 'Pasteis de Belém', 'Fado music', 'Time Out Market'],
      whyItFits: 'Perfect for food lovers with amazing local cuisine and cultural experiences'
    },
    {
      id: '2',
      destination: 'Barcelona, Spain',
      country: 'Spain',
      city: 'Barcelona',
      fitScore: 88,
      description: 'Vibrant city with stunning architecture and Mediterranean charm',
      weather: { temp: 24, condition: 'Warm', icon: '🌤️' },
      crowdLevel: 'High',
      seasonality: 'Peak season, book early',
      estimatedTotal: 1850,
      flightBand: { min: 720, max: 890 },
      hotelBand: { min: 120, max: 180, style: 'Modern', area: 'Gothic Quarter' },
      highlights: ['Sagrada Familia', 'Gaudí architecture', 'Beach life', 'Tapas culture'],
      whyItFits: 'Ideal for culture and architecture enthusiasts with amazing food scene'
    },
    {
      id: '3',
      destination: 'Porto, Portugal',
      country: 'Portugal',
      city: 'Porto',
      fitScore: 85,
      description: 'Authentic Portuguese charm with world-famous port wine',
      weather: { temp: 20, condition: 'Mild', icon: '🌦️' },
      crowdLevel: 'Low',
      seasonality: 'Shoulder season, great deals',
      estimatedTotal: 1100,
      flightBand: { min: 580, max: 720 },
      hotelBand: { min: 70, max: 110, style: 'Historic', area: 'Ribeira' },
      highlights: ['Port wine tasting', 'Historic center', 'River views', 'Authentic cuisine'],
      whyItFits: 'Great value destination perfect for wine lovers and authentic experiences'
    },
    {
      id: '4',
      destination: 'Seville, Spain',
      country: 'Spain',
      city: 'Seville',
      fitScore: 90,
      description: 'Passionate flamenco culture meets stunning Moorish architecture',
      weather: { temp: 26, condition: 'Sunny', icon: '☀️' },
      crowdLevel: 'Medium',
      seasonality: 'Excellent weather, moderate tourism',
      estimatedTotal: 1400,
      flightBand: { min: 680, max: 820 },
      hotelBand: { min: 85, max: 125, style: 'Traditional', area: 'Santa Cruz Quarter' },
      highlights: ['Alcázar Palace', 'Flamenco shows', 'Cathedral & Giralda', 'Tapas tours'],
      whyItFits: 'Perfect for culture lovers seeking authentic Spanish traditions and stunning architecture'
    }
  ];

  return NextResponse.json({
    suggestions,
    source: 'mock'
  });
}

// Get seeded suggestions based on origin and budget
function getSeededSuggestions(params: { from: string; budget: number; vibes: string[]; adults: number; kids: number }) {
  const key = `${params.from.toLowerCase()}_budget_${Math.round(params.budget / 1000) * 1000}`;
  
  // Check for exact match in seed data
  if ((seedSuggestions as any)[key]) {
    return (seedSuggestions as any)[key];
  }
  
  // Fallback based on origin city
  const fromLower = params.from.toLowerCase();
  if (fromLower.includes('vancouver') || fromLower.includes('seattle') || fromLower.includes('portland')) {
    return (seedSuggestions as any)['vancouver_budget_2000'] || getDefaultSuggestions();
  }
  
  if (fromLower.includes('toronto') || fromLower.includes('montreal') || fromLower.includes('ottawa')) {
    return (seedSuggestions as any)['toronto_budget_3000'] || getDefaultSuggestions();
  }
  
  // Default to first available suggestions
  return Object.values(seedSuggestions)[0] || getDefaultSuggestions();
}

// Default fallback suggestions
function getDefaultSuggestions() {
  return [
    {
      id: 'default_1',
      destination: 'Paris, France',
      country: 'France',
      city: 'Paris',
      fitScore: 88,
      description: 'The city of light with world-class museums, cuisine, and romance',
      weather: { temp: 18, condition: 'Mild', icon: '🌤️' },
      crowdLevel: 'High',
      seasonality: 'Spring season, moderate crowds',
      estimatedTotal: 2200,
      flightBand: { min: 700, max: 1000 },
      hotelBand: { min: 150, max: 250, style: 'Classic', area: 'Saint-Germain' },
      highlights: ['Eiffel Tower', 'Louvre Museum', 'Seine River cruises', 'French cuisine'],
      whyItFits: 'Classic European destination perfect for first-time visitors to Europe'
    },
    {
      id: 'default_2',
      destination: 'Tokyo, Japan',
      country: 'Japan',
      city: 'Tokyo',
      fitScore: 90,
      description: 'Modern metropolis blending traditional culture with cutting-edge technology',
      weather: { temp: 20, condition: 'Pleasant', icon: '🌸' },
      crowdLevel: 'High',
      seasonality: 'Cherry blossom season',
      estimatedTotal: 2800,
      flightBand: { min: 800, max: 1200 },
      hotelBand: { min: 120, max: 200, style: 'Modern', area: 'Shibuya' },
      highlights: ['Cherry blossoms', 'Sushi & ramen', 'Traditional temples', 'Modern districts'],
      whyItFits: 'Unique cultural experience with amazing food and technology'
    }
  ];
}
