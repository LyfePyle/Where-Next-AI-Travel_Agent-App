const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables...\n');

const envContent = `# Supabase Configuration (REPLACE WITH YOUR ACTUAL CREDENTIALS)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# External APIs (optional)
NEXT_PUBLIC_WEATHER_API_KEY=your_weather_api_key_here
NEXT_PUBLIC_CURRENCY_API_KEY=your_currency_api_key_here

# App Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
`;

const envPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists. Skipping creation.');
} else {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
  console.log('📝 Please edit .env.local with your actual API keys');
}

console.log('\n📋 Next steps:');
console.log('1. Create a Supabase project at https://supabase.com');
console.log('2. Get your project URL and API keys from Settings > API');
console.log('3. Update .env.local with your actual credentials');
console.log('4. Run the database schema in Supabase SQL Editor');
console.log('5. Test the connection with: node test-db-connection.js');
