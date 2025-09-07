export type WalkingTourStop = {
  order: number;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  description: string;
  suggestedMinutes: number;
  openHoursHint: string;
  distanceToNextMeters?: number;
};

export type WalkingTour = {
  id?: string;
  tripId?: string;
  city: string;
  country?: string;
  theme: 'Highlights'|'Foodie'|'Culture'|'Art & History'|'Parks';
  durationMin: number;
  pace: 'Leisurely'|'Normal'|'Brisk';
  start?: { lat?: number; lng?: number; name?: string };
  totalDistanceKm: number;
  totalDurationMin: number;
  stops: WalkingTourStop[];
  polyline?: string;
  createdAt?: string;
  mapUrl?: string;
};

export type TourGenerationInput = {
  city: string;
  country?: string;
  theme: 'Highlights'|'Foodie'|'Culture'|'Art & History'|'Parks';
  durationMin: number;
  pace: 'Leisurely'|'Normal'|'Brisk';
  start?: { lat?: number; lng?: number; name?: string };
  preferences?: {
    kidFriendly?: boolean;
    accessible?: boolean;
    budgetOnly?: boolean;
  };
};