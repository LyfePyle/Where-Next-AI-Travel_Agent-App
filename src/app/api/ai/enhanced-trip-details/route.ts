import { NextRequest, NextResponse } from 'next/server';

interface TripPreferences {
  from: string;
  tripDuration: number;
  budgetAmount: number;
  budgetStyle: string;
  vibes: string[];
  adults: number;
  kids: number;
  startDate: string;
  endDate: string;
}

interface EnhancedTripDetail {
  id: string;
  destination: string;
  country: string;
  city: string;
  fitScore: number;
  description: string;
  weather: {
    temp: number;
    condition: string;
    icon: string;
    bestMonths: string[];
    yearRoundScore: number;
  };
  crowdLevel: {
    current: 'Low' | 'Medium' | 'High';
    byMonth: Record<string, 'Low' | 'Medium' | 'High'>;
  };
  safety: {
    score: number;
    highlights: string[];
    concerns: string[];
  };
  localInsights: {
    currency: string;
    language: string[];
    timezone: string;
    tipping: string;
    culturalTips: string[];
    localCustoms: string[];
  };
  estimatedTotal: number;
  budgetBreakdown: {
    flights: { min: number; max: number; recommended: number };
    accommodation: { min: number; max: number; recommended: number };
    food: { min: number; max: number; recommended: number };
    activities: { min: number; max: number; recommended: number };
    transport: { min: number; max: number; recommended: number };
    shopping: { min: number; max: number; recommended: number };
  };
  flightOptions: Array<{
    id: string;
    airline: string;
    price: number;
    duration: string;
    stops: number;
    type: 'cheapest' | 'fastest' | 'best_value';
    affiliateUrl: string;
  }>;
  hotelOptions: Array<{
    id: string;
    name: string;
    neighborhood: string;
    rating: number;
    price: number;
    amenities: string[];
    type: 'budget' | 'mid_range' | 'luxury';
    whyRecommended: string;
    affiliateUrl: string;
  }>;
  experiences: Array<{
    id: string;
    name: string;
    type: 'tour' | 'activity' | 'dining' | 'nightlife';
    price: number;
    duration: string;
    rating: number;
    description: string;
    affiliateUrl: string;
  }>;
  highlights: string[];
  whyItFits: string;
  vibeMatch: {
    food: number;
    culture: number;
    nature: number;
    nightlife: number;
    adventure: number;
    relaxation: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { tripId, destination, preferences }: {
      tripId: string;
      destination: string;
      preferences: TripPreferences;
    } = await request.json();

    // For now, we'll use enhanced mock data with AI structure
    // Later this will call OpenAI to generate real content
    const enhancedTripDetail = await generateEnhancedTripDetails(tripId, destination, preferences);

    return NextResponse.json({
      tripDetail: enhancedTripDetail,
      source: 'enhanced_ai', // Will be 'openai' when real AI is implemented
    });

  } catch (error) {
    console.error('Error generating enhanced trip details:', error);
    return NextResponse.json(
      { error: 'Failed to generate enhanced trip details' },
      { status: 500 }
    );
  }
}

async function generateEnhancedTripDetails(
  tripId: string, 
  destination: string, 
  preferences: TripPreferences
): Promise<EnhancedTripDetail> {
  const [city, country] = destination.includes(',') 
    ? [destination.split(',')[0].trim(), destination.split(',')[1].trim()]
    : [destination, 'Unknown Country'];

  const { tripDuration, budgetAmount, budgetStyle, vibes, from } = preferences;

  // Enhanced destination-specific data
  const destinationData = getDestinationSpecificData(city, country);
  
  // Calculate vibe matches based on user preferences and destination
  const vibeMatch = calculateVibeMatch(vibes, destinationData.vibes);
  
  // Generate budget breakdown
  const budgetBreakdown = generateSmartBudgetBreakdown(budgetAmount, budgetStyle, destinationData.costLevel);
  
  // Generate flight options with real pricing estimates
  const flightOptions = generateFlightOptions(from, city, budgetBreakdown.flights, destinationData);
  
  // Generate hotel options based on neighborhood insights
  const hotelOptions = generateHotelOptions(city, budgetBreakdown.accommodation, destinationData);
  
  // Generate experiences based on destination and vibes
  const experiences = generateCuratedExperiences(city, vibes, destinationData);

  return {
    id: tripId,
    destination,
    country,
    city,
    fitScore: Math.round(
      (vibeMatch.food + vibeMatch.culture + vibeMatch.nature + 
       vibeMatch.nightlife + vibeMatch.adventure + vibeMatch.relaxation) / 6
    ),
    description: generateDestinationDescription(city, country, vibes, destinationData),
    weather: destinationData.weather,
    crowdLevel: destinationData.crowdLevel,
    safety: destinationData.safety,
    localInsights: destinationData.localInsights,
    estimatedTotal: budgetAmount,
    budgetBreakdown,
    flightOptions,
    hotelOptions,
    experiences,
    highlights: destinationData.highlights,
    whyItFits: generateWhyItFits(city, vibes, budgetStyle, destinationData),
    vibeMatch
  };
}

