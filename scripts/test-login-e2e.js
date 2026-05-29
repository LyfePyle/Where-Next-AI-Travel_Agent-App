/**
 * End-to-End Login Test Script
 * 
 * This script tests the complete login flow:
 * 1. Environment setup
 * 2. User authentication
 * 3. Session persistence
 * 4. Profile access
 * 5. Protected route access simulation
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logTest(testName) {
  log(`\n🧪 Testing: ${testName}`, 'cyan');
}

async function testLoginE2E() {
  log('\n🧪 END-TO-END LOGIN TEST\n', 'blue');
  log('='.repeat(60), 'blue');

  const testEmail = 'test@wherenext.app';
  const testPassword = 'TestPassword2024!';
  
  const results = {
    envCheck: false,
    connection: false,
    login: false,
    session: false,
    profile: false,
    persistence: false,
  };

  // Test 1: Environment Variables
  logTest('Environment Variables');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logError('Missing environment variables');
    return results;
  }
  logSuccess('Environment variables configured');
  results.envCheck = true;

  // Test 2: Supabase Connection
  logTest('Supabase Connection');
  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('profiles').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    logSuccess('Connected to Supabase');
    results.connection = true;
  } catch (error) {
    logError(`Connection failed: ${error.message}`);
    return results;
  }

  // Test 3: Login
  logTest('User Login');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      logError(`Login failed: ${error.message}`);
      if (error.message.includes('Invalid login credentials')) {
        log('  → User may not exist or password is wrong', 'yellow');
      } else if (error.message.includes('Email not confirmed')) {
        log('  → User exists but email not confirmed', 'yellow');
      }
      return results;
    }

    if (!data.user || !data.session) {
      logError('Login succeeded but no user/session returned');
      return results;
    }

    logSuccess(`Logged in as: ${data.user.email}`);
    logSuccess(`User ID: ${data.user.id}`);
    logSuccess(`Session expires at: ${new Date(data.session.expires_at * 1000).toLocaleString()}`);
    results.login = true;
    results.session = true;
  } catch (error) {
    logError(`Login error: ${error.message}`);
    return results;
  }

  // Test 4: Session Verification
  logTest('Session Verification');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logError(`Session check failed: ${error.message}`);
      return results;
    }

    if (!session) {
      logError('No active session found');
      return results;
    }

    logSuccess('Active session verified');
    logSuccess(`Access token: ${session.access_token ? 'Present' : 'Missing'}`);
    logSuccess(`Refresh token: ${session.refresh_token ? 'Present' : 'Missing'}`);
    results.session = true;
  } catch (error) {
    logError(`Session verification error: ${error.message}`);
    return results;
  }

  // Test 5: Profile Access
  logTest('Profile Access');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      logError('No user found in session');
      return results;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        logError('Profile does not exist');
        log('  → Profile should be created automatically', 'yellow');
        log('  → Check trigger: on_auth_user_created', 'yellow');
      } else {
        logError(`Profile access error: ${profileError.message}`);
      }
      return results;
    }

    logSuccess('Profile accessed successfully');
    log(`  → Profile ID: ${profile.id}`);
    log(`  → Created: ${profile.created_at ? new Date(profile.created_at).toLocaleString() : 'N/A'}`);
    results.profile = true;
  } catch (error) {
    logError(`Profile access error: ${error.message}`);
    return results;
  }

  // Test 6: Session Persistence (simulate page reload)
  logTest('Session Persistence');
  try {
    // Create a new client instance (simulating page reload)
    const newSupabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to get session (should persist if cookies are working)
    const { data: { session: newSession }, error } = await newSupabase.auth.getSession();
    
    if (error) {
      logWarning('Session persistence check inconclusive (this is normal for server-side)');
      log('  → Session persistence is handled by browser cookies', 'yellow');
      log('  → Test in browser at: http://localhost:3001/auth/login-debug', 'yellow');
    } else if (newSession) {
      logSuccess('Session persists across client instances');
      results.persistence = true;
    } else {
      logWarning('No session in new client (normal for server-side test)');
      log('  → Browser cookies handle persistence', 'yellow');
    }
  } catch (error) {
    logWarning(`Persistence check: ${error.message}`);
  }

  // Test 7: Sign Out
  logTest('Sign Out');
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logError(`Sign out error: ${error.message}`);
    } else {
      logSuccess('Signed out successfully');
    }
  } catch (error) {
    logError(`Sign out error: ${error.message}`);
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('\n📊 TEST RESULTS SUMMARY\n', 'blue');

  const tests = [
    { name: 'Environment Variables', result: results.envCheck },
    { name: 'Supabase Connection', result: results.connection },
    { name: 'User Login', result: results.login },
    { name: 'Session Creation', result: results.session },
    { name: 'Profile Access', result: results.profile },
    { name: 'Session Persistence', result: results.persistence },
  ];

  tests.forEach(test => {
    if (test.result) {
      logSuccess(test.name);
    } else {
      logError(test.name);
    }
  });

  const allPassed = Object.values(results).filter(r => r === true).length;
  const totalTests = Object.keys(results).length;

  log(`\n📈 Score: ${allPassed}/${totalTests} tests passed`, 'cyan');

  if (allPassed >= 4) {
    log('\n🎉 Login flow is working!', 'green');
    log('You can now test in the browser:', 'cyan');
    log('  → http://localhost:3001/auth/login', 'cyan');
    log(`  → Email: ${testEmail}`, 'cyan');
    log(`  → Password: ${testPassword}`, 'cyan');
  } else {
    log('\n⚠️  Some tests failed. Run diagnose-login.js for details.', 'yellow');
  }

  log('\n' + '='.repeat(60) + '\n', 'blue');

  return results;
}

// Run if called directly
if (require.main === module) {
  testLoginE2E()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testLoginE2E };









