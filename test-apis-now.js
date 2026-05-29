// Quick API Test Script
const BASE_URL = 'http://localhost:3000';

const endpoints = [
  { method: 'GET', path: '/api/health', name: 'Health Check', auth: false },
  { method: 'GET', path: '/api/status', name: 'Status', auth: false },
  { method: 'GET', path: '/api/trips/save', name: 'Get Saved Trips', auth: true },
  { method: 'GET', path: '/api/trips?scope=my-trips', name: 'Get My Trips', auth: true },
  { method: 'GET', path: '/api/addons', name: 'Get Addons', auth: false },
  { method: 'GET', path: '/api/cart', name: 'Get Cart', auth: false },
];

async function testEndpoint(endpoint) {
  try {
    const url = `${BASE_URL}${endpoint.path}`;
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    console.log(`   ${endpoint.method} ${url}`);
    
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, options);
    const status = response.status;
    const statusText = response.statusText;
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }

    if (status >= 200 && status < 300) {
      console.log(`   ✅ SUCCESS (${status})`);
      if (typeof data === 'object') {
        console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
      }
      return { success: true, status, data };
    } else if (status === 401 && endpoint.auth) {
      console.log(`   ⚠️  AUTH REQUIRED (${status}) - This is expected for protected endpoints`);
      return { success: true, status, authRequired: true };
    } else {
      console.log(`   ❌ FAILED (${status} ${statusText})`);
      console.log(`   Error: ${typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : data}`);
      return { success: false, status, error: data };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAll() {
  console.log('🚀 Starting API Tests...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('='.repeat(60));

  const results = [];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ ...endpoint, ...result });
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const authRequired = results.filter(r => r.authRequired);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`⚠️  Auth Required (expected): ${authRequired.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\n❌ Failed Endpoints:');
    failed.forEach(r => {
      console.log(`   - ${r.name}: ${r.error || r.status}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ API Test Complete!');
  
  if (failed.length === 0) {
    console.log('🎉 All accessible endpoints are working!');
  } else {
    console.log('⚠️  Some endpoints failed - check the errors above.');
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      return true;
    }
  } catch (error) {
    console.error('❌ Server is not running or not accessible!');
    console.error('   Please start the dev server with: npm run dev');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
  return false;
}

// Run tests
(async () => {
  await checkServer();
  await testAll();
})();

