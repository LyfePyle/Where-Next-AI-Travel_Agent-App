import { NextRequest, NextResponse } from 'next/server';
import { suggestionCache, generateCacheKey, cacheMetrics } from '@/lib/cache';
import seedSuggestions from '@/data/seed/suggestions.json';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      const rawText = await request.text();
      console.log('Raw request body:', rawText);
      body = JSON.parse(rawText);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { from, budget, budgetAmount, vibes, additionalDetails, adults, kids, startDate, endDate, loadMore } = body;
    
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
    
    console.log('AI Configuration:', {
      hasOpenAIKey: !!openaiApiKey,
      enableAI: process.env.ENABLE_AI_SUGGESTIONS,
      useAI: useAI,
      openaiKeyLength: openaiApiKey ? `${openaiApiKey.length} chars` : 'none'
    });
    
    let suggestions;
    let source = 'fallback';

    if (useAI) {
      try {
        // Try AI-powered suggestions
        suggestions = await generateAISuggestions({
          from: normalizedParams.from,
          budget: normalizedParams.budget,
          budgetAmount: body.budgetAmount,
          budgetDaily: body.budgetDaily,
          budgetFlights: body.budgetFlights,
          budgetHotels: body.budgetHotels,
          budgetStyle: body.budgetStyle,
          tripDuration: body.tripDuration,
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
  
  // Use detailed budget breakdown if available
  const budgetBreakdown = preferences.budgetDaily && preferences.budgetFlights && preferences.budgetHotels ? {
    daily: preferences.budgetDaily,
    flights: preferences.budgetFlights, 
    hotels: preferences.budgetHotels,
    total: preferences.budgetAmount
  } : null;

  const numSuggestions = 3;
  const prompt = `You are an expert travel AI assistant. Generate ${numSuggestions} diverse, realistic trip suggestions based on these preferences:

TRAVELER DETAILS:
- From: ${preferences.from}
- Duration: ${preferences.tripDuration} days  
- Travelers: ${preferences.adults} adults, ${preferences.kids} kids
- Style: ${preferences.budgetStyle}
- Interests: ${preferences.vibes.length > 0 ? preferences.vibes.join(', ') : 'General travel'}
${preferences.additionalDetails ? `- Special requests: ${preferences.additionalDetails}` : ''}

BUDGET (per person):
${budgetBreakdown ? `- Daily spending: $${budgetBreakdown.daily}/day (food, activities, transport)
- Flight budget: $${budgetBreakdown.flights} round-trip
- Hotel budget: $${budgetBreakdown.hotels}/night
- TOTAL PER PERSON: $${budgetBreakdown.total}` : `- Total budget: $${preferences.budgetAmount} (${preferences.budgetStyle} style)`}

Please provide ${numSuggestions} diverse destination suggestions that match these preferences. For each suggestion, include:

1. A unique destination that fits the budget and interests
2. Realistic pricing estimates based on the budget style - IMPORTANT: estimatedTotal should be the TOTAL trip cost for ALL ${preferences.adults + preferences.kids} travelers, not per person
3. Specific highlights and attractions
4. Why this destination fits their preferences
5. Current weather conditions and crowd levels
6. Flight and hotel price bands (per person)

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
    "estimatedTotal": 1000-5000,
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

RULES:
- estimatedTotal must be ${preferences.budgetAmount * 0.8} - ${preferences.budgetAmount * 1.2} per person
- Suggest diverse destinations (different continents/regions)
- Match their ${preferences.vibes.join(', ')} interests
- Return ONLY valid JSON, no extra text`;

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
        max_tokens: 1500,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response safely
    let suggestions;
    try {
      // Remove code block markers if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      suggestions = JSON.parse(cleanContent);
      
      // Sanitize the data to fix any NaN values
      suggestions = suggestions.map((suggestion: any) => ({
        ...suggestion,
        estimatedTotal: isNaN(suggestion.estimatedTotal) ? 
          (suggestion.flightBand?.min || 500) * 2 + (suggestion.hotelBand?.min || 100) * 5 : 
          suggestion.estimatedTotal
      }));
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI content:', content);
      throw new Error('AI returned invalid JSON format');
    }
    
    // Validate the response structure
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('Invalid response format from AI');
    }

    // Validate pricing is realistic (within 30% of budget)
    const budgetNumber = typeof preferences.budgetAmount === 'string' ? parseFloat(preferences.budgetAmount) : preferences.budgetAmount || preferences.budget;
    const maxAllowableCost = budgetNumber * 1.3;
    const minAllowableCost = budgetNumber * 0.5;
    
    const validSuggestions = suggestions.filter(suggestion => {
      const estimatedTotal = suggestion.estimatedTotal || 0;
      const isRealistic = estimatedTotal >= minAllowableCost && estimatedTotal <= maxAllowableCost;
      
      if (!isRealistic) {
        console.warn(`Filtering out unrealistic suggestion: ${suggestion.destination} costs $${estimatedTotal} for budget $${budgetNumber}`);
      }
      
      return isRealistic;
    });

    if (validSuggestions.length === 0) {
      console.error('All AI suggestions had unrealistic pricing, falling back to seeded data');
      throw new Error('AI suggestions pricing validation failed');
    }

    // Ensure unique IDs for AI suggestions to prevent React key conflicts
    const timestamp = Date.now();
    const uniqueAISuggestions = validSuggestions.map((suggestion, index) => ({
      ...suggestion,
      id: `ai_${timestamp}_${index}` // Unique ID with timestamp and index
    }));

    return uniqueAISuggestions;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('OpenAI API timeout after 30 seconds');
      throw new Error('AI request timed out. Please try again.');
    }
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
  let suggestions = null;
  
  // Check for exact match in seed data
  if ((seedSuggestions as any)[key]) {
    suggestions = (seedSuggestions as any)[key];
  } else {
    // Fallback based on origin city
    const fromLower = params.from.toLowerCase();
    if (fromLower.includes('vancouver') || fromLower.includes('seattle') || fromLower.includes('portland')) {
      suggestions = (seedSuggestions as any)['vancouver_budget_2000'];
    } else if (fromLower.includes('toronto') || fromLower.includes('montreal') || fromLower.includes('ottawa')) {
      suggestions = (seedSuggestions as any)['toronto_budget_3000'];
    } else {
      // Default to first available suggestions
      suggestions = Object.values(seedSuggestions)[0];
    }
  }
  
  // Ensure unique IDs to prevent React key conflicts
  if (suggestions && Array.isArray(suggestions)) {
    const timestamp = Date.now();
    return suggestions.map((suggestion: any, index: number) => ({
      ...suggestion,
      id: `seeded_${timestamp}_${index}` // Unique ID with timestamp
    }));
  }
  
  return getDefaultSuggestions();
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
