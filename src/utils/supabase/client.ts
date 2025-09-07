import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Browser-compatible global variable for singleton
const getGlobalThis = (): any => {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  if (typeof self !== 'undefined') return self;
  throw new Error('Unable to locate global object');
};

// Use a browser-compatible global variable to ensure singleton
let supabaseInstance: SupabaseClient | null = null;

// Create a truly singleton instance
const getSupabaseInstance = (): SupabaseClient => {
  if (!supabaseInstance) {
    const globalObj = getGlobalThis();
    
    // Check if instance already exists on global object
    if (globalObj.__supabase_singleton) {
      supabaseInstance = globalObj.__supabase_singleton;
    } else {
      // Create new instance and store it globally
      supabaseInstance = createSupabaseClient(supabaseUrl, publicAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      });
      
      // Store on global object for persistence
      globalObj.__supabase_singleton = supabaseInstance;
    }
  }
  
  return supabaseInstance;
};

// Export the createClient function that returns the singleton instance
export const createClient = (): SupabaseClient => {
  return getSupabaseInstance();
};

// Export a default instance for convenience (this will be the same singleton)
export const supabase = getSupabaseInstance();

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface SavedTrip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  departure_city: string;
  start_date: string;
  end_date: string;
  budget: number;
  duration: number;
  interests: string[];
  companions: string;
  status: 'Draft' | 'Confirmed' | 'In Progress';
  itinerary: any;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  currency: string;
  units: string;
  default_budget: number;
  preferred_interests: string[];
  created_at: string;
  updated_at: string;
}