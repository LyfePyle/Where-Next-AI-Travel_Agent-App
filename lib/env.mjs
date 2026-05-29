import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // OpenAI Configuration
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  
  // Amadeus Configuration
  AMADEUS_CLIENT_ID: z.string().min(1, 'Amadeus client ID is required'),
  AMADEUS_CLIENT_SECRET: z.string().min(1, 'Amadeus client secret is required'),
  AMADEUS_ENVIRONMENT: z.enum(['test', 'production']).default('test'),
  
  // Stripe Configuration
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'Stripe publishable key is required'),
  STRIPE_SECRET_KEY: z.string().min(1, 'Stripe secret key is required'),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Optional APIs
  OPENWEATHER_API_KEY: z.string().optional(),
  EXCHANGE_RATE_API_KEY: z.string().optional(),
  
  // App Configuration
  NEXT_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_DEMO_MODE: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_PREVIEW_HINT: z.string().transform(val => val === 'true').default('true'),
  PREVIEW_GUEST_ENABLED: z.string().transform(val => val === 'true').default('false'),
  
  // NextAuth Configuration
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    // In Edge Runtime, we can't use console.error or process.exit
    // Just return a minimal valid object to prevent crashes
    console.warn('Environment validation failed, using defaults');
    
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      AMADEUS_CLIENT_ID: process.env.AMADEUS_CLIENT_ID || '',
      AMADEUS_CLIENT_SECRET: process.env.AMADEUS_CLIENT_SECRET || '',
      AMADEUS_ENVIRONMENT: 'test',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
      EXCHANGE_RATE_API_KEY: process.env.EXCHANGE_RATE_API_KEY || '',
      NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
      NEXT_PUBLIC_PREVIEW_HINT: process.env.NEXT_PUBLIC_PREVIEW_HINT === 'true',
      PREVIEW_GUEST_ENABLED: process.env.PREVIEW_GUEST_ENABLED === 'true',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NODE_ENV: process.env.NODE_ENV || 'development'
    };
  }
}

// Export validated environment
export const env = validateEnv();

// Type-safe environment access
// Note: TypeScript types are not available in .mjs files
// Use JSDoc for type hints instead

// Helper to check if we're in production
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

// Helper to check if demo mode is enabled
export const isDemoMode = env.NEXT_PUBLIC_DEMO_MODE;

// Helper to get API base URLs
export const getApiBaseUrl = () => {
  if (isDevelopment) return 'http://localhost:3000';
  return env.NEXT_PUBLIC_URL;
};

// Helper to check if optional APIs are configured
export const hasWeatherApi = !!env.OPENWEATHER_API_KEY;
export const hasCurrencyApi = !!env.EXCHANGE_RATE_API_KEY;

// Log environment status (only in development)
if (isDevelopment) {
  console.log('🔧 Environment validation passed');
  console.log(`  - Supabase URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`  - OpenAI: ${env.OPENAI_API_KEY.substring(0, 20)}...`);
  console.log(`  - Amadeus: ${env.AMADEUS_CLIENT_ID.substring(0, 10)}...`);
  console.log(`  - Stripe: ${env.STRIPE_SECRET_KEY.substring(0, 20)}...`);
  console.log(`  - Weather API: ${hasWeatherApi ? '✅' : '❌'}`);
  console.log(`  - Currency API: ${hasCurrencyApi ? '✅' : '❌'}`);
  console.log(`  - Demo Mode: ${isDemoMode ? '✅' : '❌'}`);
}
