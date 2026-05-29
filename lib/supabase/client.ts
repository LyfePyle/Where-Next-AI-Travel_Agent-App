import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '../env.mjs';

// Client-side Supabase client (browser only)
export function createClient() {
  if (typeof window === 'undefined') {
    throw new Error('createClient() can only be called on the client side');
  }

  return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  });
}

// Singleton client instance for browser
let clientInstance: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (typeof window === 'undefined') {
    throw new Error('getClient() can only be called on the client side');
  }

  if (!clientInstance) {
    clientInstance = createClient();
  }

  return clientInstance;
}
