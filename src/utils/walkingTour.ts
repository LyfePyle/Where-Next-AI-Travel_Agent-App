import { TourGenerationParams, GeneratedTour, TourStop, UserTourAccess } from '../types/walkingTour';
import { TOUR_THEMES, AI_PROMPT_TEMPLATES, TOUR_PRICING } from '../constants/walkingTour';
import { toast } from 'sonner';

export const generateAIPrompt = (params: TourGenerationParams): string => {
  const theme = TOUR_THEMES.find(t => t.id === params.theme);
  const stopCount = theme?.estimatedStops || 6;

  return AI_PROMPT_TEMPLATES.base
    .replace('{destination}', params.destination)
    .replace('{theme}', theme?.name || params.theme)
    .replace('{duration}', params.duration.toString())
    .replace('{difficulty}', params.difficulty)
    .replace('{timeOfDay}', params.timeOfDay)
    .replace('{budget}', params.budget)
    .replace('{groupSize}', params.groupSize.toString())
    .replace('{interests}', params.interests.join(', '))
    .replace('{stopCount}', stopCount.toString());
};

export const generateMockTour = (params: TourGenerationParams): GeneratedTour => {
  const theme = TOUR_THEMES.find(t => t.id === params.theme)!;
  const stops: TourStop[] = [];
  
  // Generate mock stops based on theme
  const mockStops = {
    general: [
      { name: 'Central Plaza', type: 'landmark', description: 'Historic town square with beautiful architecture' },
      { name: 'Old Cathedral', type: 'landmark', description: 'Gothic cathedral from the 15th century' },
      { name: 'City Museum', type: 'museum', description: 'Local history and cultural artifacts' },
      { name: 'Riverside Park', type: 'park', description: 'Peaceful park along the river' },
      { name: 'Market Square', type: 'market', description: 'Traditional market with local crafts' },
      { name: 'Scenic Viewpoint', type: 'viewpoint', description: 'Panoramic views of the city' }
    ],
    foodie: [
      { name: 'Morning Market', type: 'market', description: 'Fresh produce and local specialties' },
      { name: 'Street Food Alley', type: 'restaurant', description: 'Authentic local street food vendors' },
      { name: 'Traditional Tea House', type: 'cafe', description: 'Century-old tea house with local blends' },
      { name: 'Spice Market', type: 'market', description: 'Aromatic spices and cooking ingredients' },
      { name: 'Local Bakery', type: 'restaurant', description: 'Family-run bakery with traditional breads' },
      { name: 'Food Court', type: 'restaurant', description: 'Multiple vendors serving regional dishes' },
      { name: 'Dessert Shop', type: 'cafe', description: 'Famous for traditional sweets and pastries' },
      { name: 'Night Food Market', type: 'market', description: 'Evening market with dinner options' }
    ]
  };

  const themeStops = mockStops[params.theme as keyof typeof mockStops] || mockStops.general;
  
  themeStops.slice(0, theme.estimatedStops).forEach((stop, index) => {
    stops.push({
      id: `${params.theme}-${index}`,
      name: stop.name,
      description: stop.description,
      address: `${stop.name} St, ${params.destination}`,
      type: stop.type as any,
      timeToSpend: 15 + Math.floor(Math.random() * 30),
      walkTimeToNext: index < themeStops.length - 1 ? 5 + Math.floor(Math.random() * 15) : 0,
      walkDistanceToNext: index < themeStops.length - 1 ? 200 + Math.floor(Math.random() * 800) : 0,
      rating: 4.0 + Math.random() * 1.0,
      tips: [`Best visited in the ${params.timeOfDay}`, 'Bring comfortable walking shoes']
    });
  });

  const totalWalkTime = stops.reduce((sum, stop) => sum + stop.walkTimeToNext, 0);
  const totalTimeAtStops = stops.reduce((sum, stop) => sum + stop.timeToSpend, 0);
  const totalDistance = stops.reduce((sum, stop) => sum + stop.walkDistanceToNext, 0);

  return {
    id: `tour-${Date.now()}`,
    title: `${theme.name} in ${params.destination}`,
    description: `Discover the best of ${params.destination} with this ${params.duration}-hour ${theme.name.toLowerCase()} tour`,
    theme,
    destination: params.destination,
    totalDistance,
    totalDuration: totalTimeAtStops + totalWalkTime,
    totalWalkTime,
    stops,
    difficulty: params.difficulty,
    bestTimeOfDay: params.timeOfDay,
    tags: [params.theme, params.difficulty, params.destination.toLowerCase()],
    createdAt: new Date(),
    isPremium: theme.isPremium
  };
};

