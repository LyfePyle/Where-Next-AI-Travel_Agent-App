const https = require('https');
const http = require('http');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testAPIEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');

  const baseUrl = 'http://localhost:3000/api';

  // Test 1: Weather API
  console.log('1. Testing Weather API...');
  try {
    const response = await makeRequest(`${baseUrl}/utils/weather?city=London`);
    console.log('   ✅ Weather API:', response.status === 200 ? 'Working' : `Error ${response.status}`);
  } catch (error) {
    console.log('   ❌ Weather API: Failed to connect');
  }

  // Test 2: Currency API
  console.log('\n2. Testing Currency API...');
  try {
    const response = await makeRequest(`${baseUrl}/utils/currency?base=USD`);
    console.log('   ✅ Currency API:', response.status === 200 ? 'Working' : `Error ${response.status}`);
  } catch (error) {
    console.log('   ❌ Currency API: Failed to connect');
  }

  // Test 3: Phrases API
  console.log('\n3. Testing Phrases API...');
  try {
    const response = await makeRequest(`${baseUrl}/utils/phrases?language=es`);
    console.log('   ✅ Phrases API:', response.status === 200 ? 'Working' : `Error ${response.status}`);
  } catch (error) {
    console.log('   ❌ Phrases API: Failed to connect');
  }

  // Test 4: Database Health Check
  console.log('\n4. Testing Database Health...');
  try {
    const response = await makeRequest(`${baseUrl}/db-health`);
    console.log('   ✅ Database Health:', response.status === 200 ? 'Working' : `Error ${response.status}`);
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
