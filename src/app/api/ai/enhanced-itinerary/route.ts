import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface EnhancedItineraryRequest {
  destination: string;
  city: string;
  country: string;
  tripDuration: number;
  budgetStyle: string;
  vibes: string[];
  adults: number;
  kids: number;
  additionalDetails?: string;
  startDate: string;
  endDate: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { destination, city, country, tripDuration, budgetStyle, vibes, adults, kids, additionalDetails, startDate, endDate }: EnhancedItineraryRequest = await request.json();
    
    // Generate AI-powered enhanced itinerary
    const enhancedItinerary = await generateEnhancedItinerary(
      destination, city, country, tripDuration, budgetStyle, vibes, adults, kids, additionalDetails, startDate, endDate
    );
    
    return NextResponse.json({ enhancedItinerary });
  } catch (error) {
    console.error('AI Enhanced Itinerary API Error:', error);
    
    // Fallback to mock data if OpenAI fails
    try {
      const fallbackItinerary = await generateMockEnhancedItinerary(destination, city, country, tripDuration, budgetStyle, vibes);
      return NextResponse.json({ 
        enhancedItinerary: fallbackItinerary,
        warning: 'Using fallback data due to AI service issue'
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to generate enhanced itinerary' },
        { status: 500 }
      );
    }
  }
}

async function generateEnhancedItinerary(
  destination: string,
  city: string,
  country: string,
  tripDuration: number,
  budgetStyle: string,
  vibes: string[],
  adults: number,
  kids: number,
  additionalDetails?: string,
  startDate?: string,
  endDate?: string
): Promise<any> {
  const prompt = `You are a professional travel planner and local expert for ${destination}. Create a detailed, day-by-day itinerary for a ${tripDuration}-day trip to ${city}, ${country}.

Traveler Profile:
- Destination: ${destination} (${city}, ${country})
- Trip Duration: ${tripDuration} days
- Budget Style: ${budgetStyle}
- Travel Vibes: ${vibes.join(', ')}
- Group: ${adults} adults, ${kids} kids
- Additional Details: ${additionalDetails || 'None'}
- Travel Dates: ${startDate} to ${endDate}

For each day, provide:
1. **Morning Activities** (9 AM - 12 PM)
2. **Lunch Recommendations** (12 PM - 2 PM) - Include specific restaurants with cuisine type, price range, and why it fits their style
3. **Afternoon Activities** (2 PM - 6 PM)
4. **Dinner Recommendations** (6 PM - 8 PM) - Include specific restaurants with cuisine type, price range, and why it fits their style
5. **Evening Activities** (8 PM - 10 PM)
6. **Transportation Details** - Specific methods, costs, and travel times between locations
7. **Estimated Daily Cost** - Breakdown by category (activities, food, transport)
8. **Local Tips** - Insider knowledge, best times to visit, what to avoid
9. **Weather Considerations** - What to wear, bring, or adjust based on season

Return as JSON with this structure:
{
  "destination": "${destination}",
  "city": "${city}",
  "country": "${country}",
  "tripDuration": ${tripDuration},
  "budgetStyle": "${budgetStyle}",
  "dailyItinerary": [
    {
      "day": 1,
      "title": "Arrival and City Introduction",
      "morning": {
        "activities": ["Activity 1", "Activity 2"],
        "time": "9:00 AM - 12:00 PM",
        "location": "Specific area/neighborhood",
        "transportation": "How to get there, cost, duration"
      },
      "lunch": {
        "restaurant": "Restaurant Name",
        "cuisine": "Cuisine Type",
        "priceRange": "$$",
        "whyRecommended": "Why this fits their style and preferences",
        "address": "Full address",
        "reservation": "Whether reservations needed",
        "time": "12:00 PM - 2:00 PM"
      },
      "afternoon": {
        "activities": ["Activity 1", "Activity 2"],
        "time": "2:00 PM - 6:00 PM",
        "location": "Specific area/neighborhood",
        "transportation": "How to get there, cost, duration"
      },
      "dinner": {
        "restaurant": "Restaurant Name",
        "cuisine": "Cuisine Type",
        "priceRange": "$$$",
        "whyRecommended": "Why this fits their style and preferences",
        "address": "Full address",
        "reservation": "Whether reservations needed",
        "time": "6:00 PM - 8:00 PM"
      },
      "evening": {
        "activities": ["Activity 1", "Activity 2"],
        "time": "8:00 PM - 10:00 PM",
        "location": "Specific area/neighborhood",
        "transportation": "How to get there, cost, duration"
      },
      "estimatedCost": {
        "activities": 50,
        "food": 80,
        "transportation": 25,
        "total": 155
      },
      "localTips": [
        "Tip 1",
        "Tip 2"
      ],
      "weatherConsiderations": "What to wear and bring for this day"
    }
  ],
  "transportationSummary": {
    "primaryMethods": ["Method 1", "Method 2"],
    "dailyTransportBudget": 25,
    "tips": ["Transport tip 1", "Transport tip 2"]
  },
  "restaurantSummary": {
    "cuisineTypes": ["Type 1", "Type 2"],
    "averageMealCost": 40,
    "reservationTips": ["Tip 1", "Tip 2"]
  }
}

Make sure to:
- Include specific, real restaurant names and locations
- Provide accurate transportation details with costs
- Consider the budget style (${budgetStyle}) for all recommendations
- Include family-friendly options since there are ${kids} kids
- Match the travel vibes: ${vibes.join(', ')}
- Provide practical, actionable advice
- Include local insider tips
- Consider seasonal factors and weather`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional travel planner and local expert. Always respond with valid JSON containing detailed, practical itinerary information."
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
    const enhancedItinerary = JSON.parse(response || '{}');
    
    return enhancedItinerary;
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error.message.includes('401') || error.message.includes('invalid_api_key')) {
      console.error('OpenAI API key issue - using fallback');
      return generateMockEnhancedItinerary(destination, city, country, tripDuration, budgetStyle, vibes);
    } else {
      throw error;
    }
  }
}

