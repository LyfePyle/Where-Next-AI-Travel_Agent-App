// Database Types for Where Next AI Travel Agent
// These types match the Supabase database schemas

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  destination: string;
  country: string | null;
  city: string | null;
  start_date: string | null;
  end_date: string | null;
  trip_duration: number | null;
  budget_amount: number | null;
  budget_style: 'budget' | 'comfortable' | 'luxury' | null;
  adults: number;
  kids: number;
  vibes: string[] | null;
  additional_details: string | null;
  fit_score: number | null;
  estimated_total: number | null;
  status: 'planning' | 'booked' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface TripSuggestion {
  id: string;
  trip_id: string;
  destination: string;
  country: string | null;
  city: string | null;
  fit_score: number | null;
  description: string | null;
  weather_temp: number | null;
  weather_condition: string | null;
  crowd_level: 'Low' | 'Medium' | 'High' | null;
  seasonality: string | null;
  estimated_total: number | null;
  flight_band_min: number | null;
  flight_band_max: number | null;
  hotel_band_min: number | null;
  hotel_band_max: number | null;
  hotel_style: string | null;
  hotel_area: string | null;
  highlights: string[] | null;
  why_it_fits: string | null;
  created_at: string;
}

export interface Itinerary {
  id: string;
  trip_id: string;
  day_number: number;
  title: string;
  activities: string[] | null;
  tips: string | null;
  estimated_cost: number | null;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_airlines: string[] | null;
  preferred_hotel_chains: string[] | null;
  preferred_seat_class: string;
  preferred_hotel_style: string;
  max_flight_duration_hours: number;
  visa_requirements_important: boolean;
  accessibility_needs: string[] | null;
  dietary_restrictions: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  trip_id: string;
  type: 'flight' | 'hotel' | 'package';
  booking_data: any; // JSONB data
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  booking_id: string;
  stripe_payment_intent_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  TRIPS: 'trips',
  TRIP_SUGGESTIONS: 'trip_suggestions',
  ITINERARIES: 'itineraries',
  USER_PREFERENCES: 'user_preferences',
  BOOKINGS: 'bookings',
  PAYMENT_TRANSACTIONS: 'payment_transactions',
} as const;

// Insert types (for creating new records)
export type InsertProfile = Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
export type InsertTrip = Omit<Trip, 'id' | 'created_at' | 'updated_at'>;
export type InsertTripSuggestion = Omit<TripSuggestion, 'id' | 'created_at'>;
export type InsertItinerary = Omit<Itinerary, 'id' | 'created_at'>;
export type InsertUserPreferences = Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>;
export type InsertBooking = Omit<Booking, 'id' | 'created_at' | 'updated_at'>;
export type InsertPaymentTransaction = Omit<PaymentTransaction, 'id' | 'created_at' | 'updated_at'>;

// Update types (for updating existing records)
export type UpdateProfile = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateTrip = Partial<Omit<Trip, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateTripSuggestion = Partial<Omit<TripSuggestion, 'id' | 'created_at'>>;
export type UpdateItinerary = Partial<Omit<Itinerary, 'id' | 'created_at'>>;
export type UpdateUserPreferences = Partial<Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateBooking = Partial<Omit<Booking, 'id' | 'created_at' | 'updated_at'>>;
export type UpdatePaymentTransaction = Partial<Omit<PaymentTransaction, 'id' | 'created_at' | 'updated_at'>>;
