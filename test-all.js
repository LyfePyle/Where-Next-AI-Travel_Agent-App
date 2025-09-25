#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all testing suites and generates a complete report
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

let overallResults = {
  testSuites: [],
  totalPassed: 0,
  totalFailed: 0,
  totalWarnings: 0,
  startTime: Date.now()
};

/**
 * Run a command and capture its output
 */
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve) => {
    log(`🔄 Running: ${command} ${args.join(' ')}`, 'cyan');
    
    const startTime = Date.now();
    const process = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      const duration = Date.now() - startTime;
      resolve({
        command: `${command} ${args.join(' ')}`,
        code,
        stdout,
        stderr,
        duration,
        success: code === 0
      });
    });
    
    process.on('error', (error) => {
      const duration = Date.now() - startTime;
      resolve({
        command: `${command} ${args.join(' ')}`,
        code: -1,
        stdout,
        stderr: error.message,
        duration,
        success: false
      });
    });
  });
}

/**
 * Parse test results from output
 */
function parseTestResults(output, testType) {
  let passed = 0, failed = 0, warnings = 0;
  
  // Parse different test output formats
  if (testType === 'jest') {
    const testMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed/);
    if (testMatch) {
      failed = parseInt(testMatch[1]);
      passed = parseInt(testMatch[2]);
    }
  } else if (testType === 'api' || testType === 'performance' || testType === 'database') {
    // Parse custom test format
    const passedMatch = output.match(/✅\s+Passed:\s+(\d+)/);
    const failedMatch = output.match(/❌\s+Failed:\s+(\d+)/);
    const warningsMatch = output.match(/⚠️\s+Warnings?:\s+(\d+)/);
    
    if (passedMatch) passed = parseInt(passedMatch[1]);
    if (failedMatch) failed = parseInt(failedMatch[1]);
    if (warningsMatch) warnings = parseInt(warningsMatch[1]);
  } else if (testType === 'e2e') {
    // Parse Playwright output
    const passedMatch = output.match(/(\d+)\s+passed/);
    const failedMatch = output.match(/(\d+)\s+failed/);
    
    if (passedMatch) passed = parseInt(passedMatch[1]);
    if (failedMatch) failed = parseInt(failedMatch[1]);
  }
  
  return { passed, failed, warnings };
}

/**
 * Check if server is running
 */
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  log('🧪 Starting Comprehensive Test Suite', 'bright');
  log('='.repeat(60), 'cyan');
  
  // Check if server is running
  const serverRunning = await checkServer();
  if (!serverRunning) {
    log('⚠️  Server not running on localhost:3000', 'yellow');
    log('Some tests may fail. Start server with: npm run dev', 'yellow');
  }
  
  // Define test suites to run
  const testSuites = [
    {
      name: 'Unit Tests (Jest)',
      command: 'npm',
      args: ['test', '--', '--passWithNoTests', '--watchAll=false'],
      type: 'jest',
      critical: false
    },
    {
      name: 'API Integration Tests',
      command: 'node',
      args: ['test-comprehensive-apis.js'],
      type: 'api',
      critical: true,
      requiresServer: true
    },
    {
      name: 'Booking Flow Tests',
      command: 'node',
      args: ['test-booking-flow.js'],
      type: 'api',
      critical: true,
      requiresServer: true
    },
    {
      name: 'Performance Tests',
      command: 'node',
      args: ['test-performance.js'],
      type: 'performance',
      critical: false,
      requiresServer: true
    },
    {
      name: 'Database Tests',
      command: 'node',
      args: ['test-database.js'],
      type: 'database',
      critical: false,
      requiresServer: false
    },
    {
      name: 'OpenAI API Tests',
      command: 'node',
      args: ['test-openai-api.js'],
      type: 'api',
      critical: false,
      requiresServer: false
    }
  ];
  
  // Run each test suite
  for (const suite of testSuites) {
    log(`\n📋 Running ${suite.name}...`, 'yellow');
    
    // Skip server-dependent tests if server isn't running
    if (suite.requiresServer && !serverRunning) {
      log(`   ⏭️  Skipped - Server not running`, 'yellow');
      overallResults.testSuites.push({
        ...suite,
        result: { success: false, skipped: true, reason: 'Server not running' }
      });
      continue;
    }
    
    const result = await runCommand(suite.command, suite.args);
    const testResults = parseTestResults(result.stdout + result.stderr, suite.type);
    
    // Update overall results
    overallResults.totalPassed += testResults.passed;
    overallResults.totalFailed += testResults.failed;
    overallResults.totalWarnings += testResults.warnings;
    
    const suiteResult = {
      ...suite,
      result: {
        ...result,
        ...testResults,
        skipped: false
      }
    };
    
    overallResults.testSuites.push(suiteResult);
    
    // Display results
    if (result.success && testResults.failed === 0) {
      log(`   ✅ PASSED - ${testResults.passed} tests passed`, 'green');
    } else if (result.success && testResults.failed > 0) {
      log(`   ⚠️  PARTIAL - ${testResults.passed} passed, ${testResults.failed} failed`, 'yellow');
    } else {
      log(`   ❌ FAILED - Exit code ${result.code}`, 'red');
      if (suite.critical) {
        log(`   🚨 Critical test suite failed!`, 'red');
      }
    }
    
    if (testResults.warnings > 0) {
      log(`   ⚠️  ${testResults.warnings} warnings`, 'yellow');
    }
  }
  
  // Generate final report
  generateFinalReport();
}

