#!/usr/bin/env node

/**
 * Comprehensive API Testing Suite
 * Tests all major APIs and booking flows
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`[${status}] ${testName}`, statusColor);
  if (details) {
    log(`       ${details}`, 'cyan');
  }
  
  testResults.tests.push({ testName, status, details });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
}

async function testAPI(url, method = 'GET', body = null, description = '') {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      logTest(`API: ${description || url}`, 'PASS', `Status: ${response.status}`);
      return { success: true, data, status: response.status };
    } else {
      logTest(`API: ${description || url}`, 'FAIL', `Status: ${response.status} - ${data.error || 'Unknown error'}`);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    logTest(`API: ${description || url}`, 'FAIL', `Network error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testEnvironmentVariables() {
  log('\n🔧 Testing Environment Variables...', 'yellow');
  
  const envFile = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envFile)) {
    logTest('Environment File', 'FAIL', '.env.local file not found');
    return false;
  }
  
  const envContent = fs.readFileSync(envFile, 'utf8');
  const requiredVars = [
    'OPENAI_API_KEY',
    'AMADEUS_CLIENT_ID',
    'AMADEUS_CLIENT_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'STRIPE_SECRET_KEY'
  ];
  
  let allPresent = true;
  for (const varName of requiredVars) {
    const isPresent = envContent.includes(`${varName}=`) && 
                     !envContent.includes(`${varName}=your_`) && 
                     !envContent.includes(`${varName}=`);
    
    if (isPresent) {
      logTest(`Environment Variable: ${varName}`, 'PASS');
    } else {
      logTest(`Environment Variable: ${varName}`, 'FAIL', 'Missing or placeholder value');
      allPresent = false;
    }
  }
  
  return allPresent;
}

async function testOpenAIAPI() {
  log('\n🤖 Testing OpenAI API...', 'yellow');
  
  const testCases = [
    {
      url: 'http://localhost:3000/api/ai/suggestions',
      method: 'POST',
      body: {
        from: 'Vancouver',
        destination: 'Paris',
        budget: 3000,
        duration: 5,
        travelers: 2,
        interests: ['culture', 'food']
      },
      description: 'AI Trip Suggestions'
    },
    {
      url: 'http://localhost:3000/api/ai/trip-details',
      method: 'POST',
      body: {
        destination: 'Paris',
        duration: 5,
        budget: 3000,
        interests: ['culture', 'food']
      },
      description: 'AI Trip Details'
    },
    {
      url: 'http://localhost:3000/api/ai/itinerary-builder',
      method: 'POST',
      body: {
        destination: 'Paris',
        startDate: '2024-12-01',
        endDate: '2024-12-05',
        budget: 3000,
        interests: ['culture', 'food']
      },
      description: 'AI Itinerary Builder'
    }
  ];
  
  for (const test of testCases) {
    await testAPI(test.url, test.method, test.body, test.description);
  }
}

async function testAmadeusAPI() {
  log('\n✈️ Testing Amadeus API...', 'yellow');
  
  // Test flight search
  const flightTest = {
    url: 'http://localhost:3000/api/amadeus/flights',
    method: 'POST',
    body: {
      originLocationCode: 'YVR',
      destinationLocationCode: 'CDG',
      departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
      adults: 2
    },
    description: 'Amadeus Flight Search'
  };
  
  await testAPI(flightTest.url, flightTest.method, flightTest.body, flightTest.description);
  
  // Test hotel search
  const hotelTest = {
    url: 'http://localhost:3000/api/amadeus/hotels',
    method: 'POST',
    body: {
      destination: 'Paris',
      checkin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      checkout: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      adults: 2
    },
    description: 'Amadeus Hotel Search'
  };
  
  await testAPI(hotelTest.url, hotelTest.method, hotelTest.body, hotelTest.description);
  
  // Test airport search
  const airportTest = {
    url: 'http://localhost:3000/api/airports/search?q=Paris',
    method: 'GET',
    description: 'Airport Autocomplete'
  };
  
  await testAPI(airportTest.url, airportTest.method, null, airportTest.description);
}

async function testBookingFlow() {
  log('\n💳 Testing Booking Flow...', 'yellow');
  
  // Test checkout session creation
  const checkoutTest = {
    url: 'http://localhost:3000/api/payments/create-checkout-session',
    method: 'POST',
    body: {
      type: 'flight',
      amount: 1200,
      items: [{
        type: 'flight',
        name: 'Test Flight',
        price: 1200,
        details: {}
      }]
    },
    description: 'Stripe Checkout Session'
  };
  
  await testAPI(checkoutTest.url, checkoutTest.method, checkoutTest.body, checkoutTest.description);
  
  // Test flight price confirmation
  const priceTest = {
    url: 'http://localhost:3000/api/flights/price',
    method: 'POST',
    body: {
      offer: {
        id: 'test-offer-123',
        price: { total: '1200.00' }
      }
    },
    description: 'Flight Price Confirmation'
  };
  
  await testAPI(priceTest.url, priceTest.method, priceTest.body, priceTest.description);
}

async function testUtilityAPIs() {
  log('\n🔧 Testing Utility APIs...', 'yellow');
  
  // Test currency conversion
  const currencyTest = {
    url: 'http://localhost:3000/api/utils/currency?from=USD&to=EUR&amount=1000',
    method: 'GET',
    description: 'Currency Conversion'
  };
  
  await testAPI(currencyTest.url, currencyTest.method, null, currencyTest.description);
}

async function testTripManagement() {
  log('\n🎯 Testing Trip Management...', 'yellow');
  
  // Test saved trips
  const savedTripsTest = {
    url: 'http://localhost:3000/api/trips/saved',
    method: 'GET',
    description: 'Saved Trips Retrieval'
  };
  
  await testAPI(savedTripsTest.url, savedTripsTest.method, null, savedTripsTest.description);
  
  // Test trip saving
  const saveTest = {
    url: 'http://localhost:3000/api/trips/saved',
    method: 'POST',
    body: {
      destination: 'Test Destination',
      dates: {
        startDate: '2024-12-01',
        endDate: '2024-12-05'
      },
      budget: 3000,
      travelers: 2
    },
    description: 'Trip Saving'
  };
  
  await testAPI(saveTest.url, saveTest.method, saveTest.body, saveTest.description);
}

async function generateTestReport() {
  log('\n📊 Test Results Summary', 'bright');
  log('='.repeat(50), 'cyan');
  
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`⚠️  Warnings: ${testResults.warnings}`, 'yellow');
  
  const total = testResults.passed + testResults.failed + testResults.warnings;
  const successRate = total > 0 ? Math.round((testResults.passed / total) * 100) : 0;
  
  log(`\n📈 Success Rate: ${successRate}%`, successRate > 80 ? 'green' : successRate > 60 ? 'yellow' : 'red');
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings,
      successRate: successRate
    },
    tests: testResults.tests
  };
  
  fs.writeFileSync('test-report.json', JSON.stringify(reportData, null, 2));
  log('\n📄 Detailed report saved to test-report.json', 'cyan');
  
  if (testResults.failed > 0) {
    log('\n🚨 Failed Tests:', 'red');
    testResults.tests
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        log(`   • ${test.testName}: ${test.details}`, 'red');
      });
  }
  
  return successRate;
}

async function main() {
  log('🧪 Starting Comprehensive API Testing Suite', 'bright');
  log('='.repeat(50), 'cyan');
  
  try {
    // Run all test suites
    await testEnvironmentVariables();
    await testOpenAIAPI();
    await testAmadeusAPI();
    await testBookingFlow();
    await testUtilityAPIs();
    await testTripManagement();
    
    // Generate final report
    const successRate = await generateTestReport();
    
    if (successRate >= 80) {
      log('\n🎉 Overall Status: EXCELLENT - Your APIs are working well!', 'green');
    } else if (successRate >= 60) {
      log('\n⚠️  Overall Status: GOOD - Some issues need attention', 'yellow');
    } else {
      log('\n🚨 Overall Status: NEEDS WORK - Multiple critical issues found', 'red');
    }
    
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Run the test suite
(async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    log('❌ Server not running on localhost:3000', 'red');
    log('Please start your Next.js server with: npm run dev', 'yellow');
    process.exit(1);
  }
  
  await main();
})();

