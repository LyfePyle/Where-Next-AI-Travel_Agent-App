const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testApiEndpoints() {
  console.log('🌐 Testing API Endpoints...\n');

  const baseUrl = 'http://localhost:3000';
  
  // Test 1: Weather API
  console.log('1️⃣ Testing Weather API...');
  try {
    const response = await fetch(`${baseUrl}/api/utils/weather?city=Paris&country=France`);
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Weather API: Working (${response.status})`);
      console.log(`  📊 Response: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      console.log(`  ❌ Weather API: Failed (${response.status})`);
    }
  } catch (error) {
    console.log(`  ❌ Weather API: Error - ${error.message}`);
  }

  // Test 2: Currency API
  console.log('\n2️⃣ Testing Currency API...');
  try {
    const response = await fetch(`${baseUrl}/api/utils/currency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'USD', to: 'EUR', amount: 100 })
    });
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Currency API: Working (${response.status})`);
      console.log(`  📊 Response: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      console.log(`  ❌ Currency API: Failed (${response.status})`);
    }
  } catch (error) {
    console.log(`  ❌ Currency API: Error - ${error.message}`);
  }

  // Test 3: AI Suggestions API
  console.log('\n3️⃣ Testing AI Suggestions API...');
  try {
    const response = await fetch(`${baseUrl}/api/ai/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Vancouver (YVR) - Canada',
        startDate: '2025-01-01',
        endDate: '2025-01-07',
        budgetAmount: 2000,
        budgetDaily: 100,
        budgetFlights: 500,
        budgetHotels: 150,
        tripDuration: 7,
        budgetStyle: 'comfortable',
        vibes: [],
        adults: 2,
        kids: 0,
        additionalDetails: ''
      })
    });
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ AI Suggestions API: Working (${response.status})`);
      console.log(`  📊 Response: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      console.log(`  ❌ AI Suggestions API: Failed (${response.status})`);
    }
  } catch (error) {
    console.log(`  ❌ AI Suggestions API: Error - ${error.message}`);
  }

  // Test 4: Trips API
  console.log('\n4️⃣ Testing Trips API...');
  try {
    const response = await fetch(`${baseUrl}/api/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Trip',
        destination: 'Paris',
        startDate: '2025-01-01',
        endDate: '2025-01-07',
        budgetCents: 200000,
        currency: 'usd',
        preferences: {},
        itinerary: {}
      })
    });
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Trips API: Working (${response.status})`);
      console.log(`  📊 Response: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      console.log(`  ❌ Trips API: Failed (${response.status})`);
    }
  } catch (error) {
    console.log(`  ❌ Trips API: Error - ${error.message}`);
  }

  // Test 5: Budgets API
  console.log('\n5️⃣ Testing Budgets API...');
  try {
    const response = await fetch(`${baseUrl}/api/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Budget',
        description: 'Test',
        plannedAmount: 1000,
        currency: 'USD',
        status: 'active'
      })
    });
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Budgets API: Working (${response.status})`);
      console.log(`  📊 Response: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      console.log(`  ❌ Budgets API: Failed (${response.status})`);
    }
  } catch (error) {
    console.log(`  ❌ Budgets API: Error - ${error.message}`);
  }

  console.log('\n🎉 API endpoint testing completed!');
}

testApiEndpoints();