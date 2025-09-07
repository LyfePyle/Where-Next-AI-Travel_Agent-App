import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface WalkingTourRequest {
  destination: string;
  preferences: {
    duration: number;
    interests: string[];
    fitnessLevel: string;
    groupSize: number;
    startLocation: string;
  };
}

interface WalkingTourStop {
  stopNumber: number;
  name: string;
  description: string;
  estimatedTime: number;
  tips: string[];
  photoOpportunities: string[];
  nearbyAttractions: string[];
}

interface WalkingTour {
  title: string;
  description: string;
  totalDuration: number;
  totalDistance: number;
  difficulty: string;
  stops: WalkingTourStop[];
  route: {
    startPoint: string;
    endPoint: string;
    waypoints: string[];
  };
  tips: string[];
  bestTime: string;
  weatherConsiderations: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { destination, preferences }: WalkingTourRequest = await request.json();
    
    // Generate AI-powered walking tour based on preferences
    const walkingTour = await generateAIWalkingTour(destination, preferences);
    
    return NextResponse.json({ walkingTour });
  } catch (error) {
    console.error('AI Walking Tour API Error:', error);
    
    // Fallback to mock data if OpenAI fails
    try {
      const fallbackWalkingTour = await generateMockWalkingTour(destination, preferences);
      return NextResponse.json({ 
        walkingTour: fallbackWalkingTour,
        warning: 'Using fallback data due to AI service issue'
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to generate walking tour' },
        { status: 500 }
      );
    }
  }
}

async function generateAIWalkingTour(destination: string, preferences: any): Promise<WalkingTour> {
  const { duration, interests, fitnessLevel, groupSize, startLocation } = preferences;
  
  const prompt = `You are an expert local guide. Create a detailed walking tour for ${destination}.

User Preferences:
- Duration: ${duration} hours
- Interests: ${interests.join(', ')}
- Fitness Level: ${fitnessLevel}
- Group Size: ${groupSize} people
- Start Location: ${startLocation}

Create a comprehensive walking tour with:

1. Tour Overview:
   - Creative title
   - Brief description
   - Total duration and distance
   - Difficulty level

2. Route Information:
   - Start and end points
   - Key waypoints
   - Logical flow between stops

3. Detailed Stops (5-8 stops):
   - Stop name and number
   - Description of what to see/do
   - Estimated time at each stop
   - Practical tips
   - Photo opportunities
   - Nearby attractions

4. Additional Information:
   - Best time to take the tour
   - Weather considerations
   - General tips for the tour

Return as JSON with this structure:
{
  "title": "Creative Tour Title",
  "description": "Tour description",
  "totalDuration": 3,
  "totalDistance": 4.5,
  "difficulty": "Easy/Moderate/Challenging",
  "stops": [
    {
      "stopNumber": 1,
      "name": "Stop Name",
      "description": "What to see and do",
      "estimatedTime": 30,
      "tips": ["Tip 1", "Tip 2"],
      "photoOpportunities": ["Photo spot 1", "Photo spot 2"],
      "nearbyAttractions": ["Attraction 1", "Attraction 2"]
    }
  ],
  "route": {
    "startPoint": "Starting location",
    "endPoint": "Ending location",
    "waypoints": ["Waypoint 1", "Waypoint 2"]
  },
  "tips": ["General tip 1", "General tip 2"],
  "bestTime": "Morning/Afternoon/Evening",
  "weatherConsiderations": "Weather advice"
}

Make it engaging, practical, and tailored to their interests and fitness level.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a local travel expert. Always respond with valid JSON containing detailed walking tours."
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
    const walkingTour = JSON.parse(response || '{}');
    
    return walkingTour;
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error.message.includes('401') || error.message.includes('invalid_api_key')) {
      console.error('OpenAI API key issue - using fallback');
      return generateMockWalkingTour(destination, preferences);
    } else {
      throw error;
    }
  }
}

async function generateMockWalkingTour(destination: string, preferences: any): Promise<WalkingTour> {
  const { duration, interests, fitnessLevel } = preferences;
  
  return {
    title: `${destination} Highlights Walking Tour`,
    description: `Explore the best of ${destination} on this guided walking tour.`,
    totalDuration: duration,
    totalDistance: duration * 1.5, // Rough estimate
    difficulty: fitnessLevel === 'low' ? 'Easy' : fitnessLevel === 'high' ? 'Challenging' : 'Moderate',
    stops: [
      {
        stopNumber: 1,
        name: `${destination} City Center`,
        description: 'Start your tour in the heart of the city',
        estimatedTime: 30,
        tips: ['Wear comfortable shoes', 'Bring water'],
        photoOpportunities: ['City square', 'Historic buildings'],
        nearbyAttractions: ['Main square', 'Tourist information']
      },
      {
        stopNumber: 2,
        name: 'Historic District',
        description: 'Explore the historic quarter',
        estimatedTime: 45,
        tips: ['Visit early to avoid crowds', 'Take your time'],
        photoOpportunities: ['Narrow streets', 'Architecture'],
        nearbyAttractions: ['Museums', 'Churches']
      }
    ],
    route: {
      startPoint: 'City Center',
      endPoint: 'Historic District',
      waypoints: ['Main Square', 'Historic Quarter']
    },
    tips: ['Start early in the morning', 'Bring a camera', 'Stay hydrated'],
    bestTime: 'Morning',
    weatherConsiderations: 'Check weather forecast before starting'
  };
}