function getDestinationSpecificData(city: string, country: string) {
  // This would eventually be replaced with a comprehensive destination database
  // For now, we'll have smart defaults with some specific city data
  
  const destinationDatabase: Record<string, any> = {
    'Tokyo': {
      vibes: { food: 98, culture: 95, nature: 65, nightlife: 88, adventure: 75, relaxation: 70 },
      costLevel: 'high',
      weather: {
        temp: 18, condition: 'Pleasant', icon: '🌸',
        bestMonths: ['Mar', 'Apr', 'May', 'Sep', 'Oct', 'Nov'],
        yearRoundScore: 85
      },
      safety: {
        score: 96,
        highlights: ['Extremely low crime rate', 'Excellent emergency services', 'Very helpful police'],
        concerns: ['Natural disasters (earthquakes)', 'Language barrier in emergencies']
      },
      highlights: ['Sushi and ramen culture', 'Ancient temples', 'Cherry blossoms', 'Modern technology', 'Shopping districts'],
      localInsights: {
        currency: 'Japanese Yen (¥)',
        language: ['Japanese', 'Limited English'],
        timezone: 'JST (UTC+9)',
        tipping: 'Not expected (can be offensive)',
        culturalTips: [
          'Bow when greeting people',
          'Remove shoes when entering homes/temples',
          'Don\'t eat or drink while walking',
          'Keep voice down on public transport'
        ],
        localCustoms: [
          'Receive business cards with both hands',
          'Slurp noodles to show appreciation',
          'Wait for "kampai" before drinking',
          'Don\'t point with chopsticks'
        ]
      },
      crowdLevel: {
        current: 'High' as const,
        byMonth: {
          'Jan': 'Medium', 'Feb': 'Low', 'Mar': 'High', 'Apr': 'High',
          'May': 'High', 'Jun': 'Medium', 'Jul': 'High', 'Aug': 'Medium',
          'Sep': 'High', 'Oct': 'High', 'Nov': 'Medium', 'Dec': 'Medium'
        }
      }
    },
    'Barcelona': {
      vibes: { food: 92, culture: 88, nature: 70, nightlife: 95, adventure: 75, relaxation: 80 },
      costLevel: 'medium',
      weather: {
        temp: 21, condition: 'Sunny', icon: '☀️',
        bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
        yearRoundScore: 90
      },
      safety: {
        score: 78,
        highlights: ['Generally safe for tourists', 'Good police presence', 'Safe public transport'],
        concerns: ['Pickpocketing in tourist areas', 'Some late-night areas to avoid']
      },
      highlights: ['Gaudí architecture', 'Tapas culture', 'Beautiful beaches', 'Vibrant nightlife', 'Art museums'],
      localInsights: {
        currency: 'Euro (€)',
        language: ['Spanish', 'Catalan', 'English (in tourist areas)'],
        timezone: 'CET (UTC+1)',
        tipping: '5-10% at restaurants',
        culturalTips: [
          'Late dinner times (9-11 PM)',
          'Siesta time affects shop hours',
          'Learn basic Spanish phrases',
          'Dress stylishly, especially for nightlife'
        ],
        localCustoms: [
          'Greeting with kisses on both cheeks',
          'Long lunch breaks (2-4 PM)',
          'Pre-dinner drinks and tapas',
          'Very social dining culture'
        ]
      },
      crowdLevel: {
        current: 'High' as const,
        byMonth: {
          'Jan': 'Low', 'Feb': 'Low', 'Mar': 'Medium', 'Apr': 'High',
          'May': 'High', 'Jun': 'High', 'Jul': 'High', 'Aug': 'High',
          'Sep': 'High', 'Oct': 'Medium', 'Nov': 'Low', 'Dec': 'Low'
        }
      }
    },
    'Paris': {
      vibes: { food: 96, culture: 98, nature: 60, nightlife: 85, adventure: 65, relaxation: 75 },
      costLevel: 'high',
      weather: {
        temp: 15, condition: 'Mild', icon: '☁️',
        bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
        yearRoundScore: 75
      },
      safety: {
        score: 82,
        highlights: ['Generally safe in tourist areas', 'Good emergency services', 'Well-policed metro'],
        concerns: ['Pickpocketing near attractions', 'Some areas unsafe at night']
      },
      highlights: ['Iconic landmarks', 'World-class cuisine', 'Art museums', 'Romantic atmosphere', 'Fashion capital'],
      localInsights: {
        currency: 'Euro (€)',
        language: ['French', 'English (limited)'],
        timezone: 'CET (UTC+1)',
        tipping: '10-15% at restaurants',
        culturalTips: [
          'Learn basic French greetings',
          'Dress elegantly',
          'Always say bonjour when entering shops',
          'Don\'t rush meals'
        ],
        localCustoms: [
          'Greeting with light kisses',
          'Long, leisurely meals',
          'Respect for art and culture',
          'Appreciate good wine and bread'
        ]
      },
      crowdLevel: {
        current: 'High' as const,
        byMonth: {
          'Jan': 'Low', 'Feb': 'Low', 'Mar': 'Medium', 'Apr': 'High',
          'May': 'High', 'Jun': 'High', 'Jul': 'High', 'Aug': 'Medium',
          'Sep': 'High', 'Oct': 'Medium', 'Nov': 'Low', 'Dec': 'Medium'
        }
      }
    }
  };

  // Return specific data if available, otherwise smart defaults
  return destinationDatabase[city] || {
    vibes: { food: 80, culture: 75, nature: 70, nightlife: 75, adventure: 70, relaxation: 75 },
    costLevel: 'medium',
    weather: {
      temp: 22, condition: 'Pleasant', icon: '🌤️',
      bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
      yearRoundScore: 80
    },
    safety: {
      score: 80,
      highlights: ['Generally safe for tourists', 'Reasonable crime rates', 'Tourist police available'],
      concerns: ['Standard travel precautions advised', 'Avoid displaying valuables']
    },
    highlights: ['Local culture', 'Traditional cuisine', 'Historic sites', 'Natural beauty'],
    localInsights: {
      currency: 'Local currency',
      language: ['Local language', 'English (varies)'],
      timezone: 'Local timezone',
      tipping: '10-15% customary',
      culturalTips: [
        'Respect local customs',
        'Dress appropriately for religious sites',
        'Learn basic local phrases',
        'Be aware of cultural sensitivities'
      ],
      localCustoms: [
        'Greet locals politely',
        'Follow local dining etiquette',
        'Respect cultural traditions',
        'Be punctual for appointments'
      ]
    },
    crowdLevel: {
      current: 'Medium' as const,
      byMonth: {
        'Jan': 'Low', 'Feb': 'Low', 'Mar': 'Medium', 'Apr': 'Medium',
        'May': 'High', 'Jun': 'High', 'Jul': 'High', 'Aug': 'High',
        'Sep': 'Medium', 'Oct': 'Medium', 'Nov': 'Low', 'Dec': 'Low'
      }
    }
  };
}

