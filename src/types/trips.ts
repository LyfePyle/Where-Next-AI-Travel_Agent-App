export type UserCriteria = {
  departureCity: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  lengthDays: number;
  travelers: number;
  budgetUSD: number;
  interests?: string[]; // food, beaches, culture, adventure, etc.
  planningMode?: 'cheapest' | 'fastest' | 'easiest';
};

export type TripSuggestion = {
  id: string;
  destination: string;
  country: string;
  summary: string;
  avgTempC?: number;
  weatherShort?: string; // "Warm & dry", "Cool & rainy", etc.
  estFlightUSD: number;
  estStayUSD: number;
  estActivitiesUSD: number;
  estTotalUSD: number;
  highlights: string[];
  imageUrl?: string;
  bestTimeToVisit?: string;
  travelTime?: string; // "8h flight", "2h train", etc.
  planningMode: 'cheapest' | 'fastest' | 'easiest';
};

export type ItineraryDay = {
  day: number;
  city: string;
  theme: string;
  activities: {
    time?: string;
    title: string;
    description: string;
    estCostUSD?: number;
    location?: string;
  }[];
  estCost: number;
};

export type FullItinerary = {
  id: string;
  destination: string;
  country: string;
  days: ItineraryDay[];
  estTotals: {
    flightsUSD: number;
    staysUSD: number;
    activitiesUSD: number;
    foodUSD: number;
    transportUSD: number;
    totalUSD: number;
  };
  planningContext: {
    departureCity: string;
    startDate: string;
    endDate: string;
    lengthDays: number;
    travelers: number;
    budgetUSD: number;
    interests?: string[];
    planningMode: string;
  };
  recommendations?: {
    bestTimeToBook: string;
    moneySavingTips: string[];
    packingSuggestions: string[];
    localInsights: string[];
  };
  generatedAt: string;
};

export type SavedTrip = {
  id: string;
  userId?: string;
  tripSuggestion: TripSuggestion;
  savedAt: string;
  notes?: string;
};

export type WeatherData = {
  avgTempC: number;
  weatherShort: string;
  conditions: string;
  humidity: number;
  windSpeed: number;
};
