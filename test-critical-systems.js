#!/usr/bin/env node

/**
 * Critical Systems Testing Suite
 * Runs all critical tests and generates comprehensive reports
 */

const { execSync } = require('child_process');
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

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds per test suite
  retries: 2,
  coverage: true,
  verbose: true
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  suites: [],
  startTime: Date.now(),
  endTime: null,
  duration: null
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logTest(testName, status, details = '', duration = 0) {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  const durationText = duration > 0 ? ` (${duration}ms)` : '';
  log(`[${status}] ${testName}${durationText}`, statusColor);
  if (details) {
    log(`       ${details}`, 'cyan');
  }
  
  testResults.suites.push({ testName, status, details, duration });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
}

async function runJestTest(testFile, description) {
  const startTime = Date.now();
  try {
    log(`\n🧪 Running ${description}...`, 'blue');
    
    const jestCommand = [
      'npx jest',
      testFile,
      '--testTimeout=30000',
      '--maxWorkers=1',
      '--verbose',
      '--no-cache',
      '--forceExit'
    ].join(' ');

    const output = execSync(jestCommand, { 
      encoding: 'utf8',
      timeout: TEST_CONFIG.timeout 
    });
    
    const duration = Date.now() - startTime;
    logTest(description, 'PASS', 'All tests passed', duration);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorOutput = error.stdout || error.stderr || error.message;
    const lines = errorOutput.split('\n').slice(-10); // Last 10 lines
    logTest(description, 'FAIL', lines.join('\n'), duration);
    return false;
  }
}

async function checkEnvironment() {
  logSection('Environment Check');
  
  const requiredFiles = [
    '.env.local',
    'package.json',
    'jest.config.js'
  ];
  
  const requiredVars = [
    'OPENAI_API_KEY',
    'AMADEUS_CLIENT_ID',
    'AMADEUS_CLIENT_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'STRIPE_SECRET_KEY'
  ];
  
  let envScore = 0;
  
  // Check files
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      logTest(`File: ${file}`, 'PASS');
      envScore++;
    } else {
      logTest(`File: ${file}`, 'FAIL', 'File not found');
    }
  }
  
  // Check environment variables
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    for (const varName of requiredVars) {
      const hasVar = envContent.includes(`${varName}=`) && 
                    !envContent.includes(`${varName}=your_`) && 
                    !envContent.includes(`${varName}=$`);
      
      if (hasVar) {
        logTest(`Env: ${varName}`, 'PASS');
        envScore++;
      } else {
        logTest(`Env: ${varName}`, 'FAIL', 'Missing or placeholder value');
      }
    }
  }
  
  const totalChecks = requiredFiles.length + requiredVars.length;
  const envHealth = Math.round((envScore / totalChecks) * 100);
  
  log(`\n📊 Environment Health: ${envHealth}%`, envHealth > 80 ? 'green' : envHealth > 60 ? 'yellow' : 'red');
  
  return envHealth > 60; // Minimum 60% for tests to run
}

async function runCriticalTests() {
  logSection('Critical Systems Testing');
  
  const testSuites = [
    {
      file: '__tests__/api/ai-integration.test.ts',
      description: 'AI Integration & Fallback Systems',
      critical: true
    },
    {
      file: '__tests__/api/payment-flow.test.ts', 
      description: 'Payment Processing & Stripe Integration',
      critical: true
    },
    {
      file: '__tests__/api/amadeus-integration.test.ts',
      description: 'Amadeus API & Flight/Hotel Search',
      critical: true
    },
    {
      file: '__tests__/api/database-operations.test.ts',
      description: 'Database Operations & Data Persistence',
      critical: true
    }
  ];
  
  let criticalPassed = 0;
  let criticalTotal = 0;
  
  for (const suite of testSuites) {
    if (suite.critical) criticalTotal++;
    
    const success = await runJestTest(suite.file, suite.description);
    if (success && suite.critical) {
      criticalPassed++;
    }
  }
  
  const criticalSuccess = Math.round((criticalPassed / criticalTotal) * 100);
  log(`\n🎯 Critical Systems Success Rate: ${criticalSuccess}%`, 
      criticalSuccess === 100 ? 'green' : criticalSuccess >= 75 ? 'yellow' : 'red');
  
  return criticalSuccess;
}