/**
 * Generate comprehensive test report
 */
function generateFinalReport() {
  const duration = Date.now() - overallResults.startTime;
  
  log('\n📊 Comprehensive Test Results', 'bright');
  log('='.repeat(60), 'cyan');
  
  // Summary by test suite
  log('\n📋 Test Suite Results:', 'yellow');
  overallResults.testSuites.forEach(suite => {
    const status = suite.result.skipped ? '⏭️' : suite.result.success ? '✅' : '❌';
    const name = suite.name.padEnd(25);
    const details = suite.result.skipped 
      ? 'Skipped' 
      : `${suite.result.passed || 0}P/${suite.result.failed || 0}F/${suite.result.warnings || 0}W`;
    
    log(`   ${status} ${name} ${details}`, 
        suite.result.skipped ? 'yellow' : suite.result.success ? 'green' : 'red');
  });
  
  // Overall statistics
  log('\n📈 Overall Statistics:', 'bright');
  log(`   ✅ Total Passed: ${overallResults.totalPassed}`, 'green');
  log(`   ❌ Total Failed: ${overallResults.totalFailed}`, 'red');
  log(`   ⚠️  Total Warnings: ${overallResults.totalWarnings}`, 'yellow');
  log(`   ⏱️  Duration: ${Math.round(duration / 1000)}s`, 'cyan');
  
  // Success rate
  const total = overallResults.totalPassed + overallResults.totalFailed;
  const successRate = total > 0 ? Math.round((overallResults.totalPassed / total) * 100) : 0;
  
  log(`\n📊 Success Rate: ${successRate}%`, 
      successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
  
  // Critical systems status
  const criticalSuites = overallResults.testSuites.filter(s => s.critical);
  const criticalPassed = criticalSuites.filter(s => s.result.success && !s.result.skipped).length;
  const criticalTotal = criticalSuites.length;
  
  log(`\n🏥 Critical Systems: ${criticalPassed}/${criticalTotal} operational`, 
      criticalPassed === criticalTotal ? 'green' : 'red');
  
  // Recommendations
  log('\n💡 Recommendations:', 'cyan');
  
  if (overallResults.totalFailed === 0) {
    log('   🎉 All tests passing! Your application is in excellent shape.', 'green');
  } else {
    log('   🔧 Fix failing tests before production deployment', 'yellow');
  }
  
  if (overallResults.totalWarnings > 0) {
    log('   ⚠️  Address warnings to improve reliability', 'yellow');
  }
  
  const serverDownSuites = overallResults.testSuites.filter(s => s.result.skipped);
  if (serverDownSuites.length > 0) {
    log('   🔌 Start development server to run all tests', 'yellow');
  }
  
  // Final verdict
  if (successRate >= 90 && criticalPassed === criticalTotal) {
    log('\n🎉 EXCELLENT - Ready for production!', 'green');
  } else if (successRate >= 70 && criticalPassed === criticalTotal) {
    log('\n👍 GOOD - Minor improvements needed', 'yellow');
  } else if (criticalPassed === criticalTotal) {
    log('\n⚠️  ACCEPTABLE - Core functionality working', 'yellow');
  } else {
    log('\n🚨 CRITICAL - Major issues need attention', 'red');
  }
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    duration: duration,
    overall: {
      passed: overallResults.totalPassed,
      failed: overallResults.totalFailed,
      warnings: overallResults.totalWarnings,
      successRate: successRate
    },
    testSuites: overallResults.testSuites.map(suite => ({
      name: suite.name,
      type: suite.type,
      critical: suite.critical,
      success: suite.result.success,
      skipped: suite.result.skipped,
      passed: suite.result.passed || 0,
      failed: suite.result.failed || 0,
      warnings: suite.result.warnings || 0,
      duration: suite.result.duration
    }))
  };
  
  fs.writeFileSync('test-results-complete.json', JSON.stringify(reportData, null, 2));
  log('\n📄 Detailed report saved to test-results-complete.json', 'cyan');
}

// Run all tests
runAllTests().catch((error) => {
  log(`\n❌ Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});

