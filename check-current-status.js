#!/usr/bin/env node

/**
 * COMPREHENSIVE STATUS CHECK
 * Tests all APIs and features with real data
 */

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Wait for server to be ready
async function waitForServer() {
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://localhost:3000/api/status');
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

// Test individual APIs
async function testAPI(name, url, options = {}) {
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        status: 'PASS',
        responseTime,
        data: data,
        message: `${responseTime}ms`
      };
    } else {
      const errorText = await response.text();
      return {
        status: 'FAIL',
        responseTime,
        message: `HTTP ${response.status} - ${errorText.slice(0, 100)}`
      };
    }
  } catch (error) {
    return {
      status: 'ERROR',
      message: error.message
    };
  }
}

async function runComprehensiveCheck() {
  log('🚀 COMPREHENSIVE STATUS CHECK', 'bright');
  log(`📅 ${new Date().toISOString()}`, 'cyan');
  log('='.repeat(80), 'cyan');
  
  // Wait for server
  log('\n⏳ Waiting for development server...', 'yellow');
  const serverReady = await waitForServer();
  
  if (!serverReady) {
    log('❌ Development server not responding. Please run: npm run dev', 'red');
    return;
  }
  
  log('✅ Development server is ready!', 'green');
  
  // Test Configuration
  log('\n🔧 ENVIRONMENT CONFIGURATION', 'bright');
  log('-'.repeat(50), 'cyan');
  
  const envChecks = [
    { name: 'OpenAI API Key', check: () => process.env.OPENAI_API_KEY ? 'CONFIGURED' : 'MISSING' },
    { name: 'Amadeus Client ID', check: () => process.env.AMADEUS_CLIENT_ID ? 'CONFIGURED' : 'MISSING' },
    { name: 'Amadeus Client Secret', check: () => process.env.AMADEUS_CLIENT_SECRET ? 'CONFIGURED' : 'MISSING' },
    { name: 'Supabase URL', check: () => process.env.NEXT_PUBLIC_SUPABASE_URL ? 'CONFIGURED' : 'MISSING' },
    { name: 'Stripe Publishable Key', check: () => process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'CONFIGURED' : 'MISSING' },
    { name: 'Currency API Key', check: () => process.env.EXCHANGE_RATE_API_KEY ? 'CONFIGURED' : 'MISSING' },
    { name: 'Weather API Key', check: () => process.env.OPENWEATHER_API_KEY ? 'CONFIGURED' : 'MISSING' }
  ];
  
  envChecks.forEach(check => {
    const status = check.check();
    const icon = status === 'CONFIGURED' ? '✅' : '❌';
    const color = status === 'CONFIGURED' ? 'green' : 'red';
    log(`${icon} ${check.name}: ${status}`, color);
  });
  
  // Test Core APIs
  log('\n🧪 API FUNCTIONALITY TESTS', 'bright');
  log('-'.repeat(50), 'cyan');
  
  const apiTests = [
    {
      name: 'Server Health Check',
      url: 'http://localhost:3000/api/status'
    },
    {
      name: 'AI Trip Suggestions',
      url: 'http://localhost:3000/api/ai/suggestions',
      options: {
        method: 'POST',
        body: JSON.stringify({
          from: 'Vancouver',
          budget: 2000,
          vibes: ['culture'],
          adults: 2,
          kids: 0
        })
      }
    },
    {
      name: 'Currency Conversion',
      url: 'http://localhost:3000/api/utils/currency',
      options: {
        method: 'POST',
        body: JSON.stringify({
          from: 'USD',
          to: 'EUR',
          amount: 100
        })
      }
    },
    {
      name: 'Flight Search',
      url: 'http://localhost:3000/api/amadeus/flights?origin=LAX&destination=JFK&departureDate=2024-12-01&adults=1'
    },
    {
      name: 'Weather Data',
      url: 'http://localhost:3000/api/utils/weather?city=Paris&country=France'
    },
    {
      name: 'Payment Intent Creation',
      url: 'http://localhost:3000/api/payments/create-payment-intent',
      options: {
        method: 'POST',
        body: JSON.stringify({
          amount: 10000,
          currency: 'usd'
        })
      }
    },
    {
      name: 'Saved Trips',
      url: 'http://localhost:3000/api/trips/saved'
    }
  ];
  
  const results = [];
  
  for (const test of apiTests) {
    log(`\n🔍 Testing: ${test.name}...`, 'blue');
    const result = await testAPI(test.name, test.url, test.options);
    results.push({ ...test, ...result });
    
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    const color = result.status === 'PASS' ? 'green' : result.status === 'FAIL' ? 'red' : 'yellow';
    
    log(`${icon} ${test.name}: ${result.message}`, color);
    
    // Show data source for key APIs
    if (result.status === 'PASS' && result.data) {
      if (test.name === 'AI Trip Suggestions' && result.data.source) {
        log(`   📊 Data Source: ${result.data.source}`, 'cyan');
      }
      if (test.name === 'Currency Conversion' && result.data.data) {
        log(`   💱 Rate: 1 USD = ${result.data.data.rate} EUR`, 'cyan');
        if (result.data.data.isMock) {
          log(`   ⚠️  Using mock data`, 'yellow');
        }
      }
      if (test.name === 'Flight Search' && result.data.source) {
        log(`   ✈️  Data Source: ${result.data.source}`, 'cyan');
      }
    }
  }
  
  // Performance Analysis
  log('\n⚡ PERFORMANCE ANALYSIS', 'bright');
  log('-'.repeat(50), 'cyan');
  
  const performanceResults = results.filter(r => r.status === 'PASS' && r.responseTime);
  performanceResults.forEach(result => {
    let color = 'green';
    let status = 'EXCELLENT';
    
    if (result.responseTime > 5000) {
      color = 'red';
      status = 'NEEDS OPTIMIZATION';
    } else if (result.responseTime > 2000) {
      color = 'yellow';
      status = 'ACCEPTABLE';
    }
    
    log(`📊 ${result.name}: ${result.responseTime}ms (${status})`, color);
  });
  
  // Summary
  log('\n📋 OVERALL STATUS SUMMARY', 'bright');
  log('='.repeat(50), 'cyan');
  
  const passedTests = results.filter(r => r.status === 'PASS').length;
  const totalTests = results.length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  log(`✅ Tests Passed: ${passedTests}/${totalTests} (${successRate}%)`, 
      successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
  
  const avgResponseTime = Math.round(
    performanceResults.reduce((sum, r) => sum + r.responseTime, 0) / performanceResults.length
  );
  log(`⚡ Average Response Time: ${avgResponseTime}ms`, 
      avgResponseTime < 2000 ? 'green' : avgResponseTime < 5000 ? 'yellow' : 'red');
  
  // Production Readiness
  log('\n🚀 PRODUCTION READINESS ASSESSMENT', 'bright');
  log('-'.repeat(50), 'cyan');
  
  if (successRate >= 90) {
    log('🎉 EXCELLENT! Ready for production deployment', 'green');
    log('   All systems working optimally', 'green');
  } else if (successRate >= 80) {
    log('✅ GOOD! Ready for production with minor optimizations', 'yellow');
    log('   Core functionality working well', 'yellow');
  } else if (successRate >= 60) {
    log('⚠️  FAIR. Needs optimization before production', 'yellow');
    log('   Some systems need attention', 'yellow');
  } else {
    log('❌ NOT READY. Critical issues need fixing', 'red');
    log('   Major problems detected', 'red');
  }
  
  // Next Steps
  log('\n💡 RECOMMENDED NEXT STEPS', 'bright');
  log('-'.repeat(30), 'cyan');
  
  const failedTests = results.filter(r => r.status !== 'PASS');
  if (failedTests.length > 0) {
    log('🔧 Fix these issues:', 'yellow');
    failedTests.forEach(test => {
      log(`   • ${test.name}: ${test.message}`, 'yellow');
    });
  }
  
  const slowTests = results.filter(r => r.status === 'PASS' && r.responseTime > 5000);
  if (slowTests.length > 0) {
    log('⚡ Optimize performance for:', 'yellow');
    slowTests.forEach(test => {
      log(`   • ${test.name}: ${test.responseTime}ms`, 'yellow');
    });
  }
  
  if (successRate >= 80 && slowTests.length === 0) {
    log('🎯 Focus on deployment and scaling!', 'green');
    log('   Your app is production-ready!', 'green');
  }
  
  log(`\n💾 Status check completed at ${new Date().toLocaleString()}`, 'cyan');
}

// Handle promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run the check
runComprehensiveCheck().catch(console.error);
