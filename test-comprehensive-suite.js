#!/usr/bin/env node

/**
 * Comprehensive Testing Suite Runner
 * Runs all high and medium priority tests with detailed reporting
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

// Test suite configuration
const TEST_SUITES = {
  HIGH_PRIORITY: [
    {
      name: 'Performance Benchmarking',
      command: 'npx jest __tests__/performance/performance-benchmarks.test.ts --testTimeout=60000',
      description: 'Response time baselines and load testing',
      critical: true
    },
    {
      name: 'Mobile & Responsive Design',
      command: 'npx playwright test __tests__/e2e/mobile-responsive.spec.ts',
      description: 'Touch interactions and responsive layout',
      critical: true
    },
    {
      name: 'Error Handling & Network Resilience',
      command: 'npx jest __tests__/resilience/error-handling.test.ts --testTimeout=30000',
      description: 'Network failures and API timeouts',
      critical: true
    },
    {
      name: 'Security Validation',
      command: 'npx jest __tests__/security/security-validation.test.ts --testTimeout=30000',
      description: 'Input sanitization and authentication',
      critical: true
    }
  ],
  
  MEDIUM_PRIORITY: [
    {
      name: 'Cross-Browser Compatibility',
      command: 'npx playwright test __tests__/e2e/cross-browser.spec.ts',
      description: 'Compatibility across browsers',
      critical: false
    },
    {
      name: 'Accessibility & WCAG Compliance',
      command: 'npx playwright test __tests__/accessibility/accessibility.spec.ts',
      description: 'Screen readers and accessibility standards',
      critical: false
    },
    {
      name: 'SEO & Meta Tags',
      command: 'npx playwright test __tests__/seo/seo-testing.spec.ts',
      description: 'Search engine optimization',
      critical: false
    },
    {
      name: 'Analytics & Conversion Tracking',
      command: 'npx playwright test __tests__/analytics/analytics-tracking.spec.ts',
      description: 'User tracking and conversion funnels',
      critical: false
    }
  ]
}

// Test results tracking
let testResults = {
  highPriority: { passed: 0, failed: 0, total: 0 },
  mediumPriority: { passed: 0, failed: 0, total: 0 },
  suites: [],
  startTime: Date.now(),
  endTime: null,
  duration: null
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  log('\n' + '='.repeat(80), 'cyan')
  log(`  ${title}`, 'bright')
  log('='.repeat(80), 'cyan')
}

function logTest(testName, status, details = '', duration = 0) {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow'
  const durationText = duration > 0 ? ` (${Math.round(duration / 1000)}s)` : ''
  log(`[${status}] ${testName}${durationText}`, statusColor)
  if (details) {
    log(`       ${details}`, 'cyan')
  }
  
  testResults.suites.push({ testName, status, details, duration })
}

async function checkPrerequisites() {
  logSection('Checking Prerequisites')
  
  let allGood = true
  
  // Check if development server is running
  try {
    const response = await fetch('http://localhost:3000/api/status')
    if (response.ok) {
      logTest('Development Server', 'PASS', 'Running on localhost:3000')
    } else {
      logTest('Development Server', 'FAIL', 'Server not responding properly')
      allGood = false
    }
  } catch (error) {
    logTest('Development Server', 'FAIL', 'Not running - start with: npm run dev')
    allGood = false
  }
  
  // Check for required dependencies
  const requiredDeps = [
    { name: 'Jest', check: () => fs.existsSync('node_modules/.bin/jest') },
    { name: 'Playwright', check: () => fs.existsSync('node_modules/.bin/playwright') },
    { name: 'TypeScript', check: () => fs.existsSync('node_modules/.bin/tsc') }
  ]
  
  for (const dep of requiredDeps) {
    if (dep.check()) {
      logTest(dep.name, 'PASS', 'Installed')
    } else {
      logTest(dep.name, 'FAIL', 'Not installed - run: npm install')
      allGood = false
    }
  }
  
  // Check environment variables
  const envFile = path.join(__dirname, '.env.local')
  if (fs.existsSync(envFile)) {
    logTest('Environment Configuration', 'PASS', '.env.local found')
  } else {
    logTest('Environment Configuration', 'WARN', '.env.local not found - some tests may use fallbacks')
  }
  
  return allGood
}

async function runTestSuite(suite, priority) {
  const startTime = Date.now()
  
  log(`\n🧪 Running ${suite.name}...`, 'blue')
  log(`   ${suite.description}`, 'cyan')
  
  try {
    const output = execSync(suite.command, { 
      encoding: 'utf8',
      timeout: 120000, // 2 minutes max per suite
      stdio: 'pipe'
    })
    
    const duration = Date.now() - startTime
    logTest(suite.name, 'PASS', 'All tests passed', duration)
    
    if (priority === 'high') {
      testResults.highPriority.passed++
    } else {
      testResults.mediumPriority.passed++
    }
    
    return true
  } catch (error) {
    const duration = Date.now() - startTime
    const errorOutput = error.stdout || error.stderr || error.message
    
    // Extract useful error information
    const lines = errorOutput.split('\n')
    const errorSummary = lines
      .filter(line => line.includes('FAIL') || line.includes('Error') || line.includes('✕'))
      .slice(0, 3)
      .join('\n')
    
    logTest(suite.name, suite.critical ? 'FAIL' : 'WARN', errorSummary || 'Some tests failed', duration)
    
    if (priority === 'high') {
      testResults.highPriority.failed++
    } else {
      testResults.mediumPriority.failed++
    }
    
    return false
  }
}

async function runHighPriorityTests() {
  logSection('HIGH PRIORITY TESTS')
  log('These tests validate critical functionality and must pass for production readiness.\n', 'yellow')
  
  testResults.highPriority.total = TEST_SUITES.HIGH_PRIORITY.length
  
  for (const suite of TEST_SUITES.HIGH_PRIORITY) {
    await runTestSuite(suite, 'high')
  }
  
  const highSuccessRate = Math.round((testResults.highPriority.passed / testResults.highPriority.total) * 100)
  
  log(`\n📊 High Priority Results: ${testResults.highPriority.passed}/${testResults.highPriority.total} passed (${highSuccessRate}%)`, 
      highSuccessRate >= 75 ? 'green' : 'red')
  
  return highSuccessRate
}

async function runMediumPriorityTests() {
  logSection('MEDIUM PRIORITY TESTS')
  log('These tests improve user experience and should pass for optimal functionality.\n', 'yellow')
  
  testResults.mediumPriority.total = TEST_SUITES.MEDIUM_PRIORITY.length
  
  for (const suite of TEST_SUITES.MEDIUM_PRIORITY) {
    await runTestSuite(suite, 'medium')
  }
  
  const mediumSuccessRate = Math.round((testResults.mediumPriority.passed / testResults.mediumPriority.total) * 100)
  
  log(`\n📊 Medium Priority Results: ${testResults.mediumPriority.passed}/${testResults.mediumPriority.total} passed (${mediumSuccessRate}%)`, 
      mediumSuccessRate >= 60 ? 'green' : 'yellow')
  
  return mediumSuccessRate
}

function generateComprehensiveReport(highSuccess, mediumSuccess) {
  logSection('COMPREHENSIVE TEST RESULTS')
  
  testResults.endTime = Date.now()
  testResults.duration = testResults.endTime - testResults.startTime
  
  const totalTests = testResults.highPriority.total + testResults.mediumPriority.total
  const totalPassed = testResults.highPriority.passed + testResults.mediumPriority.passed
  const overallSuccessRate = Math.round((totalPassed / totalTests) * 100)
  
  // Summary statistics
  log(`📈 OVERALL RESULTS`, 'bright')
  log(`   Total Test Suites: ${totalTests}`)
  log(`   Passed: ${totalPassed}`, 'green')
  log(`   Failed: ${totalTests - totalPassed}`, totalPassed === totalTests ? 'green' : 'red')
  log(`   Success Rate: ${overallSuccessRate}%`, overallSuccessRate >= 80 ? 'green' : overallSuccessRate >= 60 ? 'yellow' : 'red')
  log(`   Duration: ${Math.round(testResults.duration / 1000)}s`)
  
  // Detailed breakdown
  log(`\n📋 DETAILED BREAKDOWN`, 'bright')
  log(`   High Priority: ${testResults.highPriority.passed}/${testResults.highPriority.total} (${highSuccess}%)`, 
      highSuccess >= 75 ? 'green' : 'red')
  log(`   Medium Priority: ${testResults.mediumPriority.passed}/${testResults.mediumPriority.total} (${mediumSuccess}%)`, 
      mediumSuccess >= 60 ? 'green' : 'yellow')
  
  // Production readiness assessment
  log(`\n🚀 PRODUCTION READINESS ASSESSMENT`, 'bright')
  
  if (highSuccess >= 90 && mediumSuccess >= 75) {
    log(`   Status: EXCELLENT ✨`, 'green')
    log(`   ✅ Ready for production deployment`)
    log(`   ✅ High-quality user experience`)
    log(`   ✅ Robust error handling and security`)
  } else if (highSuccess >= 75 && mediumSuccess >= 50) {
    log(`   Status: GOOD 👍`, 'yellow')
    log(`   ✅ Core functionality working`)
    log(`   ⚠️  Some optimization opportunities`)
    log(`   ✅ Acceptable for production with monitoring`)
  } else if (highSuccess >= 50) {
    log(`   Status: NEEDS IMPROVEMENT 🔧`, 'yellow')
    log(`   ⚠️  Core functionality mostly working`)
    log(`   ❌ Multiple areas need attention`)
    log(`   ⚠️  Consider fixing issues before production`)
  } else {
    log(`   Status: NOT READY ❌`, 'red')
    log(`   ❌ Critical functionality failing`)
    log(`   ❌ High risk of production issues`)
    log(`   ❌ Fix critical issues before deploying`)
  }
  
  // Recommendations
  log(`\n💡 RECOMMENDATIONS`, 'bright')
  
  if (testResults.highPriority.failed > 0) {
    log(`   🔴 HIGH PRIORITY: Fix ${testResults.highPriority.failed} critical test suite(s)`, 'red')
    log(`      - Performance issues may impact user experience`)
    log(`      - Security vulnerabilities need immediate attention`)
    log(`      - Error handling gaps risk system stability`)
  }
  
  if (testResults.mediumPriority.failed > 0) {
    log(`   🟡 MEDIUM PRIORITY: Address ${testResults.mediumPriority.failed} optimization area(s)`, 'yellow')
    log(`      - Cross-browser compatibility improves reach`)
    log(`      - Accessibility compliance improves inclusivity`)
    log(`      - SEO optimization increases discoverability`)
    log(`      - Analytics tracking enables data-driven decisions`)
  }
  
  if (overallSuccessRate >= 80) {
    log(`   🎯 NEXT STEPS:`, 'green')
    log(`      - Set up continuous monitoring`)
    log(`      - Implement automated testing in CI/CD`)
    log(`      - Monitor performance metrics in production`)
    log(`      - Collect user feedback for further improvements`)
  }
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      totalPassed,
      overallSuccessRate,
      duration: testResults.duration,
      highPrioritySuccess: highSuccess,
      mediumPrioritySuccess: mediumSuccess
    },
    results: {
      highPriority: testResults.highPriority,
      mediumPriority: testResults.mediumPriority
    },
    suites: testResults.suites,
    environment: {
      node: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      timestamp: new Date().toISOString()
    }
  }
  
  fs.writeFileSync('test-results-comprehensive.json', JSON.stringify(reportData, null, 2))
  log(`\n💾 Detailed report saved to: test-results-comprehensive.json`, 'blue')
  
  return overallSuccessRate
}

// Main execution
async function main() {
  log('🚀 Starting Comprehensive Testing Suite', 'bright')
  log(`📅 ${new Date().toISOString()}`, 'cyan')
  log('Testing high and medium priority functionality...\n', 'cyan')
  
  try {
    // Check prerequisites
    const prereqsOk = await checkPrerequisites()
    if (!prereqsOk) {
      log('\n❌ Prerequisites check failed. Please fix issues before running tests.', 'red')
      process.exit(1)
    }
    
    // Run high priority tests
    const highSuccess = await runHighPriorityTests()
    
    // Run medium priority tests (always run for complete picture)
    const mediumSuccess = await runMediumPriorityTests()
    
    // Generate comprehensive report
    const overallSuccess = generateComprehensiveReport(highSuccess, mediumSuccess)
    
    // Exit with appropriate code
    if (highSuccess >= 75 && overallSuccess >= 70) {
      log('\n🎉 Testing suite completed successfully!', 'green')
      process.exit(0)
    } else if (highSuccess >= 50) {
      log('\n⚠️  Testing completed with warnings. Review failed tests.', 'yellow')
      process.exit(0)
    } else {
      log('\n❌ Critical test failures detected. System not ready for production.', 'red')
      process.exit(1)
    }
    
  } catch (error) {
    log(`\n💥 Testing suite crashed: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n\n⚡ Testing interrupted by user', 'yellow')
  process.exit(130)
})

process.on('SIGTERM', () => {
  log('\n\n⚡ Testing terminated', 'yellow')
  process.exit(143)
})

// Run the comprehensive test suite
if (require.main === module) {
  main()
}
