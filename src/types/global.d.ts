import { SupabaseClient } from '@supabase/supabase-js';

declare global {
  var __supabase_singleton: SupabaseClient | undefined;
  
  interface Window {
    __supabase_singleton?: SupabaseClient;
  }
}

export {};