import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

// Types for database operations
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedTrip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget_cents: number;
  currency: string;
  preferences: any;
  itinerary: any;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  type: 'flight' | 'hotel';
  title: string;
  description: string;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'payment_failed' | 'refunded';
  payment_intent_id: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  travel_style: string[];
  preferred_airlines: string[];
  preferred_hotels: string[];
  budget_range: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
    deals: boolean;
  };
  privacy_settings: any;
  created_at: string;
  updated_at: string;
}

// Database service class
export class DatabaseService {
  // User Profile Operations
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('Error updating user profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return false;
    }
  }

  static async createUserProfile(profile: Omit<UserProfile, 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([profile]);

      if (error) {
        console.error('Error creating user profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return false;
    }
  }

  // Saved Trips Operations
  static async getUserTrips(userId: string): Promise<SavedTrip[]> {
    try {
      const { data, error } = await supabase
        .from('saved_trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user trips:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserTrips:', error);
      return [];
    }
  }

  static async saveTrip(trip: Omit<SavedTrip, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('saved_trips')
        .insert([trip])
        .select('id')
        .single();

      if (error) {
        console.error('Error saving trip:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in saveTrip:', error);
      return null;
    }
  }

  static async updateTrip(tripId: string, updates: Partial<SavedTrip>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_trips')
        .update(updates)
        .eq('id', tripId);

      if (error) {
        console.error('Error updating trip:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateTrip:', error);
      return false;
    }
  }

  static async deleteTrip(tripId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_trips')
        .delete()
        .eq('id', tripId);

      if (error) {
        console.error('Error deleting trip:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTrip:', error);
      return false;
    }
  }

  static async toggleTripFavorite(tripId: string, isFavorite: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_trips')
        .update({ is_favorite: isFavorite })
        .eq('id', tripId);

      if (error) {
        console.error('Error toggling trip favorite:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in toggleTripFavorite:', error);
      return false;
    }
  }

  // Booking Operations
  static async getUserBookings(userId: string): Promise<Booking[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user bookings:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserBookings:', error);
      return [];
    }
  }

  static async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select('id')
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in createBooking:', error);
      return null;
    }
  }

  static async updateBookingStatus(bookingId: string, status: Booking['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateBookingStatus:', error);
      return false;
    }
  }

  static async getBookingByPaymentIntent(paymentIntentId: string): Promise<Booking | null> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('payment_intent_id', paymentIntentId)
        .single();

      if (error) {
        console.error('Error fetching booking by payment intent:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getBookingByPaymentIntent:', error);
      return null;
    }
  }

  // User Preferences Operations
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserPreferences:', error);
      return null;
    }
  }

  static async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserPreferences:', error);
      return false;
    }
  }

  static async createUserPreferences(preferences: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .insert([preferences]);

      if (error) {
        console.error('Error creating user preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createUserPreferences:', error);
      return false;
    }
  }

  // Utility Functions
  static async initializeUserData(user: User): Promise<boolean> {
    try {
      // Create user profile if it doesn't exist
      const existingProfile = await this.getUserProfile(user.id);
      if (!existingProfile) {
        await this.createUserProfile({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.name || 'User',
          avatar_url: user.user_metadata?.avatar_url
        });
      }

      // Create user preferences if they don't exist
      const existingPreferences = await this.getUserPreferences(user.id);
      if (!existingPreferences) {
        await this.createUserPreferences({
          user_id: user.id,
          travel_style: ['culture', 'adventure'],
          preferred_airlines: [],
          preferred_hotels: [],
          budget_range: 'medium',
          notification_preferences: {
            email: true,
            push: true,
            deals: true
          },
          privacy_settings: {
            profile_visible: true,
            trips_visible: false
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Error initializing user data:', error);
      return false;
    }
  }

  static async searchTrips(userId: string, query: string): Promise<SavedTrip[]> {
    try {
      const { data, error } = await supabase
        .from('saved_trips')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,destination.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching trips:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchTrips:', error);
      return [];
    }
  }

  static async getTripStats(userId: string): Promise<{
    totalTrips: number;
    totalSpent: number;
    favoriteDestinations: string[];
    averageBudget: number;
  }> {
    try {
      const trips = await this.getUserTrips(userId);
      const bookings = await this.getUserBookings(userId);

      const totalTrips = trips.length;
      const totalSpent = bookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + (b.amount_cents / 100), 0);
      
      const favoriteDestinations = trips
        .filter(t => t.is_favorite)
        .map(t => t.destination);
      
      const averageBudget = trips.length > 0 
        ? trips.reduce((sum, t) => sum + (t.budget_cents / 100), 0) / trips.length
        : 0;

      return {
        totalTrips,
        totalSpent,
        favoriteDestinations,
        averageBudget
      };
    } catch (error) {
      console.error('Error in getTripStats:', error);
      return {
        totalTrips: 0,
        totalSpent: 0,
        favoriteDestinations: [],
        averageBudget: 0
      };
    }
  }
}

// Export default instance
export default DatabaseService;
