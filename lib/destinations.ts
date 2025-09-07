// Curated destination database with popular travel destinations
export interface Destination {
  id: string;
  city: string;
  country: string;
  iataCode: string;
  lat: number;
  lon: number;
  timezone: string;
  currency: string;
  language: string;
  tags: string[];
  highlights: string[];
  imageUrl: string;
  description: string;
  bestTimeToVisit: string;
  avgFlightTime: string;
  avgDailyCost: number;
  safetyLevel: 'Very Safe' | 'Safe' | 'Moderate' | 'Caution';
  visaRequired: boolean;
  covidRestrictions: string;
}

export const destinations: Destination[] = [
  // Europe
  {
    id: 'paris-france',
    city: 'Paris',
    country: 'France',
    iataCode: 'CDG',
    lat: 48.8566,
    lon: 2.3522,
    timezone: 'Europe/Paris',
    currency: 'EUR',
    language: 'French',
    tags: ['culture', 'food', 'romance', 'history', 'art'],
    highlights: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame Cathedral', 'Champs-Élysées', 'Montmartre'],
    imageUrl: 'https://images.unsplash.com/photo-1502602898535-eb67c6fd3f85?w=800',
    description: 'The City of Light offers world-class art, cuisine, and iconic landmarks.',
    bestTimeToVisit: 'April to October',
    avgFlightTime: '8h from NYC',
    avgDailyCost: 200,
    safetyLevel: 'Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },
  {
    id: 'london-uk',
    city: 'London',
    country: 'United Kingdom',
    iataCode: 'LHR',
    lat: 51.5074,
    lon: -0.1278,
    timezone: 'Europe/London',
    currency: 'GBP',
    language: 'English',
    tags: ['culture', 'history', 'shopping', 'nightlife', 'museums'],
    highlights: ['Big Ben', 'Buckingham Palace', 'Tower of London', 'British Museum', 'Westminster Abbey'],
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
    description: 'A historic metropolis blending tradition with modern innovation.',
    bestTimeToVisit: 'March to May, September to November',
    avgFlightTime: '7h from NYC',
    avgDailyCost: 250,
    safetyLevel: 'Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },
  {
    id: 'rome-italy',
    city: 'Rome',
    country: 'Italy',
    iataCode: 'FCO',
    lat: 41.9028,
    lon: 12.4964,
    timezone: 'Europe/Rome',
    currency: 'EUR',
    language: 'Italian',
    tags: ['history', 'culture', 'food', 'architecture', 'religion'],
    highlights: ['Colosseum', 'Vatican City', 'Trevi Fountain', 'Roman Forum', 'Pantheon'],
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
    description: 'The Eternal City with ancient ruins and Renaissance art.',
    bestTimeToVisit: 'April to June, September to October',
    avgFlightTime: '9h from NYC',
    avgDailyCost: 180,
    safetyLevel: 'Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },
  {
    id: 'barcelona-spain',
    city: 'Barcelona',
    country: 'Spain',
    iataCode: 'BCN',
    lat: 41.3851,
    lon: 2.1734,
    timezone: 'Europe/Madrid',
    currency: 'EUR',
    language: 'Spanish, Catalan',
    tags: ['architecture', 'beaches', 'food', 'culture', 'nightlife'],
    highlights: ['Sagrada Familia', 'Park Güell', 'La Rambla', 'Gothic Quarter', 'Barceloneta Beach'],
    imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800',
    description: 'A vibrant city known for Gaudi architecture and Mediterranean lifestyle.',
    bestTimeToVisit: 'May to June, September to October',
    avgFlightTime: '8h from NYC',
    avgDailyCost: 160,
    safetyLevel: 'Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },
  {
    id: 'amsterdam-netherlands',
    city: 'Amsterdam',
    country: 'Netherlands',
    iataCode: 'AMS',
    lat: 52.3676,
    lon: 4.9041,
    timezone: 'Europe/Amsterdam',
    currency: 'EUR',
    language: 'Dutch',
    tags: ['culture', 'museums', 'bikes', 'canals', 'nightlife'],
    highlights: ['Anne Frank House', 'Van Gogh Museum', 'Rijksmuseum', 'Canal Cruises', 'Vondelpark'],
    imageUrl: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9ee?w=800',
    description: 'A charming city of canals, museums, and cycling culture.',
    bestTimeToVisit: 'April to May, September to October',
    avgFlightTime: '7h from NYC',
    avgDailyCost: 200,
    safetyLevel: 'Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },

  // Asia
  {
    id: 'tokyo-japan',
    city: 'Tokyo',
    country: 'Japan',
    iataCode: 'NRT',
    lat: 35.6762,
    lon: 139.6503,
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
    language: 'Japanese',
    tags: ['culture', 'food', 'technology', 'shopping', 'anime'],
    highlights: ['Shibuya Crossing', 'Senso-ji Temple', 'Tokyo Skytree', 'Tsukiji Market', 'Harajuku'],
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    description: 'A futuristic metropolis blending tradition with cutting-edge technology.',
    bestTimeToVisit: 'March to May, September to November',
    avgFlightTime: '14h from NYC',
    avgDailyCost: 250,
    safetyLevel: 'Very Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },
  {
    id: 'bangkok-thailand',
    city: 'Bangkok',
    country: 'Thailand',
    iataCode: 'BKK',
    lat: 13.7563,
    lon: 100.5018,
    timezone: 'Asia/Bangkok',
    currency: 'THB',
    language: 'Thai',
    tags: ['food', 'culture', 'temples', 'shopping', 'nightlife'],
    highlights: ['Grand Palace', 'Wat Phra Kaew', 'Chatuchak Market', 'Khao San Road', 'Chinatown'],
    imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c079365?w=800',
    description: 'A bustling city of temples, street food, and vibrant markets.',
    bestTimeToVisit: 'November to February',
    avgFlightTime: '18h from NYC',
    avgDailyCost: 80,
    safetyLevel: 'Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },
  {
    id: 'singapore',
    city: 'Singapore',
    country: 'Singapore',
    iataCode: 'SIN',
    lat: 1.3521,
    lon: 103.8198,
    timezone: 'Asia/Singapore',
    currency: 'SGD',
    language: 'English, Malay, Chinese, Tamil',
    tags: ['food', 'shopping', 'culture', 'architecture', 'nature'],
    highlights: ['Marina Bay Sands', 'Gardens by the Bay', 'Sentosa Island', 'Chinatown', 'Little India'],
    imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
    description: 'A modern city-state with diverse cultures and stunning architecture.',
    bestTimeToVisit: 'February to April, July to September',
    avgFlightTime: '18h from NYC',
    avgDailyCost: 200,
    safetyLevel: 'Very Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },
  {
    id: 'seoul-south-korea',
    city: 'Seoul',
    country: 'South Korea',
    iataCode: 'ICN',
    lat: 37.5665,
    lon: 126.9780,
    timezone: 'Asia/Seoul',
    currency: 'KRW',
    language: 'Korean',
    tags: ['culture', 'food', 'technology', 'shopping', 'k-pop'],
    highlights: ['Gyeongbokgung Palace', 'Myeongdong', 'Hongdae', 'Namsan Tower', 'Bukchon Hanok Village'],
    imageUrl: 'https://images.unsplash.com/photo-1538485399081-7c8ed7f6c93c?w=800',
    description: 'A dynamic city blending ancient traditions with modern K-culture.',
    bestTimeToVisit: 'March to May, September to November',
    avgFlightTime: '14h from NYC',
    avgDailyCost: 150,
    safetyLevel: 'Very Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },
  {
    id: 'bali-indonesia',
    city: 'Bali',
    country: 'Indonesia',
    iataCode: 'DPS',
    lat: -8.3405,
    lon: 115.0920,
    timezone: 'Asia/Makassar',
    currency: 'IDR',
    language: 'Indonesian, Balinese',
    tags: ['beaches', 'culture', 'spirituality', 'nature', 'adventure'],
    highlights: ['Ubud Sacred Monkey Forest', 'Tanah Lot Temple', 'Uluwatu Temple', 'Rice Terraces', 'Nusa Penida'],
    imageUrl: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800',
    description: 'A tropical paradise known for spirituality, beaches, and culture.',
    bestTimeToVisit: 'April to October',
    avgFlightTime: '20h from NYC',
    avgDailyCost: 100,
    safetyLevel: 'Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },

  // North America
  {
    id: 'new-york-usa',
    city: 'New York',
    country: 'USA',
    iataCode: 'JFK',
    lat: 40.7128,
    lon: -74.0060,
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'English',
    tags: ['culture', 'food', 'shopping', 'nightlife', 'museums'],
    highlights: ['Times Square', 'Central Park', 'Statue of Liberty', 'Broadway', 'Empire State Building'],
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    description: 'The city that never sleeps with endless entertainment and culture.',
    bestTimeToVisit: 'April to June, September to November',
    avgFlightTime: 'Domestic',
    avgDailyCost: 300,
    safetyLevel: 'Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },
  {
    id: 'los-angeles-usa',
    city: 'Los Angeles',
    country: 'USA',
    iataCode: 'LAX',
    lat: 34.0522,
    lon: -118.2437,
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    language: 'English',
    tags: ['beaches', 'entertainment', 'food', 'shopping', 'nature'],
    highlights: ['Hollywood Walk of Fame', 'Venice Beach', 'Griffith Observatory', 'Santa Monica Pier', 'Getty Center'],
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
    description: 'The entertainment capital with beaches, mountains, and endless sunshine.',
    bestTimeToVisit: 'March to May, September to November',
    avgFlightTime: 'Domestic',
    avgDailyCost: 250,
    safetyLevel: 'Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },
  {
    id: 'mexico-city-mexico',
    city: 'Mexico City',
    country: 'Mexico',
    iataCode: 'MEX',
    lat: 19.4326,
    lon: -99.1332,
    timezone: 'America/Mexico_City',
    currency: 'MXN',
    language: 'Spanish',
    tags: ['culture', 'food', 'history', 'museums', 'architecture'],
    highlights: ['Zócalo', 'Frida Kahlo Museum', 'Teotihuacan', 'Chapultepec Castle', 'Xochimilco'],
    imageUrl: 'https://images.unsplash.com/photo-1522083165195-3424ed129620?w=800',
    description: 'A vibrant metropolis with rich history and world-class cuisine.',
    bestTimeToVisit: 'March to May, September to November',
    avgFlightTime: '4h from NYC',
    avgDailyCost: 120,
    safetyLevel: 'Moderate',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },
  {
    id: 'toronto-canada',
    city: 'Toronto',
    country: 'Canada',
    iataCode: 'YYZ',
    lat: 43.6532,
    lon: -79.3832,
    timezone: 'America/Toronto',
    currency: 'CAD',
    language: 'English, French',
    tags: ['culture', 'food', 'shopping', 'museums', 'nature'],
    highlights: ['CN Tower', 'Royal Ontario Museum', 'Casa Loma', 'Distillery District', 'Niagara Falls'],
    imageUrl: 'https://images.unsplash.com/photo-1517931524326-a81718f8a304?w=800',
    description: 'A multicultural city with diverse neighborhoods and attractions.',
    bestTimeToVisit: 'May to October',
    avgFlightTime: '1.5h from NYC',
    avgDailyCost: 200,
    safetyLevel: 'Very Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },

  // South America
  {
    id: 'rio-de-janeiro-brazil',
    city: 'Rio de Janeiro',
    country: 'Brazil',
    iataCode: 'GIG',
    lat: -22.9068,
    lon: -43.1729,
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    language: 'Portuguese',
    tags: ['beaches', 'culture', 'nature', 'nightlife', 'adventure'],
    highlights: ['Christ the Redeemer', 'Copacabana Beach', 'Sugarloaf Mountain', 'Ipanema', 'Tijuca Forest'],
    imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
    description: 'A vibrant city known for beaches, samba, and stunning natural beauty.',
    bestTimeToVisit: 'March to May, September to November',
    avgFlightTime: '10h from NYC',
    avgDailyCost: 120,
    safetyLevel: 'Moderate',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },
  {
    id: 'buenos-aires-argentina',
    city: 'Buenos Aires',
    country: 'Argentina',
    iataCode: 'EZE',
    lat: -34.6118,
    lon: -58.3960,
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    language: 'Spanish',
    tags: ['culture', 'food', 'dance', 'history', 'nightlife'],
    highlights: ['La Boca', 'Recoleta Cemetery', 'Tango Shows', 'San Telmo Market', 'Palermo'],
    imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800',
    description: 'The Paris of South America with tango, steak, and European charm.',
    bestTimeToVisit: 'March to May, September to November',
    avgFlightTime: '11h from NYC',
    avgDailyCost: 100,
    safetyLevel: 'Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },

  // Africa
  {
    id: 'cape-town-south-africa',
    city: 'Cape Town',
    country: 'South Africa',
    iataCode: 'CPT',
    lat: -33.9249,
    lon: 18.4241,
    timezone: 'Africa/Johannesburg',
    currency: 'ZAR',
    language: 'English, Afrikaans, Xhosa',
    tags: ['nature', 'beaches', 'culture', 'adventure', 'wine'],
    highlights: ['Table Mountain', 'Robben Island', 'V&A Waterfront', 'Cape Point', 'Wine Country'],
    imageUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800',
    description: 'A stunning coastal city with mountains, beaches, and rich history.',
    bestTimeToVisit: 'March to May, September to November',
    avgFlightTime: '16h from NYC',
    avgDailyCost: 120,
    safetyLevel: 'Moderate',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },
  {
    id: 'marrakech-morocco',
    city: 'Marrakech',
    country: 'Morocco',
    iataCode: 'RAK',
    lat: 31.6295,
    lon: -7.9811,
    timezone: 'Africa/Casablanca',
    currency: 'MAD',
    language: 'Arabic, French',
    tags: ['culture', 'history', 'shopping', 'food', 'architecture'],
    highlights: ['Jemaa el-Fnaa', 'Medina', 'Majorelle Gardens', 'Bahia Palace', 'Atlas Mountains'],
    imageUrl: 'https://images.unsplash.com/photo-1553603229-0f1a5d2c735c?w=800',
    description: 'A magical city of souks, palaces, and desert adventures.',
    bestTimeToVisit: 'March to May, September to November',
    avgFlightTime: '12h from NYC',
    avgDailyCost: 100,
    safetyLevel: 'Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  },

  // Oceania
  {
    id: 'sydney-australia',
    city: 'Sydney',
    country: 'Australia',
    iataCode: 'SYD',
    lat: -33.8688,
    lon: 151.2093,
    timezone: 'Australia/Sydney',
    currency: 'AUD',
    language: 'English',
    tags: ['beaches', 'nature', 'culture', 'food', 'outdoors'],
    highlights: ['Sydney Opera House', 'Bondi Beach', 'Harbour Bridge', 'Blue Mountains', 'Darling Harbour'],
    imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
    description: 'A stunning harbor city with iconic landmarks and beautiful beaches.',
    bestTimeToVisit: 'September to November, March to May',
    avgFlightTime: '22h from NYC',
    avgDailyCost: 250,
    safetyLevel: 'Very Safe',
    visaRequired: true,
    covidRestrictions: 'No restrictions'
  },

  // Middle East
  {
    id: 'dubai-uae',
    city: 'Dubai',
    country: 'UAE',
    iataCode: 'DXB',
    lat: 25.2048,
    lon: 55.2708,
    timezone: 'Asia/Dubai',
    currency: 'AED',
    language: 'Arabic, English',
    tags: ['luxury', 'shopping', 'architecture', 'desert', 'adventure'],
    highlights: ['Burj Khalifa', 'Palm Jumeirah', 'Dubai Mall', 'Desert Safari', 'Dubai Frame'],
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    description: 'A futuristic city of skyscrapers, luxury shopping, and desert adventures.',
    bestTimeToVisit: 'November to March',
    avgFlightTime: '13h from NYC',
    avgDailyCost: 300,
    safetyLevel: 'Very Safe',
    visaRequired: false,
    covidRestrictions: 'No restrictions'
  }
];

// Helper functions
export function getDestinationById(id: string): Destination | undefined {
  return destinations.find(dest => dest.id === id);
}

export function getDestinationsByTag(tag: string): Destination[] {
  return destinations.filter(dest => dest.tags.includes(tag));
}

export function getDestinationsByCountry(country: string): Destination[] {
  return destinations.filter(dest => dest.country.toLowerCase() === country.toLowerCase());
}

export function searchDestinations(query: string): Destination[] {
  const lowerQuery = query.toLowerCase();
  return destinations.filter(dest => 
    dest.city.toLowerCase().includes(lowerQuery) ||
    dest.country.toLowerCase().includes(lowerQuery) ||
    dest.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    dest.highlights.some(highlight => highlight.toLowerCase().includes(lowerQuery))
  );
}

export function getDestinationsByBudget(maxDailyCost: number): Destination[] {
  return destinations.filter(dest => dest.avgDailyCost <= maxDailyCost);
}

export function getDestinationsBySafetyLevel(level: Destination['safetyLevel']): Destination[] {
  return destinations.filter(dest => dest.safetyLevel === level);
}

export function getPopularDestinations(limit: number = 10): Destination[] {
  // Return destinations sorted by popularity (you can customize this logic)
  return destinations.slice(0, limit);
}

export function getDestinationsBySeason(month: number): Destination[] {
  // Return destinations that are good to visit in the given month
  const northernSummer = [6, 7, 8];
  const northernWinter = [12, 1, 2];
  
  if (northernSummer.includes(month)) {
    return destinations.filter(dest => 
      dest.country === 'Canada' || 
      dest.country === 'USA' || 
      dest.country === 'United Kingdom' ||
      dest.country === 'France' ||
      dest.country === 'Netherlands'
    );
  } else if (northernWinter.includes(month)) {
    return destinations.filter(dest => 
      dest.country === 'Thailand' || 
      dest.country === 'Singapore' || 
      dest.country === 'Australia' ||
      dest.country === 'Brazil' ||
      dest.country === 'Argentina'
    );
  }
  
  return destinations; // Spring and fall are good for most destinations
}