function calculateVibeMatch(userVibes: string[], destinationVibes: Record<string, number>) {
  const baseScores = destinationVibes;
  const enhancedScores = { ...baseScores };
  
  // Boost scores for vibes the user specifically selected
  userVibes.forEach(vibe => {
    if (enhancedScores[vibe]) {
      enhancedScores[vibe] = Math.min(100, enhancedScores[vibe] + 10);
    }
  });
  
  return enhancedScores;
}

function generateSmartBudgetBreakdown(
  totalBudget: number, 
  budgetStyle: string, 
  costLevel: string
) {
  // Base percentages that adjust based on budget style and destination cost level
  const baseBreakdown = {
    flights: 0.30,
    accommodation: 0.25,
    food: 0.20,
    activities: 0.15,
    transport: 0.08,
    shopping: 0.02
  };

  // Adjust based on budget style
  const styleMultipliers = {
    budget: { accommodation: 0.8, food: 0.7, activities: 0.8, shopping: 0.5 },
    comfortable: { accommodation: 1.0, food: 1.0, activities: 1.0, shopping: 1.0 },
    luxury: { accommodation: 1.4, food: 1.3, activities: 1.2, shopping: 2.0 }
  };

  // Adjust based on destination cost level
  const costMultipliers = {
    low: { accommodation: 0.7, food: 0.6, transport: 0.8 },
    medium: { accommodation: 1.0, food: 1.0, transport: 1.0 },
    high: { accommodation: 1.5, food: 1.4, transport: 1.2 }
  };

  const styleMult = styleMultipliers[budgetStyle as keyof typeof styleMultipliers] || styleMultipliers.comfortable;
  const costMult = costMultipliers[costLevel as keyof typeof costMultipliers] || costMultipliers.medium;

  const result: any = {};
  
  Object.entries(baseBreakdown).forEach(([category, percentage]) => {
    const styleAdj = styleMult[category as keyof typeof styleMult] || 1;
    const costAdj = costMult[category as keyof typeof costMult] || 1;
    
    const recommended = Math.round(totalBudget * percentage * styleAdj * costAdj);
    
    result[category] = {
      min: Math.round(recommended * 0.6),
      max: Math.round(recommended * 1.8),
      recommended
    };
  });

  return result;
}

