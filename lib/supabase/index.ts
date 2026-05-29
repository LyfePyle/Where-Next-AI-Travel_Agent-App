// Unified Supabase exports
export { createClient, getClient } from './client';
export { createServiceClient, createServerClient, getUser, isAuthenticated, getUserId } from './server';

// Re-export types
export type { User, Session } from '@supabase/supabase-js';