async function generateMockEnhancedItinerary(
  destination: string,
  city: string,
  country: string,
  tripDuration: number,
  budgetStyle: string,
  vibes: string[]
): Promise<any> {
  const dailyItinerary = [];
  
  for (let day = 1; day <= tripDuration; day++) {
    dailyItinerary.push({
      day: day,
      title: day === 1 ? 'Arrival and City Introduction' : 
             day === tripDuration ? 'Final Day and Departure' : 
             `Day ${day} - Exploring ${city}`,
      morning: {
        activities: ['City walking tour', 'Visit local market'],
        time: '9:00 AM - 12:00 PM',
        location: 'City Center',
        transportation: 'Walking or public transport, $5-10'
      },
      lunch: {
        restaurant: `${city} Local Bistro`,
        cuisine: 'Local cuisine',
        priceRange: budgetStyle === 'luxury' ? '$$$' : budgetStyle === 'comfortable' ? '$$' : '$',
        whyRecommended: `Perfect for experiencing local flavors in a ${budgetStyle} setting`,
        address: '123 Main Street, City Center',
        reservation: 'Recommended for dinner, not required for lunch',
        time: '12:00 PM - 2:00 PM'
      },
      afternoon: {
        activities: ['Museum visit', 'Local attraction'],
        time: '2:00 PM - 6:00 PM',
        location: 'Cultural District',
        transportation: 'Metro or taxi, $8-15'
      },
      dinner: {
        restaurant: `${city} Fine Dining`,
        cuisine: 'International',
        priceRange: budgetStyle === 'luxury' ? '$$$$' : budgetStyle === 'comfortable' ? '$$$' : '$$',
        whyRecommended: `Great atmosphere and quality food that matches your ${budgetStyle} preferences`,
        address: '456 Restaurant Row, Downtown',
        reservation: 'Highly recommended',
        time: '6:00 PM - 8:00 PM'
      },
      evening: {
        activities: ['Evening stroll', 'Local bar or café'],
        time: '8:00 PM - 10:00 PM',
        location: 'Historic District',
        transportation: 'Walking or short taxi ride, $5-10'
      },
      estimatedCost: {
        activities: budgetStyle === 'luxury' ? 80 : budgetStyle === 'comfortable' ? 50 : 30,
        food: budgetStyle === 'luxury' ? 120 : budgetStyle === 'comfortable' ? 80 : 50,
        transportation: budgetStyle === 'luxury' ? 40 : budgetStyle === 'comfortable' ? 25 : 15,
        total: budgetStyle === 'luxury' ? 240 : budgetStyle === 'comfortable' ? 155 : 95
      },
      localTips: [
        'Best time to visit attractions is early morning',
        'Local markets are great for authentic experiences'
      ],
      weatherConsiderations: 'Check weather forecast and dress accordingly'
    });
  }

  return {
    destination: destination,
    city: city,
    country: country,
    tripDuration: tripDuration,
    budgetStyle: budgetStyle,
    dailyItinerary: dailyItinerary,
    transportationSummary: {
      primaryMethods: ['Public transport', 'Walking', 'Taxi'],
      dailyTransportBudget: budgetStyle === 'luxury' ? 40 : budgetStyle === 'comfortable' ? 25 : 15,
      tips: ['Get a day pass for public transport', 'Walking is often the best way to explore']
    },
    restaurantSummary: {
      cuisineTypes: ['Local cuisine', 'International', 'Street food'],
      averageMealCost: budgetStyle === 'luxury' ? 60 : budgetStyle === 'comfortable' ? 40 : 25,
      reservationTips: ['Book popular restaurants in advance', 'Ask locals for hidden gems']
    }
  };
}