function generateFlightOptions(
  from: string, 
  to: string, 
  flightBudget: { min: number; max: number; recommended: number },
  destinationData: any
) {
  const basePrice = flightBudget.recommended;
  
  return [
    {
      id: 'flight1',
      airline: 'Premium Carrier',
      price: Math.round(basePrice * 0.85),
      duration: '12h 30m',
      stops: 0,
      type: 'fastest' as const,
      affiliateUrl: `/booking/flights?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&type=fastest&price=${Math.floor(Math.random() * 500) + 800}`
    },
    {
      id: 'flight2',
      airline: 'Budget Airline',
      price: Math.round(basePrice * 0.65),
      duration: '16h 45m',
      stops: 1,
      type: 'cheapest' as const,
      affiliateUrl: `/booking/flights?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&type=fastest&price=${Math.floor(Math.random() * 500) + 800}`
    },
    {
      id: 'flight3',
      airline: 'National Carrier',
      price: Math.round(basePrice * 0.75),
      duration: '14h 15m',
      stops: 1,
      type: 'best_value' as const,
      affiliateUrl: `/booking/flights?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&type=fastest&price=${Math.floor(Math.random() * 500) + 800}`
    }
  ];
}

function generateHotelOptions(
  city: string, 
  accommodationBudget: { min: number; max: number; recommended: number },
  destinationData: any
) {
  const basePricePerNight = Math.round(accommodationBudget.recommended / 7); // Assume 7 nights
  
  return [
    {
      id: 'hotel1',
      name: `${city} Central Hotel`,
      neighborhood: 'City Center',
      rating: 4.2,
      price: basePricePerNight,
      amenities: ['Free WiFi', 'Breakfast', 'Gym', 'Concierge'],
      type: 'mid_range' as const,
      whyRecommended: 'Perfect location in the heart of the city with excellent transport links and amenities',
      affiliateUrl: `/booking/hotels?destination=${encodeURIComponent(city)}&checkin=${new Date().toISOString().split('T')[0]}&checkout=${new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]}`
    },
    {
      id: 'hotel2',
      name: `Budget Stay ${city}`,
      neighborhood: 'Transport Hub',
      rating: 3.8,
      price: Math.round(basePricePerNight * 0.6),
      amenities: ['Free WiFi', 'Basic Breakfast'],
      type: 'budget' as const,
      whyRecommended: 'Clean, comfortable accommodation with great value and easy access to attractions',
      affiliateUrl: `/booking/hotels?destination=${encodeURIComponent(city)}&checkin=${new Date().toISOString().split('T')[0]}&checkout=${new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]}`
    },
    {
      id: 'hotel3',
      name: `Luxury ${city} Resort`,
      neighborhood: 'Premium District',
      rating: 4.8,
      price: Math.round(basePricePerNight * 1.8),
      amenities: ['Spa', 'Pool', 'Fine Dining', 'Butler Service', 'Premium Location'],
      type: 'luxury' as const,
      whyRecommended: 'Ultimate luxury experience with world-class amenities and service',
      affiliateUrl: `/booking/hotels?destination=${encodeURIComponent(city)}&checkin=${new Date().toISOString().split('T')[0]}&checkout=${new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]}`
    }
  ];
}

