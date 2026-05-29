import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Use environment variables if available, otherwise fall back to hardcoded values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${projectId}.supabase.co`;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || publicAnonKey;

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

// Create a truly singleton instance using @supabase/ssr for cookie-based sessions
const getSupabaseInstance = (): SupabaseClient => {
  if (typeof window === 'undefined') {
    throw new Error('This client can only be used in the browser');
  }

  if (!supabaseInstance) {
    const globalObj = getGlobalThis();
    
    // Check if instance already exists on global object
    if (globalObj.__supabase_singleton) {
      supabaseInstance = globalObj.__supabase_singleton;
    } else {
      // Use createBrowserClient from @supabase/ssr to store sessions in cookies
      // This allows server components to read the session
      // Validate URL and key before creating client
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('⚠️ Supabase URL or Anon Key is missing. Please check your environment variables.');
        throw new Error('Supabase configuration is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
      }

      if (!supabaseUrl.startsWith('http')) {
        console.error('⚠️ Invalid Supabase URL format:', supabaseUrl);
        throw new Error('Invalid Supabase URL format. URL must start with http:// or https://');
      }

      supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          // storage omitted — lets createBrowserClient use cookie-based storage by default
          // so middleware can read the session on the server side
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
  // Only create client in browser
  if (typeof window === 'undefined') {
    throw new Error('This client can only be used in the browser. Use createClient() inside useEffect or event handlers.');
  }
  return getSupabaseInstance();
};

// Lazy getter for default instance (only created when accessed in browser)
let _supabaseInstance: SupabaseClient | null = null;
export const getSupabase = (): SupabaseClient => {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be used in the browser. Use createClient() inside useEffect or event handlers.');
  }
  if (!_supabaseInstance) {
    _supabaseInstance = createClient();
  }
  return _supabaseInstance;
};

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