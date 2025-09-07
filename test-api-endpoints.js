const fetch = require('node-fetch');

async function testAPIEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');

  const baseUrl = 'http://localhost:3000/api';

  // Test 1: Weather API
  console.log('1. Testing Weather API...');
  try {
    const weatherResponse = await fetch(`${baseUrl}/utils/weather?city=London`);
    const weatherData = await weatherResponse.json();
    console.log('   ✅ Weather API:', weatherData.ok ? 'Working' : 'Error');
  } catch (error) {
    console.log('   ❌ Weather API: Failed to connect');
  }

  // Test 2: Currency API
  console.log('\n2. Testing Currency API...');
  try {
    const currencyResponse = await fetch(`${baseUrl}/utils/currency?base=USD`);
    const currencyData = await currencyResponse.json();
    console.log('   ✅ Currency API:', currencyData.ok ? 'Working' : 'Error');
  } catch (error) {
    console.log('   ❌ Currency API: Failed to connect');
  }

  // Test 3: Phrases API
  console.log('\n3. Testing Phrases API...');
  try {
    const phrasesResponse = await fetch(`${baseUrl}/utils/phrases?language=es`);
    const phrasesData = await phrasesResponse.json();
    console.log('   ✅ Phrases API:', phrasesData.ok ? 'Working' : 'Error');
  } catch (error) {
    console.log('   ❌ Phrases API: Failed to connect');
  }

  // Test 4: Database Health Check
  console.log('\n4. Testing Database Health...');
  try {
    const dbResponse = await fetch(`${baseUrl}/db-health`);
    const dbData = await dbResponse.json();
    console.log('   ✅ Database Health:', dbData.ok ? 'Working' : 'Error');
  } catch (error) {
    console.log('   ❌ Database Health: Failed to connect');
  }

  console.log('\n🎉 API Endpoint Testing Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Visit: http://localhost:3000');
  console.log('2. Test the frontend features');
  console.log('3. Create a trip and add expenses');
  console.log('4. Test the walking tour generation');
}

testAPIEndpoints();