function generateCuratedExperiences(city: string, vibes: string[], destinationData: any) {
  const experiences = [
    {
      id: 'exp1',
      name: `${city} Cultural Walking Tour`,
      type: 'tour' as const,
      price: 45,
      duration: '3 hours',
      rating: 4.7,
      description: `Discover the cultural heart of ${city} with a knowledgeable local guide`,
      affiliateUrl: 'https://www.viator.com/?ref=wherenext'
    },
    {
      id: 'exp2',
      name: 'Traditional Cooking Class',
      type: 'activity' as const,
      price: 85,
      duration: '4 hours',
      rating: 4.9,
      description: 'Learn to cook authentic local dishes with expert chefs',
      affiliateUrl: 'https://www.getyourguide.com/?ref=wherenext'
    }
  ];

  // Add vibe-specific experiences
  if (vibes.includes('food')) {
    experiences.push({
      id: 'exp3',
      name: `${city} Food Tour`,
      type: 'dining' as const,
      price: 65,
      duration: '3.5 hours',
      rating: 4.8,
      description: 'Taste the best local cuisine at hidden gems and famous spots',
      affiliateUrl: 'https://www.viator.com/?ref=wherenext'
    });
  }

  if (vibes.includes('nightlife')) {
    experiences.push({
      id: 'exp4',
      name: `${city} Nightlife Experience`,
      type: 'nightlife' as const,
      price: 55,
      duration: '4 hours',
      rating: 4.6,
      description: 'Experience the best bars, clubs, and nightlife hotspots',
      affiliateUrl: 'https://www.getyourguide.com/?ref=wherenext'
    });
  }

  return experiences;
}

function generateDestinationDescription(
  city: string, 
  country: string, 
  vibes: string[], 
  destinationData: any
): string {
  const vibeDescriptions = {
    food: 'culinary adventures',
    culture: 'rich cultural experiences',
    nature: 'natural beauty',
    nightlife: 'vibrant nightlife',
    adventure: 'exciting adventures',
    relaxation: 'peaceful relaxation'
  };

  const selectedVibes = vibes.map(v => vibeDescriptions[v as keyof typeof vibeDescriptions]).filter(Boolean);
  const vibeText = selectedVibes.length > 0 
    ? ` perfect for ${selectedVibes.join(', ')}`
    : '';

  return `Discover ${city}, ${country} - a captivating destination that seamlessly blends traditional charm with modern sophistication${vibeText}. This vibrant city offers an exceptional travel experience with its unique character, welcoming locals, and countless memorable moments waiting to be discovered.`;
}

function generateWhyItFits(
  city: string, 
  vibes: string[], 
  budgetStyle: string, 
  destinationData: any
): string {
  const budgetDescriptions = {
    budget: 'excellent value for money',
    comfortable: 'perfect balance of comfort and value',
    luxury: 'premium experiences and luxury amenities'
  };

  const budgetText = budgetDescriptions[budgetStyle as keyof typeof budgetDescriptions] || 'great value';
  const vibeText = vibes.length > 0 
    ? ` Your love for ${vibes.join(', ')} makes this destination particularly exciting.`
    : '';

  return `${city} is an ideal match for your travel style, offering ${budgetText} throughout your journey.${vibeText} The destination's unique character aligns perfectly with what you're looking for in an unforgettable travel experience.`;
}