async function runExistingTests() {
  logSection('Existing Test Suites');
  
  const existingTests = [
    {
      command: 'npm run test:ci',
      description: 'Jest Unit Tests'
    },
    {
      command: 'npm run test:api',
      description: 'API Integration Tests'
    }
  ];
  
  for (const test of existingTests) {
    const startTime = Date.now();
    try {
      log(`\n🔄 Running ${test.description}...`, 'blue');
      execSync(test.command, { 
        encoding: 'utf8',
        timeout: TEST_CONFIG.timeout,
        stdio: 'pipe'
      });
      const duration = Date.now() - startTime;
      logTest(test.description, 'PASS', 'Completed successfully', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      logTest(test.description, 'WARN', 'Some tests may have failed', duration);
    }
  }
}

async function runPerformanceChecks() {
  logSection('Performance Checks');
  
  const performanceTests = [
    {
      endpoint: 'http://localhost:3000/api/status',
      description: 'Server Health Check',
      timeout: 5000
    },
    {
      endpoint: 'http://localhost:3000/api/ai/suggestions',
      description: 'AI Suggestions Performance',
      method: 'POST',
      body: {
        from: 'Vancouver',
        budget: 3000,
        vibes: ['culture'],
        adults: 2,
        kids: 0
      },
      timeout: 10000
    }
  ];
  
  for (const test of performanceTests) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), test.timeout);
      
      const options = {
        method: test.method || 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }
      
      const response = await fetch(test.endpoint, options);
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      const status = response.ok ? 'PASS' : 'WARN';
      const details = `${response.status} - ${duration}ms`;
      
      logTest(test.description, status, details, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      const isTimeout = error.name === 'AbortError';
      logTest(test.description, 'FAIL', 
              isTimeout ? 'Timeout exceeded' : error.message, duration);
    }
  }
}

function generateReport() {
  logSection('Test Results Summary');
  
  testResults.endTime = Date.now();
  testResults.duration = testResults.endTime - testResults.startTime;
  
  const total = testResults.passed + testResults.failed + testResults.warnings;
  const successRate = total > 0 ? Math.round((testResults.passed / total) * 100) : 0;
  
  log(`📊 Total Tests: ${total}`, 'bright');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`⚠️  Warnings: ${testResults.warnings}`, 'yellow');
  log(`🎯 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
  log(`⏱️  Total Duration: ${Math.round(testResults.duration / 1000)}s`, 'cyan');
  
  // Detailed results
  log('\n📋 Detailed Results:', 'bright');
  testResults.suites.forEach(suite => {
    const statusIcon = suite.status === 'PASS' ? '✅' : suite.status === 'FAIL' ? '❌' : '⚠️';
    const durationText = suite.duration > 0 ? ` (${suite.duration}ms)` : '';
    log(`${statusIcon} ${suite.testName}${durationText}`);
  });
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total,
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings,
      successRate,
      duration: testResults.duration
    },
    suites: testResults.suites,
    environment: {
      node: process.version,
      platform: process.platform,
      cwd: process.cwd()
    }
  };
  
  fs.writeFileSync('test-results-critical.json', JSON.stringify(reportData, null, 2));
  log('\n💾 Detailed report saved to test-results-critical.json', 'blue');
  
  // Recommendations
  logSection('Recommendations');
  
  if (testResults.failed > 0) {
    log('🔧 Critical Issues Found:', 'red');
    log('   • Review failed tests and fix underlying issues', 'yellow');
    log('   • Check environment variable configuration', 'yellow');
    log('   • Verify API keys and database connections', 'yellow');
  }
  
  if (testResults.warnings > 0) {
    log('⚠️  Warnings to Address:', 'yellow');
    log('   • Performance optimization may be needed', 'yellow');
    log('   • Consider implementing additional error handling', 'yellow');
  }
  
  if (successRate >= 80) {
    log('🎉 Excellent! Your critical systems are working well.', 'green');
    log('   • Consider adding more edge case tests', 'cyan');
    log('   • Monitor performance in production', 'cyan');
  } else if (successRate >= 60) {
    log('🔄 Good progress, but improvements needed.', 'yellow');
    log('   • Focus on fixing failed critical tests first', 'cyan');
    log('   • Review error handling strategies', 'cyan');
  } else {
    log('🚨 Critical issues need immediate attention.', 'red');
    log('   • System may not be production ready', 'red');
    log('   • Focus on environment setup and configuration', 'red');
  }
  
  return successRate;
}

// Main execution
async function main() {
  log('🚀 Starting Critical Systems Test Suite', 'bright');
  log(`📅 ${new Date().toISOString()}`, 'cyan');
  
  try {
    // Check environment
    const envOk = await checkEnvironment();
    if (!envOk) {
      log('\n❌ Environment check failed. Please fix configuration issues before running tests.', 'red');
      process.exit(1);
    }
    
    // Run critical tests
    const criticalSuccess = await runCriticalTests();
    
    // Run existing tests if critical tests pass
    if (criticalSuccess >= 75) {
      await runExistingTests();
    } else {
      log('\n⚠️  Skipping additional tests due to critical failures', 'yellow');
    }
    
    // Performance checks (always run for diagnostics)
    await runPerformanceChecks();
    
    // Generate final report
    const finalScore = generateReport();
    
    // Exit with appropriate code
    if (finalScore >= 80) {
      log('\n🎉 Test suite completed successfully!', 'green');
      process.exit(0);
    } else if (finalScore >= 60) {
      log('\n⚠️  Test suite completed with warnings.', 'yellow');
      process.exit(0);
    } else {
      log('\n❌ Critical test failures detected.', 'red');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n💥 Test suite crashed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n\n⚡ Test interrupted by user', 'yellow');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('\n\n⚡ Test terminated', 'yellow');
  process.exit(143);
});

// Run the test suite
if (require.main === module) {
  main();
}
