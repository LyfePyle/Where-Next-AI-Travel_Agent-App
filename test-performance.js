#!/usr/bin/env node

/**
 * Performance Testing Suite
 * Tests API response times, page load times, and stress testing
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Performance test results
let performanceResults = {
  apiTests: [],
  loadTests: [],
  stressTests: [],
  summary: {
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

/**
 * Measure API endpoint performance
 */
async function measureAPIPerformance(url, method = 'GET', body = null, expectedTime = 2000) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: url.replace('http://localhost:3000', ''),
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        resolve({
          url,
          method,
          statusCode: res.statusCode,
          responseTime,
          passed: responseTime <= expectedTime && res.statusCode === 200,
          expectedTime,
          data: data.length
        });
      });
    });

    req.on('error', (err) => {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      resolve({
        url,
        method,
        statusCode: 0,
        responseTime,
        passed: false,
        expectedTime,
        error: err.message
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Run concurrent requests for stress testing
 */
async function stressTest(url, method = 'GET', body = null, concurrentRequests = 10) {
  log(`\n🚀 Stress Testing: ${concurrentRequests} concurrent requests to ${url}`, 'yellow');
  
  const promises = [];
  const startTime = performance.now();
  
  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(measureAPIPerformance(url, method, body, 5000));
  }
  
  const results = await Promise.all(promises);
  const endTime = performance.now();
  const totalTime = Math.round(endTime - startTime);
  
  const successful = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const avgResponseTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  );
  
  const stressResult = {
    url,
    concurrentRequests,
    totalTime,
    successful,
    failed,
    avgResponseTime,
    throughput: Math.round((concurrentRequests / totalTime) * 1000), // requests per second
    passed: failed === 0 && avgResponseTime <= 5000
  };
  
  performanceResults.stressTests.push(stressResult);
  
  if (stressResult.passed) {
    log(`   ✅ PASS - ${successful}/${concurrentRequests} successful`, 'green');
    log(`   📊 Avg response: ${avgResponseTime}ms, Throughput: ${stressResult.throughput} req/s`, 'cyan');
    performanceResults.summary.passed++;
  } else {
    log(`   ❌ FAIL - ${failed}/${concurrentRequests} failed`, 'red');
    log(`   📊 Avg response: ${avgResponseTime}ms (too slow)`, 'red');
    performanceResults.summary.failed++;
  }
  
  return stressResult;
}

/**
 * Test individual API endpoints
 */
async function testAPIPerformance() {
  log('\n⚡ Testing API Performance...', 'yellow');
  
  const apiTests = [
    {
      name: 'Home Page',
      url: 'http://localhost:3000/',
      method: 'GET',
      expectedTime: 1000
    },
    {
      name: 'AI Suggestions API',
      url: 'http://localhost:3000/api/ai/suggestions',
      method: 'POST',
      body: {
        from: 'Vancouver',
        destination: 'Paris',
        budget: 3000,
        duration: 5,
        travelers: 2,
        interests: ['culture']
      },
      expectedTime: 3000
    },
    {
      name: 'Flight Search API',
      url: 'http://localhost:3000/api/amadeus/flights',
      method: 'POST',
      body: {
        originLocationCode: 'YVR',
        destinationLocationCode: 'CDG',
        departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        adults: 2
      },
      expectedTime: 2000
    },
    {
      name: 'Hotel Search API',
      url: 'http://localhost:3000/api/amadeus/hotels',
      method: 'POST',
      body: {
        destination: 'Paris',
        checkin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        checkout: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        adults: 2
      },
      expectedTime: 2000
    },
    {
      name: 'Airport Search API',
      url: 'http://localhost:3000/api/airports/search?q=Paris',
      method: 'GET',
      expectedTime: 500
    }
  ];
  
  for (const test of apiTests) {
    log(`\n🔍 Testing: ${test.name}`, 'cyan');
    const result = await measureAPIPerformance(test.url, test.method, test.body, test.expectedTime);
    
    performanceResults.apiTests.push({
      name: test.name,
      ...result
    });
    
    if (result.passed) {
      log(`   ✅ PASS - ${result.responseTime}ms (under ${test.expectedTime}ms)`, 'green');
      performanceResults.summary.passed++;
    } else if (result.statusCode === 200) {
      log(`   ⚠️  SLOW - ${result.responseTime}ms (expected under ${test.expectedTime}ms)`, 'yellow');
      performanceResults.summary.warnings++;
    } else {
      log(`   ❌ FAIL - ${result.statusCode || 'ERROR'} in ${result.responseTime}ms`, 'red');
      if (result.error) {
        log(`       Error: ${result.error}`, 'red');
      }
      performanceResults.summary.failed++;
    }
  }
}

/**
 * Run load testing scenarios
 */
async function runLoadTests() {
  log('\n🏋️  Running Load Tests...', 'yellow');
  
  // Test different load scenarios
  const loadScenarios = [
    {
      url: 'http://localhost:3000/',
      concurrent: 5,
      description: 'Light load on home page'
    },
    {
      url: 'http://localhost:3000/api/airports/search?q=New',
      concurrent: 10,
      description: 'Medium load on airport search'
    },
    {
      url: 'http://localhost:3000/api/ai/suggestions',
      method: 'POST',
      body: {
        from: 'Vancouver',
        destination: 'Tokyo',
        budget: 4000,
        duration: 7,
        travelers: 2,
        interests: ['culture', 'food']
      },
      concurrent: 3,
      description: 'AI API under load'
    }
  ];
  
  for (const scenario of loadScenarios) {
    log(`\n📈 ${scenario.description}`, 'cyan');
    await stressTest(scenario.url, scenario.method || 'GET', scenario.body, scenario.concurrent);
  }
}

/**
 * Test memory and resource usage patterns
 */
async function testResourceUsage() {
  log('\n💾 Testing Resource Usage Patterns...', 'yellow');
  
  // Sequential vs concurrent request patterns
  const testUrl = 'http://localhost:3000/api/airports/search?q=London';
  
  // Sequential requests
  log('\n🔄 Sequential Requests (10 requests)', 'cyan');
  const sequentialStart = performance.now();
  for (let i = 0; i < 10; i++) {
    await measureAPIPerformance(testUrl, 'GET', null, 1000);
  }
  const sequentialTime = Math.round(performance.now() - sequentialStart);
  log(`   📊 Total time: ${sequentialTime}ms`, 'cyan');
  
  // Concurrent requests
  log('\n⚡ Concurrent Requests (10 requests)', 'cyan');
  const concurrentStart = performance.now();
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(measureAPIPerformance(testUrl, 'GET', null, 1000));
  }
  await Promise.all(promises);
  const concurrentTime = Math.round(performance.now() - concurrentStart);
  log(`   📊 Total time: ${concurrentTime}ms`, 'cyan');
  
  const improvement = Math.round(((sequentialTime - concurrentTime) / sequentialTime) * 100);
  log(`   🚀 Performance improvement: ${improvement}%`, improvement > 50 ? 'green' : 'yellow');
}

/**
 * Generate performance report
 */
function generatePerformanceReport() {
  log('\n📊 Performance Test Results', 'bright');
  log('='.repeat(60), 'cyan');
  
  log(`\n📈 API Performance Tests:`, 'yellow');
  performanceResults.apiTests.forEach(test => {
    const status = test.passed ? '✅' : test.statusCode === 200 ? '⚠️' : '❌';
    log(`   ${status} ${test.name}: ${test.responseTime}ms`, 
        test.passed ? 'green' : test.statusCode === 200 ? 'yellow' : 'red');
  });
  
  log(`\n🚀 Stress Test Results:`, 'yellow');
  performanceResults.stressTests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    log(`   ${status} ${test.url}: ${test.avgResponseTime}ms avg (${test.throughput} req/s)`, 
        test.passed ? 'green' : 'red');
  });
  
  // Overall summary
  const total = performanceResults.summary.passed + 
                performanceResults.summary.failed + 
                performanceResults.summary.warnings;
  
  log(`\n📋 Summary:`, 'bright');
  log(`   ✅ Passed: ${performanceResults.summary.passed}/${total}`, 'green');
  log(`   ⚠️  Warnings: ${performanceResults.summary.warnings}/${total}`, 'yellow');
  log(`   ❌ Failed: ${performanceResults.summary.failed}/${total}`, 'red');
  
  const successRate = total > 0 ? Math.round((performanceResults.summary.passed / total) * 100) : 0;
  log(`\n📈 Performance Score: ${successRate}%`, 
      successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
  
  // Recommendations
  log(`\n💡 Recommendations:`, 'cyan');
  if (performanceResults.summary.warnings > 0) {
    log(`   • Optimize slow API endpoints`, 'yellow');
  }
  if (performanceResults.summary.failed > 0) {
    log(`   • Fix failing endpoints before production`, 'red');
  }
  if (successRate >= 80) {
    log(`   • Performance looks good! Consider caching for further optimization`, 'green');
  }
  
  return successRate;
}

/**
 * Main performance testing function
 */
async function main() {
  log('🧪 Starting Performance Testing Suite', 'bright');
  log('='.repeat(60), 'cyan');
  
  try {
    // Check if server is running
    const healthCheck = await measureAPIPerformance('http://localhost:3000/', 'GET', null, 5000);
    if (!healthCheck.passed && healthCheck.statusCode !== 200) {
      log('❌ Server not running on localhost:3000', 'red');
      log('Please start your Next.js server with: npm run dev', 'yellow');
      process.exit(1);
    }
    
    await testAPIPerformance();
    await runLoadTests();
    await testResourceUsage();
    
    const performanceScore = generatePerformanceReport();
    
    if (performanceScore >= 80) {
      log('\n🎉 Excellent Performance! Your app is optimized and ready for production.', 'green');
    } else if (performanceScore >= 60) {
      log('\n⚠️  Good Performance with room for improvement.', 'yellow');
    } else {
      log('\n🚨 Performance needs attention before production deployment.', 'red');
    }
    
  } catch (error) {
    log(`\n❌ Performance testing failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the performance tests
main().catch(console.error);

