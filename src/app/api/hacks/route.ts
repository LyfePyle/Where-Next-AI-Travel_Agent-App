import { NextRequest, NextResponse } from 'next/server';

interface HackRequest {
  origin: string;
  destination: string;
  month?: string;
  budget?: number;
}

interface TravelHack {
  id: string;
  type: 'low_cost_carrier' | 'split_ticket' | 'error_fare' | 'hidden_route' | 'timing_hack';
  title: string;
  description: string;
  savings: {
    amount: number;
    percentage: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  link?: string;
  instructions: string[];
  warning?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { origin, destination, month, budget }: HackRequest = await request.json();

    // Generate travel hacks based on route
    const hacks = generateTravelHacks(origin, destination, month, budget);

    return NextResponse.json({
      origin,
      destination,
      month,
      hacks,
      generated_at: new Date().toISOString(),
      source: 'travel_hacks_engine'
    });

  } catch (error) {
    console.error('Error generating travel hacks:', error);
    return NextResponse.json(
      { error: 'Failed to generate travel hacks' },
      { status: 500 }
    );
  }
}

function generateTravelHacks(origin: string, destination: string, month?: string, budget?: number): TravelHack[] {
  const hacks: TravelHack[] = [];

  // Low-cost carriers not on meta-search
  hacks.push({
    id: 'lcc_1',
    type: 'low_cost_carrier',
    title: 'Check Direct Airline Websites',
    description: 'Some low-cost carriers don\'t appear on booking sites and can be 30-50% cheaper',
    savings: { amount: 200, percentage: 35 },
    difficulty: 'easy',
    link: getCarrierLinks(origin, destination),
    instructions: [
      'Visit airline websites directly',
      'Check Ryanair, EasyJet, Spirit, Frontier for your route',
      'Look for flash sales and last-minute deals',
      'Book Tuesday-Thursday for best prices'
    ]
  });

  // Split ticket suggestions
  if (isLongHaulRoute(origin, destination)) {
    hacks.push({
      id: 'split_1',
      type: 'split_ticket',
      title: 'Split Ticket via Hub Cities',
      description: 'Book separate tickets through major hubs can save 20-40% on long routes',
      savings: { amount: 300, percentage: 25 },
      difficulty: 'medium',
      instructions: [
        `Try routing through ${getHubCities(origin, destination).join(', ')}`,
        'Book as two separate one-way tickets',
        'Allow 3+ hours layover for separate bookings',
        'Check baggage policies for each segment'
      ],
      warning: 'Risk: If first flight delays, you\'re responsible for missed connection'
    });
  }

  // Error fare opportunities
  if (budget && budget > 1000) {
    hacks.push({
      id: 'error_1',
      type: 'error_fare',
      title: 'Monitor Error Fares & Mistake Deals',
      description: 'Airlines occasionally publish wrong prices - save 60-90% when caught quickly',
      savings: { amount: 800, percentage: 70 },
      difficulty: 'hard',
      instructions: [
        'Follow Secret Flying, Scott\'s Cheap Flights, The Flight Deal',
        'Set up Google Flights alerts for your route',
        'Book immediately when you spot obvious errors',
        'Have backup plans - airlines may cancel error fares'
      ],
      warning: 'Airlines may cancel bookings made on error fares'
    });
  }

  // Hidden city ticketing (for certain routes)
  if (canUseHiddenCity(origin, destination)) {
    hacks.push({
      id: 'hidden_1',
      type: 'hidden_route',
      title: 'Hidden City Ticketing',
      description: 'Book ticket to a further destination but get off at your actual stop',
      savings: { amount: 150, percentage: 20 },
      difficulty: 'hard',
      link: 'https://skiplagged.com',
      instructions: [
        'Use Skiplagged.com to find hidden city options',
        'Only works for one-way tickets',
        'Don\'t check bags (they go to final destination)',
        'Don\'t do this frequently with same airline'
      ],
      warning: 'Violates airline terms - use sparingly and at your own risk'
    });
  }

  // Timing hacks
  hacks.push({
    id: 'timing_1',
    type: 'timing_hack',
    title: 'Optimal Booking Windows',
    description: 'Book at the right time to save 15-25% on average',
    savings: { amount: 180, percentage: 15 },
    difficulty: 'easy',
    instructions: [
      'Domestic flights: 6-8 weeks before departure',
      'International flights: 8-12 weeks before',
      'Search on Tuesday/Wednesday for best deals',
      'Clear cookies/use incognito to avoid price tracking',
      `For ${destination}: Best time is ${getBestBookingTime(destination)}`
    ]
  });

  // Route-specific hacks
  const specificHacks = getRouteSpecificHacks(origin, destination);
  hacks.push(...specificHacks);

  return hacks.slice(0, 6); // Return top 6 hacks
}

function getCarrierLinks(origin: string, destination: string): string {
  // Return relevant low-cost carrier websites
  const carriers = [
    'ryanair.com', 'easyjet.com', 'spirit.com', 'frontier.com',
    'jetblue.com', 'southwest.com', 'allegiant.com'
  ];
  return carriers[0]; // Simplified for demo
}

function isLongHaulRoute(origin: string, destination: string): boolean {
  // Simplified logic - in reality would check distance/regions
  return origin.toLowerCase().includes('vancouver') && destination.toLowerCase().includes('madrid');
}

function getHubCities(origin: string, destination: string): string[] {
  // Return major hub cities between origin and destination
  if (origin.toLowerCase().includes('vancouver') && destination.toLowerCase().includes('madrid')) {
    return ['London', 'Amsterdam', 'Frankfurt', 'Paris'];
  }
  return ['London', 'Dubai', 'Singapore'];
}

function canUseHiddenCity(origin: string, destination: string): boolean {
  // Simplified logic - check if hidden city routing is viable
  return !destination.toLowerCase().includes('madrid'); // Don't suggest for Madrid as it's not a good hub
}

function getBestBookingTime(destination: string): string {
  // Return destination-specific booking advice
  const timingAdvice: { [key: string]: string } = {
    'madrid': '10-12 weeks before for Europe trips',
    'paris': '8-10 weeks before, avoid summer booking rush',
    'london': '6-8 weeks before, Tuesday departures cheapest',
    'tokyo': '12-16 weeks before, book well in advance',
    'default': '8-10 weeks before departure'
  };

  const dest = destination.toLowerCase();
  for (const [key, advice] of Object.entries(timingAdvice)) {
    if (dest.includes(key)) return advice;
  }
  return timingAdvice.default;
}

function getRouteSpecificHacks(origin: string, destination: string): TravelHack[] {
  const hacks: TravelHack[] = [];

  // Europe-specific hacks
  if (destination.toLowerCase().includes('madrid') || destination.toLowerCase().includes('spain')) {
    hacks.push({
      id: 'spain_1',
      type: 'hidden_route',
      title: 'Fly to Barcelona, Train to Madrid',
      description: 'Barcelona flights often cheaper, then take high-speed train (2.5 hours)',
      savings: { amount: 120, percentage: 18 },
      difficulty: 'easy',
      instructions: [
        'Book flight to Barcelona instead of Madrid',
        'Take AVE high-speed train (€25-60)',
        'Total journey only 2.5 hours longer',
        'Book train tickets at renfe.com'
      ]
    });
  }

  return hacks;
}
