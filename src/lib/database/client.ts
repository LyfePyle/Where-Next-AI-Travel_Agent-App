// Supabase Database Client for Where Next AI Travel Agent
import { createClient } from '@supabase/supabase-js';
import { 
  Profile, 
  Trip, 
  TripSuggestion, 
  Itinerary, 
  UserPreferences, 
  Booking, 
  PaymentTransaction,
  InsertProfile,
  InsertTrip,
  InsertTripSuggestion,
  InsertItinerary,
  InsertUserPreferences,
  InsertBooking,
  InsertPaymentTransaction,
  UpdateProfile,
  UpdateTrip,
  UpdateTripSuggestion,
  UpdateItinerary,
  UpdateUserPreferences,
  UpdateBooking,
  UpdatePaymentTransaction,
  TABLES
} from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database operation functions
export class DatabaseService {
  // Profile operations
  static async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async upsertProfile(profile: InsertProfile): Promise<Profile> {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .upsert(profile)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Trip operations
  static async createTrip(trip: InsertTrip): Promise<Trip> {
    const { data, error } = await supabase
      .from(TABLES.TRIPS)
      .insert(trip)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getTrip(tripId: string): Promise<Trip | null> {
    const { data, error } = await supabase
      .from(TABLES.TRIPS)
      .select('*')
      .eq('id', tripId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserTrips(userId: string): Promise<Trip[]> {
    const { data, error } = await supabase
      .from(TABLES.TRIPS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async updateTrip(tripId: string, updates: UpdateTrip): Promise<Trip> {
    const { data, error } = await supabase
      .from(TABLES.TRIPS)
      .update(updates)
      .eq('id', tripId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteTrip(tripId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.TRIPS)
      .delete()
      .eq('id', tripId);
    
    if (error) throw error;
  }

  // Trip suggestions operations
  static async createTripSuggestion(suggestion: InsertTripSuggestion): Promise<TripSuggestion> {
    const { data, error } = await supabase
      .from(TABLES.TRIP_SUGGESTIONS)
      .insert(suggestion)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getTripSuggestions(tripId: string): Promise<TripSuggestion[]> {
    const { data, error } = await supabase
      .from(TABLES.TRIP_SUGGESTIONS)
      .select('*')
      .eq('trip_id', tripId)
      .order('fit_score', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Itinerary operations
  static async createItinerary(itinerary: InsertItinerary): Promise<Itinerary> {
    const { data, error } = await supabase
      .from(TABLES.ITINERARIES)
      .insert(itinerary)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getTripItinerary(tripId: string): Promise<Itinerary[]> {
    const { data, error } = await supabase
      .from(TABLES.ITINERARIES)
      .select('*')
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // User preferences operations
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from(TABLES.USER_PREFERENCES)
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from(TABLES.USER_PREFERENCES)
      .upsert(preferences)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Booking operations
  static async createBooking(booking: InsertBooking): Promise<Booking> {
    const { data, error } = await supabase
      .from(TABLES.BOOKINGS)
      .insert(booking)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserBookings(userId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from(TABLES.BOOKINGS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async updateBookingStatus(bookingId: string, status: Booking['status']): Promise<Booking> {
    const { data, error } = await supabase
      .from(TABLES.BOOKINGS)
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Payment transaction operations
  static async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const { data, error } = await supabase
      .from(TABLES.PAYMENT_TRANSACTIONS)
      .insert(transaction)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updatePaymentTransaction(transactionId: string, updates: UpdatePaymentTransaction): Promise<PaymentTransaction> {
    const { data, error } = await supabase
      .from(TABLES.PAYMENT_TRANSACTIONS)
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Utility functions
  static async getTripWithDetails(tripId: string) {
    const { data, error } = await supabase
      .from(TABLES.TRIPS)
      .select(`
        *,
        trip_suggestions (*),
        itineraries (*)
      `)
      .eq('id', tripId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserDashboard(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.TRIPS)
      .select(`
        *,
        trip_suggestions (*),
        bookings (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
}

// Export individual functions for convenience
export const {
  getProfile,
  upsertProfile,
  createTrip,
  getTrip,
  getUserTrips,
  updateTrip,
  deleteTrip,
  createTripSuggestion,
  getTripSuggestions,
  createItinerary,
  getTripItinerary,
  getUserPreferences,
  upsertUserPreferences,
  createBooking,
  getUserBookings,
  updateBookingStatus,
  createPaymentTransaction,
  updatePaymentTransaction,
  getTripWithDetails,
  getUserDashboard
} = DatabaseService;
