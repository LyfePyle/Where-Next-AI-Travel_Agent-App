const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up new Supabase project configuration...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('📄 Found existing .env.local file');
  const currentEnv = fs.readFileSync(envPath, 'utf8');
  console.log('Current environment variables:');
  console.log(currentEnv);
  console.log('\n' + '='.repeat(50) + '\n');
}

console.log('🔧 Please provide your new Supabase project credentials:');
console.log('You can find these in your Supabase Dashboard > Settings > API\n');

// Get user input (in a real scenario, you'd use readline or similar)
console.log('📝 Please update your .env.local file with the following template:');
console.log('(Replace the placeholder values with your actual credentials)\n');

const envTemplate = `# Supabase Configuration (NEW PROJECT)
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Amadeus API Configuration
AMADEUS_CLIENT_ID=3sY9VNvXIjyJYd5mmOtOzJLuL1BzJBBp
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here
AMADEUS_ENVIRONMENT=test

# Stripe Configuration (if using payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Optional APIs
OPENWEATHER_API_KEY=your_openweather_api_key_here
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key_here

# App Configuration
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_PREVIEW_HINT=true
PREVIEW_GUEST_ENABLED=true

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000`;

console.log(envTemplate);

console.log('\n' + '='.repeat(50));
console.log('📋 NEXT STEPS:');
console.log('1. Copy the template above to .env.local');
console.log('2. Replace placeholder values with your actual API keys');
console.log('3. Run the database schema in your new Supabase project');
console.log('4. Test the setup with: node test-openai.js');
console.log('5. Update Vercel environment variables for production');
console.log('\n🔗 Supabase Dashboard: https://supabase.com/dashboard');
console.log('🔗 OpenAI API Keys: https://platform.openai.com/api-keys');
console.log('🔗 Vercel Environment Variables: https://vercel.com/dashboard/[your-project]/settings/environment-variables');
