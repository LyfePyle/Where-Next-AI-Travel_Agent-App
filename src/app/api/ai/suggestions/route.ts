import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, tripDuration, budgetAmount, budgetStyle, vibes, additionalDetails, adults, kids, startDate, endDate } = body;

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.log('OpenAI API key not configured, using mock data');
      return getMockSuggestions();
    }

    // Generate AI-powered suggestions
    const suggestions = await generateAISuggestions({
      from,
      tripDuration,
      budgetAmount,
      budgetStyle,
      vibes,
      additionalDetails,
      adults,
      kids,
      startDate,
      endDate
    });

    return NextResponse.json({
      suggestions,
      source: 'ai'
    });
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    
    // Fallback to mock data if AI fails
    console.log('Falling back to mock data due to AI error');
    return getMockSuggestions();
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
