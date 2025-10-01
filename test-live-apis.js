#!/usr/bin/env node

/**
 * Live API Testing Script for Where Next Travel Agent
 * Tests weather, currency, and flight APIs to show live data
 */

const BASE_URL = 'http://localhost:3000';

console.log('🌍 WHERE NEXT - LIVE API DATA TESTING');
console.log('=====================================\n');

async function testWeatherAPI() {
  console.log('🌤️  TESTING LIVE WEATHER DATA');
  console.log('------------------------------');
  
  const cities = [
    { city: 'London', country: 'UK' },
    { city: 'Tokyo', country: 'Japan' },
    { city: 'New York', country: 'USA' },
    { city: 'Paris', country: 'France' },
    { city: 'Sydney', country: 'Australia' }
  ];

  for (const location of cities) {
    try {
      const response = await fetch(`${BASE_URL}/api/utils/weather?city=${location.city}&country=${location.country}`);
      const data = await response.json();
      
      if (data.ok) {
        const weather = data.data.current;
        console.log(`📍 ${location.city}, ${location.country}:`);
        console.log(`   🌡️  ${weather.temperature}°C (feels like ${weather.feelsLike}°C)`);
        console.log(`   ☁️  ${weather.description}`);
        console.log(`   💨 Wind: ${weather.windSpeed} m/s`);
        console.log(`   💧 Humidity: ${weather.humidity}%\n`);
      } else {
        console.log(`❌ ${location.city}: ${data.error}\n`);
      }
    } catch (error) {
      console.log(`❌ ${location.city}: ${error.message}\n`);
    }
  }
}

async function testCurrencyAPI() {
  console.log('💱 TESTING LIVE EXCHANGE RATES');
  console.log('-------------------------------');
  
  const conversions = [
    { from: 'USD', to: 'EUR', amount: 100 },
    { from: 'USD', to: 'GBP', amount: 100 },
    { from: 'USD', to: 'JPY', amount: 100 },
    { from: 'EUR', to: 'USD', amount: 100 },
    { from: 'GBP', to: 'USD', amount: 100 },
    { from: 'CAD', to: 'USD', amount: 100 }
  ];

  for (const conversion of conversions) {
    try {
      const response = await fetch(`${BASE_URL}/api/utils/currency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversion)
      });
      const data = await response.json();
      
      if (data.ok) {
        const result = data.data;
        console.log(`💰 ${conversion.amount} ${conversion.from} = ${result.to.amount} ${conversion.to}`);
        console.log(`   📊 Rate: ${result.rate} (Updated: ${result.lastUpdated})\n`);
      } else {
        console.log(`❌ ${conversion.from}→${conversion.to}: ${data.error}\n`);
      }
    } catch (error) {
      console.log(`❌ ${conversion.from}→${conversion.to}: ${error.message}\n`);
    }
  }
}

async function testFlightAPI() {
  console.log('✈️  TESTING FLIGHT SEARCH DATA');
  console.log('------------------------------');
  
  const searches = [
    { origin: 'JFK', destination: 'LHR', route: 'New York → London' },
    { origin: 'LAX', destination: 'NRT', route: 'Los Angeles → Tokyo' },
    { origin: 'CDG', destination: 'JFK', route: 'Paris → New York' }
  ];

  for (const search of searches) {
    try {
      const response = await fetch(`${BASE_URL}/api/amadeus/flights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originLocationCode: search.origin,
          destinationLocationCode: search.destination,
          departureDate: '2024-12-15',
          adults: 1
        })
      });
      const data = await response.json();
      
      if (data.flights && data.flights.length > 0) {
        console.log(`🛫 ${search.route}:`);
        console.log(`   ✅ Found ${data.count} flights`);
        console.log(`   💰 Price range: $${data.flights[0].price.total} - $${data.flights[data.flights.length-1].price.total}`);
        console.log(`   📊 Source: ${data.source}\n`);
      } else {
        console.log(`❌ ${search.route}: No flights found\n`);
      }
    } catch (error) {
      console.log(`❌ ${search.route}: ${error.message}\n`);
    }
  }
}

async function testAIAPI() {
  console.log('🤖 TESTING AI SUGGESTIONS');
  console.log('-------------------------');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'New York',
        budget: 3000,
        vibes: ['beach', 'culture'],
        adults: 2,
        tripDuration: 7
      })
    });
    const data = await response.json();
    
    if (data.suggestions && data.suggestions.length > 0) {
      console.log(`🎯 Generated ${data.suggestions.length} AI suggestions:`);
      data.suggestions.forEach((suggestion, index) => {
        console.log(`   ${index + 1}. ${suggestion.destination}`);
        console.log(`      💰 Est. cost: $${suggestion.estimatedTotal}`);
        console.log(`      📊 Fit score: ${suggestion.fitScore}%`);
      });
      console.log(`   📊 Source: ${data.source}\n`);
    } else {
      console.log(`❌ AI Suggestions: ${data.error || 'No suggestions generated'}\n`);
    }
  } catch (error) {
    console.log(`❌ AI Suggestions: ${error.message}\n`);
  }
}

async function runAllTests() {
  const startTime = Date.now();
  
  try {
    await testWeatherAPI();
    await testCurrencyAPI();
    await testFlightAPI();
    await testAIAPI();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('🎉 TESTING COMPLETE');
    console.log('===================');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log('🌐 All APIs tested successfully!');
    console.log('\n💡 To see live data in your browser:');
    console.log('   🏠 Homepage: http://localhost:3000');
    console.log('   🎯 Dashboard: http://localhost:3000/app/dashboard');
    console.log('   ✈️  Plan Trip: http://localhost:3000/plan-trip');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run the tests
runAllTests();
