const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Comprehensive App Testing Suite\n');

// Test 1: Environment Variables
console.log('1️⃣ Testing Environment Variables...');
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'AMADEUS_CLIENT_ID',
  'AMADEUS_CLIENT_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'NEXTAUTH_SECRET'
];

let envIssues = 0;
requiredVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: Found`);
  } else {
    console.log(`  ❌ ${varName}: Missing`);
    envIssues++;
  }
});

if (envIssues > 0) {
  console.log(`\n⚠️  ${envIssues} environment variables missing`);
} else {
  console.log('\n✅ All required environment variables found');
}

// Test 2: Supabase Connection
console.log('\n2️⃣ Testing Supabase Connection...');
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('  ❌ Supabase credentials missing');
  } else {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ Supabase connection failed: ${error.message}`);
    } else {
      console.log('  ✅ Supabase connection successful');
    }
  }
} catch (error) {
  console.log(`  ❌ Supabase test failed: ${error.message}`);
}

// Test 3: OpenAI Connection
console.log('\n3️⃣ Testing OpenAI Connection...');
try {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    console.log('  ❌ OpenAI API key missing');
  } else {
    const openai = new OpenAI({ apiKey: openaiKey });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Test connection" }],
      max_tokens: 10
    });
    
    console.log('  ✅ OpenAI connection successful');
  }
} catch (error) {
  console.log(`  ❌ OpenAI test failed: ${error.message}`);
}

// Test 4: Database Tables
console.log('\n4️⃣ Testing Database Tables...');
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const tables = [
      'profiles',
      'saved_trips', 
      'budgets',
      'budget_categories',
      'expenses',
      'carts',
      'cart_items',
      'orders',
      'order_items',
      'payments',
      'trip_bookings',
      'payment_sessions',
      'booking_confirmations',
      'city_profiles',
      'addons',
      'addon_templates'
    ];
    
    let tablesFound = 0;
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`  ❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`  ✅ Table ${table}: Exists`);
          tablesFound++;
        }
      } catch (err) {
        console.log(`  ❌ Table ${table}: ${err.message}`);
      }
    }
    
    console.log(`\n  📊 Tables found: ${tablesFound}/${tables.length}`);
  }
} catch (error) {
  console.log(`  ❌ Database test failed: ${error.message}`);
}

// Test 5: API Endpoints
console.log('\n5️⃣ Testing API Endpoints...');
const baseUrl = 'http://localhost:3000';
const endpoints = [
  '/api/utils/weather?city=Paris&country=France',
  '/api/utils/currency',
  '/api/ai/suggestions',
  '/api/trips',
  '/api/budgets'
];

for (const endpoint of endpoints) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: endpoint.includes('currency') || endpoint.includes('suggestions') || endpoint.includes('trips') || endpoint.includes('budgets') ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: endpoint.includes('currency') ? JSON.stringify({ from: 'USD', to: 'EUR', amount: 100 }) : 
            endpoint.includes('suggestions') ? JSON.stringify({ from: 'Vancouver (YVR) - Canada', startDate: '2025-01-01', endDate: '2025-01-07', budgetAmount: 2000, budgetDaily: 100, budgetFlights: 500, budgetHotels: 150, tripDuration: 7, budgetStyle: 'comfortable', vibes: [], adults: 2, kids: 0, additionalDetails: '' }) :
            endpoint.includes('trips') ? JSON.stringify({ title: 'Test Trip', destination: 'Paris', startDate: '2025-01-01', endDate: '2025-01-07', budgetCents: 200000, currency: 'usd', preferences: {}, itinerary: {} }) :
            endpoint.includes('budgets') ? JSON.stringify({ name: 'Test Budget', description: 'Test', plannedAmount: 1000, currency: 'USD', status: 'active' }) :
            undefined
    });
    
    if (response.ok) {
      console.log(`  ✅ ${endpoint}: Working (${response.status})`);
    } else {
      console.log(`  ❌ ${endpoint}: Failed (${response.status})`);
    }
  } catch (error) {
    console.log(`  ❌ ${endpoint}: Error - ${error.message}`);
  }
}

// Test 6: App Pages
console.log('\n6️⃣ Testing App Pages...');
const pages = [
  '/',
  '/dashboard',
  '/saved',
  '/tours',
  '/plan-trip',
  '/auth/login'
];

for (const page of pages) {
  try {
    const response = await fetch(`${baseUrl}${page}`);
    
    if (response.ok) {
      console.log(`  ✅ ${page}: Working (${response.status})`);
    } else {
      console.log(`  ❌ ${page}: Failed (${response.status})`);
    }
  } catch (error) {
    console.log(`  ❌ ${page}: Error - ${error.message}`);
  }
}

console.log('\n🎉 Comprehensive testing completed!');
console.log('\n📋 Summary:');
console.log('- Check the results above for any issues');
console.log('- Fix any missing environment variables');
console.log('- Ensure all database tables exist');
console.log('- Verify API endpoints are working');
console.log('- Test app pages are accessible');