export const callOpenAIForTour = async (params: TourGenerationParams): Promise<GeneratedTour> => {
  // This would be the actual OpenAI API call in production
  const prompt = generateAIPrompt(params);
  
  try {
    // Simulate API call with delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // For now, return mock data
    // In production, this would be:
    // const response = await openai.chat.completions.create({
    //   model: "gpt-4",
    //   messages: [{ role: "user", content: prompt }],
    //   temperature: 0.7
    // });
    
    return generateMockTour(params);
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate tour. Please try again.');
  }
};

export const checkTourAccess = (userAccess: UserTourAccess, tourTheme: string): {
  hasAccess: boolean;
  requiresPayment: boolean;
  message: string;
} => {
  const theme = TOUR_THEMES.find(t => t.id === tourTheme);
  
  if (!theme) {
    return { hasAccess: false, requiresPayment: false, message: 'Invalid tour theme' };
  }

  // Free theme - always accessible
  if (!theme.isPremium) {
    return { hasAccess: true, requiresPayment: false, message: 'Enjoy your free tour!' };
  }

  // Premium subscription active
  if (userAccess.subscriptionStatus === 'active') {
    return { hasAccess: true, requiresPayment: false, message: 'Premium subscriber access' };
  }

  // First-time user gets one free premium tour
  if (userAccess.freeToursUsed < userAccess.freeToursLimit) {
    return { hasAccess: true, requiresPayment: false, message: 'Enjoy your free premium tour!' };
  }

  // Check if specific tour was purchased
  if (userAccess.purchasedTours.includes(tourTheme)) {
    return { hasAccess: true, requiresPayment: false, message: 'Previously purchased tour' };
  }

  // Requires payment
  return { 
    hasAccess: false, 
    requiresPayment: true, 
    message: `This premium tour costs $${TOUR_PRICING.SINGLE_TOUR_PRICE}` 
  };
};

export const generateMapUrl = (stops: TourStop[]): string => {
  // Generate Google Maps URL with waypoints
  const origin = stops[0]?.address || '';
  const destination = stops[stops.length - 1]?.address || '';
  const waypoints = stops.slice(1, -1).map(stop => stop.address).join('|');
  
  const baseUrl = 'https://www.google.com/maps/dir/';
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    waypoints,
    travelmode: 'walking'
  });
  
  return `${baseUrl}?${params.toString()}`;
};

export const exportTourToPDF = async (tour: GeneratedTour): Promise<string> => {
  // This would integrate with a PDF generation service
  // For now, return a mock URL
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const pdfContent = generatePDFContent(tour);
  
  // In production, this would:
  // 1. Send content to PDF generation service
  // 2. Store PDF in cloud storage
  // 3. Return download URL
  
  return `https://example.com/tours/${tour.id}.pdf`;
};

const generatePDFContent = (tour: GeneratedTour): string => {
  return `
    ${tour.title}
    ${tour.description}
    
    Tour Details:
    - Duration: ${Math.round(tour.totalDuration / 60)} hours
    - Distance: ${(tour.totalDistance / 1000).toFixed(1)} km
    - Difficulty: ${tour.difficulty}
    
    Stops:
    ${tour.stops.map((stop, index) => `
    ${index + 1}. ${stop.name}
    ${stop.description}
    Address: ${stop.address}
    Time to spend: ${stop.timeToSpend} minutes
    ${stop.tips ? 'Tips: ' + stop.tips.join(', ') : ''}
    `).join('\n')}
  `;
};

export const shareTour = (tour: GeneratedTour): void => {
  const shareData = {
    title: tour.title,
    text: `Check out this ${tour.theme.name} tour in ${tour.destination}!`,
    url: `https://wherenext.com/tours/${tour.id}`
  };

  if (navigator.share && navigator.canShare(shareData)) {
    navigator.share(shareData);
  } else {
    // Fallback to copying URL
    navigator.clipboard.writeText(shareData.url);
    toast.success('Tour link copied to clipboard!');
  }
};