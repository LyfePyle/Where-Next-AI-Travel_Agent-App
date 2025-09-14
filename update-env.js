const fs = require('fs');
const path = require('path');

console.log('🔧 Updating environment variables with your Supabase credentials...\n');

const envContent = `# Supabase Configuration (REPLACE WITH YOUR CREDENTIALS)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

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

fs.writeFileSync(envPath, envContent);
console.log('✅ Updated .env.local file with your Supabase credentials');
console.log('📝 You still need to add:');
console.log('   - SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard)');
console.log('   - OPENAI_API_KEY (optional)');
console.log('   - Other API keys (optional)');

console.log('\n🧪 Testing connection...');
console.log('Run: node test-db-connection.js');