export interface TourTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isPremium: boolean;
  estimatedStops: number;
  sampleStops: string[];
}

export interface TourStop {
  id: string;
  name: string;
  description: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  type: 'landmark' | 'restaurant' | 'cafe' | 'museum' | 'park' | 'market' | 'temple' | 'viewpoint';
  timeToSpend: number; // minutes
  walkTimeToNext: number; // minutes
  walkDistanceToNext: number; // meters
  rating?: number;
  priceLevel?: 1 | 2 | 3 | 4; // $ to $$$$
  tips?: string[];
  imageUrl?: string;
  openingHours?: string;
  website?: string;
}

export interface GeneratedTour {
  id: string;
  title: string;
  description: string;
  theme: TourTheme;
  destination: string;
  totalDistance: number; // meters
  totalDuration: number; // minutes
  totalWalkTime: number; // minutes
  stops: TourStop[];
  mapUrl?: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
  tags: string[];
  createdAt: Date;
  isPremium: boolean;
}

export interface TourGenerationParams {
  destination: string;
  theme: string;
  duration: number; // hours
  maxDistance?: number; // km
  startLocation?: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
  interests: string[];
  budget: 'free' | 'low' | 'medium' | 'high';
  groupSize: number;
}

export interface UserTourAccess {
  userId: string;
  hasPremium: boolean;
  freeToursUsed: number;
  freeToursLimit: number;
  purchasedTours: string[];
  subscriptionStatus: 'none' | 'active' | 'cancelled' | 'expired';
  subscriptionExpiry?: Date;
}

export interface TourPayment {
  tourId: string;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'apple_pay' | 'google_pay';
  status: 'pending' | 'completed' | 'failed';
  stripePaymentIntentId?: string;
}