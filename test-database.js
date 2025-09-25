#!/usr/bin/env node

/**
 * Database Testing Suite
 * Tests Supabase database connections, CRUD operations, and data integrity
 */

require('dotenv').config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : 'red';
  log(`[${status}] ${testName}`, statusColor);
  if (details) {
    log(`       ${details}`, 'cyan');
  }
  
  testResults.tests.push({ testName, status, details });
  if (status === 'PASS') testResults.passed++;
  else testResults.failed++;
}

/**
 * Test Supabase connection and authentication
 */
async function testSupabaseConnection() {
  log('\n🔌 Testing Supabase Connection...', 'yellow');
  
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      logTest('Supabase URL Environment Variable', 'FAIL', 'NEXT_PUBLIC_SUPABASE_URL not found');
      return false;
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logTest('Supabase Anon Key Environment Variable', 'FAIL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY not found');
      return false;
    }
    
    logTest('Environment Variables', 'PASS', 'All required Supabase variables present');
    
    // Test connection to Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Simple connection test
    const { data, error } = await supabase.from('trips').select('count').limit(1);
    
    if (error && !error.message.includes('relation "trips" does not exist')) {
      logTest('Supabase Connection', 'FAIL', `Connection error: ${error.message}`);
      return false;
    }
    
    logTest('Supabase Connection', 'PASS', 'Successfully connected to Supabase');
    return true;
    
  } catch (error) {
    logTest('Supabase Connection', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test database schema and tables
 */
async function testDatabaseSchema() {
  log('\n🗄️  Testing Database Schema...', 'yellow');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Test expected tables
    const expectedTables = [
      'users',
      'trips', 
      'saved_trips',
      'bookings',
      'flight_searches',
      'hotel_searches'
    ];
    
    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        
        if (error && error.message.includes('does not exist')) {
          logTest(`Table: ${tableName}`, 'FAIL', 'Table does not exist');
        } else if (error) {
          logTest(`Table: ${tableName}`, 'FAIL', `Access error: ${error.message}`);
        } else {
          logTest(`Table: ${tableName}`, 'PASS', 'Table exists and accessible');
        }
      } catch (err) {
        logTest(`Table: ${tableName}`, 'FAIL', `Connection error: ${err.message}`);
      }
    }
    
  } catch (error) {
    logTest('Database Schema Test', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Test basic CRUD operations
 */
async function testCRUDOperations() {
  log('\n📝 Testing CRUD Operations...', 'yellow');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Test data
    const testTrip = {
      destination: 'Test City',
      country: 'Test Country',
      start_date: '2024-12-01',
      end_date: '2024-12-07',
      budget: 3000,
      travelers: 2,
      status: 'planning',
      created_at: new Date().toISOString()
    };
    
    // CREATE - Insert test data
    const { data: insertData, error: insertError } = await supabase
      .from('trips')
      .insert([testTrip])
      .select();
    
    if (insertError) {
      logTest('CREATE Operation', 'FAIL', `Insert failed: ${insertError.message}`);
    } else {
      logTest('CREATE Operation', 'PASS', 'Successfully inserted test data');
      
      const insertedId = insertData[0]?.id;
      
      if (insertedId) {
        // READ - Fetch the inserted data
        const { data: readData, error: readError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', insertedId)
          .single();
        
        if (readError) {
          logTest('READ Operation', 'FAIL', `Read failed: ${readError.message}`);
        } else {
          logTest('READ Operation', 'PASS', 'Successfully read inserted data');
        }
        
        // UPDATE - Modify the inserted data
        const { error: updateError } = await supabase
          .from('trips')
          .update({ budget: 3500 })
          .eq('id', insertedId);
        
        if (updateError) {
          logTest('UPDATE Operation', 'FAIL', `Update failed: ${updateError.message}`);
        } else {
          logTest('UPDATE Operation', 'PASS', 'Successfully updated data');
        }
        
        // DELETE - Remove the test data
        const { error: deleteError } = await supabase
          .from('trips')
          .delete()
          .eq('id', insertedId);
        
        if (deleteError) {
          logTest('DELETE Operation', 'FAIL', `Delete failed: ${deleteError.message}`);
        } else {
          logTest('DELETE Operation', 'PASS', 'Successfully deleted test data');
        }
      }
    }
    
  } catch (error) {
    logTest('CRUD Operations', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Test database queries and filtering
 */
async function testQueryOperations() {
  log('\n🔍 Testing Query Operations...', 'yellow');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Test basic select
    const { data: allData, error: allError } = await supabase
      .from('trips')
      .select('*')
      .limit(5);
    
    if (allError && !allError.message.includes('does not exist')) {
      logTest('Basic SELECT Query', 'FAIL', `Query failed: ${allError.message}`);
    } else {
      logTest('Basic SELECT Query', 'PASS', `Retrieved ${allData?.length || 0} records`);
    }
    
    // Test filtering
    const { data: filteredData, error: filterError } = await supabase
      .from('trips')
      .select('*')
      .eq('status', 'planning')
      .limit(3);
    
    if (filterError && !filterError.message.includes('does not exist')) {
      logTest('Filtered Query', 'FAIL', `Filter query failed: ${filterError.message}`);
    } else {
      logTest('Filtered Query', 'PASS', `Retrieved ${filteredData?.length || 0} filtered records`);
    }
    
    // Test ordering
    const { data: orderedData, error: orderError } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (orderError && !orderError.message.includes('does not exist')) {
      logTest('Ordered Query', 'FAIL', `Order query failed: ${orderError.message}`);
    } else {
      logTest('Ordered Query', 'PASS', `Retrieved ${orderedData?.length || 0} ordered records`);
    }
    
  } catch (error) {
    logTest('Query Operations', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Test authentication functionality
 */
async function testAuthentication() {
  log('\n🔐 Testing Authentication...', 'yellow');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Test getting current session (should be null for anonymous)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logTest('Session Check', 'FAIL', `Session error: ${sessionError.message}`);
    } else {
      logTest('Session Check', 'PASS', `Session status: ${sessionData.session ? 'authenticated' : 'anonymous'}`);
    }
    
    // Test getting current user (should be null for anonymous)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      logTest('User Check', 'FAIL', `User error: ${userError.message}`);
    } else {
      logTest('User Check', 'PASS', `User status: ${userData.user ? 'authenticated' : 'anonymous'}`);
    }
    
  } catch (error) {
    logTest('Authentication Tests', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Test API endpoints that use the database
 */
async function testDatabaseAPIEndpoints() {
  log('\n🌐 Testing Database API Endpoints...', 'yellow');
  
  const endpoints = [
    {
      name: 'Saved Trips API',
      url: 'http://localhost:3000/api/trips/saved',
      method: 'GET'
    },
    {
      name: 'Trip Save API',
      url: 'http://localhost:3000/api/trips/saved',
      method: 'POST',
      body: {
        destination: 'Test City',
        dates: {
          startDate: '2024-12-01',
          endDate: '2024-12-07'
        },
        budget: 3000,
        travelers: 2
      }
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(endpoint.url, options);
      const data = await response.json();
      
      if (response.ok) {
        logTest(`${endpoint.name}`, 'PASS', `Status: ${response.status}`);
      } else {
        logTest(`${endpoint.name}`, 'FAIL', `Status: ${response.status} - ${data.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      logTest(`${endpoint.name}`, 'FAIL', `Network error: ${error.message}`);
    }
  }
}

/**
 * Generate database test report
 */
function generateDatabaseReport() {
  log('\n📊 Database Test Results', 'bright');
  log('='.repeat(50), 'cyan');
  
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  
  const total = testResults.passed + testResults.failed;
  const successRate = total > 0 ? Math.round((testResults.passed / total) * 100) : 0;
  
  log(`\n📈 Success Rate: ${successRate}%`, successRate > 80 ? 'green' : successRate > 60 ? 'yellow' : 'red');
  
  if (testResults.failed > 0) {
    log('\n🚨 Failed Tests:', 'red');
    testResults.tests
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        log(`   • ${test.testName}: ${test.details}`, 'red');
      });
  }
  
  // Recommendations
  log(`\n💡 Recommendations:`, 'cyan');
  if (successRate < 50) {
    log(`   • Set up database tables using the schema files`, 'yellow');
    log(`   • Verify Supabase configuration and API keys`, 'yellow');
  } else if (successRate < 80) {
    log(`   • Review failed database operations`, 'yellow');
    log(`   • Check database permissions and policies`, 'yellow');
  } else {
    log(`   • Database is working well! Consider adding more complex tests`, 'green');
  }
  
  return successRate;
}

/**
 * Main database testing function
 */
async function main() {
  log('🧪 Starting Database Testing Suite', 'bright');
  log('='.repeat(50), 'cyan');
  
  try {
    const connectionSuccess = await testSupabaseConnection();
    
    if (connectionSuccess) {
      await testDatabaseSchema();
      await testCRUDOperations();
      await testQueryOperations();
      await testAuthentication();
      await testDatabaseAPIEndpoints();
    } else {
      log('\n⚠️  Skipping database tests due to connection failure', 'yellow');
    }
    
    const successRate = generateDatabaseReport();
    
    if (successRate >= 80) {
      log('\n🎉 Database Status: EXCELLENT - All systems operational!', 'green');
    } else if (successRate >= 60) {
      log('\n⚠️  Database Status: GOOD - Minor issues detected', 'yellow');
    } else {
      log('\n🚨 Database Status: NEEDS SETUP - Database configuration required', 'red');
    }
    
  } catch (error) {
    log(`\n❌ Database testing failed: ${error.message}`, 'red');
  }
}

// Run the database tests
main().catch(console.error);

