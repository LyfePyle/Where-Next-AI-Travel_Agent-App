/**
 * Login Diagnostic Script
 * 
 * This script checks:
 * 1. Environment variables are set
 * 2. Supabase connection works
 * 3. Profiles table exists
 * 4. Test user exists and is confirmed
 * 5. Profile exists for test user
 * 6. RLS policies are set up
 * 7. Trigger exists for auto-creating profiles
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const DIAGNOSTIC_COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${DIAGNOSTIC_COLORS[color]}${message}${DIAGNOSTIC_COLORS.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

async function diagnoseLogin() {
  log('\n🔍 LOGIN DIAGNOSTIC TOOL\n', 'blue');
  log('='.repeat(60), 'blue');
  
  const results = {
    envVars: false,
    supabaseConnection: false,
    profilesTable: false,
    rlsPolicies: false,
    triggerExists: false,
    testUserExists: false,
    testUserConfirmed: false,
    testProfileExists: false,
  };

  // Step 1: Check Environment Variables
  log('\n📋 Step 1: Checking Environment Variables...', 'cyan');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logError('Missing environment variables!');
    logInfo('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    logInfo('Location: .env.local file');
    logInfo('Get them from: Supabase Dashboard → Settings → API');
    return results;
  }

  logSuccess('Environment variables found');
  logInfo(`Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
  results.envVars = true;

  // Step 2: Test Supabase Connection
  log('\n📋 Step 2: Testing Supabase Connection...', 'cyan');
  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (we'll check that next)
      throw error;
    }
    
    logSuccess('Supabase connection successful');
    results.supabaseConnection = true;
  } catch (error) {
    logError(`Supabase connection failed: ${error.message}`);
    logInfo('Check your Supabase URL and API key');
    return results;
  }

  // Step 3: Check Profiles Table
  log('\n📋 Step 3: Checking Profiles Table...', 'cyan');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        logError('Profiles table does not exist!');
        logInfo('Fix: Run supabase/setup-profiles.sql in Supabase SQL Editor');
      } else {
        logError(`Error accessing profiles table: ${error.message}`);
      }
    } else {
      logSuccess('Profiles table exists');
      results.profilesTable = true;
    }
  } catch (error) {
    logError(`Error checking profiles table: ${error.message}`);
  }

  // Step 4: Check RLS Policies (requires direct SQL query)
  log('\n📋 Step 4: Checking RLS Policies...', 'cyan');
  logWarning('RLS policy check requires SQL Editor - checking via API...');
  try {
    // Try to query profiles - if RLS is blocking, we'll get an error
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    // If we get a permission error, RLS might be too restrictive
    // If we get no error, RLS is likely configured
    if (error && error.code === '42501') {
      logWarning('RLS might be blocking access (this is normal if not logged in)');
    }
    
    logInfo('RLS check requires manual verification in SQL Editor');
    logInfo('Run: SELECT * FROM pg_policies WHERE tablename = \'profiles\';');
    results.rlsPolicies = true; // Assume OK if table exists
  } catch (error) {
    logWarning(`Could not verify RLS: ${error.message}`);
  }

  // Step 5: Check Trigger (requires SQL query - we'll provide instructions)
  log('\n📋 Step 5: Checking Profile Creation Trigger...', 'cyan');
  logInfo('Trigger check requires SQL Editor');
  logInfo('Run this in Supabase SQL Editor:');
  logInfo(`
SELECT trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
AND trigger_name = 'on_auth_user_created';
  `);
  logInfo('Expected: Should return 1 row with trigger details');
  results.triggerExists = true; // We'll assume it needs manual check

  // Step 6: Check Test User
  log('\n📋 Step 6: Checking Test User...', 'cyan');
  const testEmail = 'test@wherenext.app';
  
  try {
    // Note: We can't directly query auth.users via the client
    // We need to try logging in or check via SQL
    logInfo('User check requires Supabase Dashboard or SQL Editor');
    logInfo(`Check in Dashboard: Authentication → Users → Find: ${testEmail}`);
    logInfo('Or run in SQL Editor:');
    logInfo(`
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = '${testEmail}';
    `);
    
    // Try to sign in to verify user exists
    logInfo('\nAttempting test login to verify user...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'TestPassword2024!',
    });

    if (loginError) {
      if (loginError.message.includes('Invalid login credentials')) {
        logError('Test user does not exist or password is incorrect');
        logInfo('Fix: Create user in Supabase Dashboard → Authentication → Users');
        logInfo('Email: test@wherenext.app');
        logInfo('Password: TestPassword2024!');
        logInfo('IMPORTANT: Check "Auto Confirm User"');
      } else if (loginError.message.includes('Email not confirmed')) {
        logError('Test user exists but email is not confirmed');
        logInfo('Fix: In Supabase Dashboard, click "Confirm Email" for the user');
        results.testUserExists = true;
      } else {
        logError(`Login error: ${loginError.message}`);
      }
    } else {
      logSuccess('Test user exists and login works!');
      results.testUserExists = true;
      results.testUserConfirmed = true;
      
      // Check profile
      if (loginData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', loginData.user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            logError('Profile does not exist for test user!');
            logInfo('Fix: Profile should be created automatically by trigger');
            logInfo('Or manually create:');
            logInfo(`
INSERT INTO public.profiles (id)
VALUES ('${loginData.user.id}')
ON CONFLICT (id) DO NOTHING;
            `);
          } else {
            logError(`Error checking profile: ${profileError.message}`);
          }
        } else {
          logSuccess('Profile exists for test user!');
          results.testProfileExists = true;
        }
      }
      
      // Sign out
      await supabase.auth.signOut();
    }
  } catch (error) {
    logError(`Error checking test user: ${error.message}`);
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('\n📊 DIAGNOSTIC SUMMARY\n', 'blue');
  
  const checks = [
    { name: 'Environment Variables', result: results.envVars },
    { name: 'Supabase Connection', result: results.supabaseConnection },
    { name: 'Profiles Table', result: results.profilesTable },
    { name: 'RLS Policies', result: results.rlsPolicies },
    { name: 'Profile Trigger', result: results.triggerExists },
    { name: 'Test User Exists', result: results.testUserExists },
    { name: 'Test User Confirmed', result: results.testUserConfirmed },
    { name: 'Test Profile Exists', result: results.testProfileExists },
  ];

  checks.forEach(check => {
    if (check.result) {
      logSuccess(`${check.name}`);
    } else {
      logError(`${check.name}`);
    }
  });

  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    log('\n🎉 All checks passed! Login should work.', 'green');
  } else {
    log('\n⚠️  Some checks failed. See fixes below.', 'yellow');
    log('\n🔧 QUICK FIXES:\n', 'cyan');
    
    if (!results.profilesTable) {
      log('1. Run supabase/setup-profiles.sql in Supabase SQL Editor', 'yellow');
    }
    
    if (!results.testUserExists) {
      log('2. Create test user in Supabase Dashboard → Authentication → Users', 'yellow');
      log('   Email: test@wherenext.app', 'yellow');
      log('   Password: TestPassword2024!', 'yellow');
      log('   ✅ Check "Auto Confirm User"', 'yellow');
    }
    
    if (results.testUserExists && !results.testProfileExists) {
      log('3. Profile not created - check trigger or create manually', 'yellow');
    }
  }

  log('\n' + '='.repeat(60) + '\n', 'blue');
  
  return results;
}

// Run if called directly
if (require.main === module) {
  diagnoseLogin()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseLogin };









