import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface PersonalizedRecommendationsRequest {
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
  from: string;
  budgetAmount: number;
  flightHotelData: any;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const requestData: PersonalizedRecommendationsRequest = await request.json();
    
    // Generate AI-powered personalized recommendations
    const recommendations = await generatePersonalizedRecommendations(requestData);
    
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('AI Personalized Recommendations API Error:', error);
    
    // Fallback to mock data if OpenAI fails
    try {
      const fallbackRecommendations = await generateMockRecommendations(requestData);
      return NextResponse.json({ 
        recommendations: fallbackRecommendations,
        warning: 'Using fallback data due to AI service issue'
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to generate personalized recommendations' },
        { status: 500 }
      );
    }
  }
}

async function generatePersonalizedRecommendations(
  data: PersonalizedRecommendationsRequest
): Promise<any> {
  const prompt = `You are a professional travel advisor and personal concierge. Analyze the following travel data and provide personalized recommendations for flights and hotels.

Traveler Profile:
- Destination: ${data.destination} (${data.city}, ${data.country})
- Trip Duration: ${data.tripDuration} days
- Budget Style: ${data.budgetStyle}
- Total Budget: $${data.budgetAmount}
- Travel Vibes: ${data.vibes.join(', ')}
- Group: ${data.adults} adults, ${data.kids} kids
- Travel Dates: ${data.startDate} to ${data.endDate}
- From: ${data.from}
- Additional Details: ${data.additionalDetails || 'None'}

Available Flight Options:
${JSON.stringify(data.flightHotelData?.flights || [], null, 2)}

Available Hotel Options:
${JSON.stringify(data.flightHotelData?.hotels || [], null, 2)}

Based on this information, provide personalized recommendations that match their preferences, budget, and travel style. Consider:

1. **Budget Optimization**: How to get the best value within their budget
2. **Travel Style Match**: Which options best match their vibes and preferences
3. **Family Considerations**: Since there are ${data.kids} kids, consider family-friendly options
4. **Practical Factors**: Travel times, convenience, location benefits
5. **Value Analysis**: Best bang for buck recommendations

Return as JSON with this structure:
{
  "analysis": {
    "budgetBreakdown": {
      "totalBudget": ${data.budgetAmount},
      "recommendedFlightBudget": 400,
      "recommendedHotelBudget": 600,
      "recommendedActivityBudget": 300,
      "remainingBuffer": 100
    },
    "travelStyleAnalysis": "Analysis of how their preferences match the destination",
    "familyConsiderations": "Specific considerations for traveling with ${data.kids} kids"
  },
  "flightRecommendations": [
    {
      "flightId": "flight-id",
      "recommendationScore": 9.5,
      "whyRecommended": "Detailed explanation of why this flight is perfect for them",
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "cons": ["Con 1", "Con 2"],
      "bestFor": "Who this flight is best suited for",
      "valueScore": 8.5,
      "convenienceScore": 9.0,
      "familyFriendlyScore": 8.0
    }
  ],
  "hotelRecommendations": [
    {
      "hotelId": "hotel-id",
      "recommendationScore": 9.2,
      "whyRecommended": "Detailed explanation of why this hotel is perfect for them",
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "cons": ["Con 1", "Con 2"],
      "bestFor": "Who this hotel is best suited for",
      "valueScore": 8.8,
      "locationScore": 9.5,
      "familyFriendlyScore": 9.0,
      "amenitiesScore": 8.5
    }
  ],
  "alternativeOptions": {
    "budgetFriendly": {
      "description": "If you want to save money",
      "flightSuggestion": "Alternative flight option",
      "hotelSuggestion": "Alternative hotel option",
      "savings": 200
    },
    "luxuryUpgrade": {
      "description": "If you want to splurge",
      "flightSuggestion": "Premium flight option",
      "hotelSuggestion": "Luxury hotel option",
      "additionalCost": 300
    }
  },
  "insiderTips": [
    "Insider tip 1 specific to their preferences",
    "Insider tip 2 about timing or booking",
    "Insider tip 3 about local experiences"
  ],
  "bookingStrategy": {
    "whenToBook": "Best time to book for their dates",
    "priceTrends": "Expected price changes",
    "negotiationTips": "How to get better deals",
    "cancellationPolicy": "Important cancellation considerations"
  }
}

Focus on providing actionable, personalized advice that helps them make the best decisions for their specific trip.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional travel advisor and personal concierge. Always respond with valid JSON containing detailed, personalized travel recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });

    const response = completion.choices[0].message.content;
    const recommendations = JSON.parse(response || '{}');
    
    return recommendations;
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error.message.includes('401') || error.message.includes('invalid_api_key')) {
      console.error('OpenAI API key issue - using fallback');
      return generateMockRecommendations(data);
    } else {
      throw error;
    }
  }
}

async function generateMockRecommendations(data: PersonalizedRecommendationsRequest): Promise<any> {
  return {
    analysis: {
      budgetBreakdown: {
        totalBudget: data.budgetAmount,
        recommendedFlightBudget: Math.round(data.budgetAmount * 0.4),
        recommendedHotelBudget: Math.round(data.budgetAmount * 0.4),
        recommendedActivityBudget: Math.round(data.budgetAmount * 0.15),
        remainingBuffer: Math.round(data.budgetAmount * 0.05)
      },
      travelStyleAnalysis: `Your ${data.budgetStyle} budget style and ${data.vibes.join(', ')} preferences make ${data.destination} a perfect match. The destination offers great value and experiences that align with your travel style.`,
      familyConsiderations: data.kids > 0 ? `With ${data.kids} kids, we've prioritized family-friendly options with good amenities and convenient locations.` : 'Solo or couple travel allows for more flexibility in timing and activities.'
    },
    flightRecommendations: data.flightHotelData?.flights?.slice(0, 2).map((flight: any, index: number) => ({
      flightId: flight.id,
      recommendationScore: 9.5 - (index * 0.3),
      whyRecommended: `This flight offers the best balance of price, convenience, and comfort for your ${data.budgetStyle} budget style.`,
      pros: ['Good price point', 'Convenient timing', 'Reliable airline'],
      cons: ['One stop', 'Early departure'],
      bestFor: `${data.budgetStyle} travelers looking for value`,
      valueScore: 8.5,
      convenienceScore: 9.0,
      familyFriendlyScore: data.kids > 0 ? 8.0 : 7.5
    })) || [],
    hotelRecommendations: data.flightHotelData?.hotels?.slice(0, 2).map((hotel: any, index: number) => ({
      hotelId: hotel.id,
      recommendationScore: 9.2 - (index * 0.2),
      whyRecommended: `This hotel perfectly matches your ${data.budgetStyle} preferences and offers great amenities for your group.`,
      pros: ['Great location', 'Good amenities', 'Family-friendly'],
      cons: ['Limited parking', 'Noise from street'],
      bestFor: `${data.budgetStyle} travelers seeking comfort and convenience`,
      valueScore: 8.8,
      locationScore: 9.5,
      familyFriendlyScore: data.kids > 0 ? 9.0 : 8.0,
      amenitiesScore: 8.5
    })) || [],
    alternativeOptions: {
      budgetFriendly: {
        description: 'If you want to save money',
        flightSuggestion: 'Consider booking 2-3 months in advance for better rates',
        hotelSuggestion: 'Look for hotels slightly outside city center',
        savings: 200
      },
      luxuryUpgrade: {
        description: 'If you want to splurge',
        flightSuggestion: 'Upgrade to business class for comfort',
        hotelSuggestion: 'Consider a luxury hotel with spa services',
        additionalCost: 300
      }
    },
    insiderTips: [
      `Book your ${data.budgetStyle} accommodations early for ${data.destination}`,
      'Consider visiting during shoulder season for better prices',
      'Ask locals for restaurant recommendations to avoid tourist traps'
    ],
    bookingStrategy: {
      whenToBook: 'Book flights 2-3 months in advance, hotels 1-2 months ahead',
      priceTrends: 'Prices typically increase closer to travel dates',
      negotiationTips: 'Call hotels directly for potential discounts',
      cancellationPolicy: 'Check cancellation policies before booking'
    }
  };
}

