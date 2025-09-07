import { TourTheme } from '../types/walkingTour';

export const TOUR_THEMES: TourTheme[] = [
  {
    id: 'general',
    name: 'City Highlights',
    description: 'Must-see landmarks and popular attractions',
    icon: '🏛️',
    color: '#3B82F6',
    isPremium: false,
    estimatedStops: 6,
    sampleStops: ['Main Square', 'Historic Cathedral', 'City Museum']
  },
  {
    id: 'foodie',
    name: 'Street Food Tour',
    description: 'Local cuisine, markets, and authentic eateries',
    icon: '🍜',
    color: '#F59E0B',
    isPremium: true,
    estimatedStops: 8,
    sampleStops: ['Local Market', 'Street Food Stall', 'Traditional Restaurant']
  },
  {
    id: 'cultural',
    name: 'Cultural Heritage',
    description: 'Temples, traditions, and local customs',
    icon: '🏮',
    color: '#8B5CF6',
    isPremium: true,
    estimatedStops: 7,
    sampleStops: ['Ancient Temple', 'Cultural Center', 'Traditional Workshop']
  },
  {
    id: 'art',
    name: 'Art & Museums',
    description: 'Galleries, street art, and creative spaces',
    icon: '🎨',
    color: '#EC4899',
    isPremium: true,
    estimatedStops: 6,
    sampleStops: ['Art Gallery', 'Street Art District', 'Artist Studio']
  },
  {
    id: 'nature',
    name: 'Green Spaces',
    description: 'Parks, gardens, and natural beauty',
    icon: '🌿',
    color: '#10B981',
    isPremium: true,
    estimatedStops: 5,
    sampleStops: ['Botanical Garden', 'City Park', 'Scenic Viewpoint']
  },
  {
    id: 'nightlife',
    name: 'Evening Entertainment',
    description: 'Bars, clubs, and night markets',
    icon: '🌃',
    color: '#6366F1',
    isPremium: true,
    estimatedStops: 6,
    sampleStops: ['Rooftop Bar', 'Night Market', 'Live Music Venue']
  },
  {
    id: 'shopping',
    name: 'Shopping Districts',
    description: 'Markets, boutiques, and local crafts',
    icon: '🛍️',
    color: '#F97316',
    isPremium: true,
    estimatedStops: 7,
    sampleStops: ['Local Market', 'Artisan Shop', 'Fashion District']
  },
  {
    id: 'photography',
    name: 'Instagram Spots',
    description: 'Most photogenic locations and hidden gems',
    icon: '📸',
    color: '#EF4444',
    isPremium: true,
    estimatedStops: 8,
    sampleStops: ['Scenic Overlook', 'Colorful Street', 'Historic Bridge']
  }
];

export const TOUR_PRICING = {
  FREE_TOURS_LIMIT: 1,
  SINGLE_TOUR_PRICE: 2.99,
  BUNDLE_PRICE: 9.99, // 5 tours
  PREMIUM_MONTHLY: 4.99,
  PREMIUM_YEARLY: 39.99
};

export const TOUR_DIFFICULTIES = [
  {
    id: 'easy',
    name: 'Easy Walk',
    description: 'Flat terrain, short distances, frequent rest stops',
    maxDistance: 3, // km
    maxDuration: 2, // hours
    icon: '🚶',
    color: '#10B981'
  },
  {
    id: 'moderate',
    name: 'Moderate Walk',
    description: 'Some hills, longer distances, moderate pace',
    maxDistance: 5, // km
    maxDuration: 4, // hours
    icon: '🥾',
    color: '#F59E0B'
  },
  {
    id: 'challenging',
    name: 'Adventure Walk',
    description: 'Steep areas, long distances, active exploration',
    maxDistance: 8, // km
    maxDuration: 6, // hours
    icon: '🏃',
    color: '#EF4444'
  }
];

export const AI_PROMPT_TEMPLATES = {
  base: `Create a detailed self-guided walking tour for {destination} with the following requirements:

Theme: {theme}
Duration: {duration} hours
Difficulty: {difficulty}
Time of day: {timeOfDay}
Budget preference: {budget}
Group size: {groupSize}
Interests: {interests}

Please provide:
1. Tour title and description
2. {stopCount} specific stops with:
   - Name and brief description
   - Address or location
   - Time to spend (minutes)
   - Walking time to next stop
   - Type of location
   - Any special tips or recommendations
3. Total distance and walking time
4. Best route order for efficiency
5. Safety considerations
6. Local etiquette tips

Format the response as JSON with the following structure:
{
  "title": "Tour Title",
  "description": "Brief tour description",
  "stops": [
    {
      "name": "Stop Name",
      "description": "Description",
      "address": "Address",
      "type": "landmark|restaurant|cafe|museum|park|market|temple|viewpoint",
      "timeToSpend": minutes,
      "walkTimeToNext": minutes,
      "tips": ["tip1", "tip2"],
      "openingHours": "hours if applicable"
    }
  ],
  "totalDistance": meters,
  "totalWalkTime": minutes,
  "difficulty": "easy|moderate|challenging",
  "bestTimeOfDay": "morning|afternoon|evening|any",
  "tags": ["tag1", "tag2"],
  "safetyTips": ["tip1", "tip2"],
  "localEtiquette": ["tip1", "tip2"]
}`
};