/**
 * Automated Login Fix Script
 * 
 * This script attempts to fix common login issues:
 * 1. Verifies environment variables
 * 2. Provides SQL to set up profiles table
 * 3. Creates test user (if possible via API)
 * 4. Verifies everything is set up correctly
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logStep(step, message) {
  log(`\n📋 Step ${step}: ${message}`, 'cyan');
}

async function fixLoginIssues() {
  log('\n🔧 LOGIN FIX AUTOMATION TOOL\n', 'blue');
  log('='.repeat(60), 'blue');

  // Step 1: Check Environment Variables
  logStep(1, 'Checking Environment Variables');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logError('Missing environment variables!');
    logInfo('\n📝 ACTION REQUIRED:');
    logInfo('1. Create or edit .env.local file in project root');
    logInfo('2. Add these lines:');
    logInfo(`   NEXT_PUBLIC_SUPABASE_URL=your-project-url`);
    logInfo(`   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`);
    logInfo('3. Get values from: Supabase Dashboard → Settings → API');
    return false;
  }

  logSuccess('Environment variables found');
  logInfo(`URL: ${supabaseUrl.substring(0, 40)}...`);

  // Step 2: Verify Supabase Connection
  logStep(2, 'Verifying Supabase Connection');
  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    // Test connection by trying to access a table
    const { error } = await supabase.from('profiles').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    logSuccess('Connected to Supabase');
  } catch (error) {
    logError(`Connection failed: ${error.message}`);
    logInfo('Check your Supabase URL and API key');
    return false;
  }

  // Step 3: Check Profiles Table
  logStep(3, 'Checking Profiles Table');
  const profilesSqlPath = path.join(__dirname, '..', 'supabase', 'setup-profiles.sql');
  
  if (!fs.existsSync(profilesSqlPath)) {
    logError('setup-profiles.sql not found!');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        logError('Profiles table does not exist!');
        logWarning('\n📝 ACTION REQUIRED:');
        logInfo('1. Go to: https://supabase.com/dashboard');
        logInfo('2. Select your project');
        logInfo('3. Click: SQL Editor (left sidebar)');
        logInfo('4. Click: New Query');
        logInfo(`5. Open file: ${profilesSqlPath}`);
        logInfo('6. Copy ALL contents and paste into SQL Editor');
        logInfo('7. Click: Run (or press Ctrl+Enter)');
        logInfo('8. Should see: "Success. No rows returned"');
        return false;
      } else {
        logError(`Error: ${error.message}`);
        return false;
      }
    } else {
      logSuccess('Profiles table exists');
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }

  // Step 4: Check/Verify Test User
  logStep(4, 'Checking Test User');
  const testEmail = 'test@wherenext.app';
  const testPassword = 'TestPassword2024!';

  try {
    // Try to sign in
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      if (loginError.message.includes('Invalid login credentials')) {
        logWarning('Test user does not exist');
        logWarning('\n📝 ACTION REQUIRED:');
        logInfo('1. Go to: Supabase Dashboard → Authentication → Users');
        logInfo('2. Click: Add user (or Create new user)');
        logInfo(`3. Email: ${testEmail}`);
        logInfo(`4. Password: ${testPassword}`);
        logInfo('5. ✅ IMPORTANT: Check "Auto Confirm User"');
        logInfo('6. Click: Create user');
        return false;
      } else if (loginError.message.includes('Email not confirmed')) {
        logWarning('User exists but email not confirmed');
        logWarning('\n📝 ACTION REQUIRED:');
        logInfo('1. Go to: Supabase Dashboard → Authentication → Users');
        logInfo(`2. Find user: ${testEmail}`);
        logInfo('3. Click on the user');
        logInfo('4. Click: "Confirm Email" button');
        return false;
      } else {
        logError(`Login error: ${loginError.message}`);
        return false;
      }
    } else {
      logSuccess('Test user exists and can log in!');
      
      // Check profile
      if (loginData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', loginData.user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            logWarning('Profile does not exist for user');
            logWarning('\n📝 ACTION REQUIRED:');
            logInfo('Option 1: Check trigger exists (should auto-create profiles)');
            logInfo('  Run in SQL Editor:');
            logInfo(`
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND trigger_name = 'on_auth_user_created';
            `);
            logInfo('\nOption 2: Manually create profile');
            logInfo('  Run in SQL Editor:');
            logInfo(`
INSERT INTO public.profiles (id)
VALUES ('${loginData.user.id}')
ON CONFLICT (id) DO NOTHING;
            `);
            await supabase.auth.signOut();
            return false;
          } else {
            logError(`Error checking profile: ${profileError.message}`);
            await supabase.auth.signOut();
            return false;
          }
        } else {
          logSuccess('Profile exists for test user!');
        }
      }
      
      await supabase.auth.signOut();
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }

  // Step 5: Final Verification
  logStep(5, 'Final Verification');
  logInfo('Running comprehensive check...');
  
  try {
    // Try login one more time
    const { data: finalLogin, error: finalError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (finalError) {
      logError(`Final check failed: ${finalError.message}`);
      return false;
    }

    if (finalLogin.user && finalLogin.session) {
      logSuccess('✅ Login test successful!');
      logSuccess('✅ User authenticated');
      logSuccess('✅ Session created');
      
      // Check profile
      const { data: finalProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', finalLogin.user.id)
        .single();

      if (finalProfile) {
        logSuccess('✅ Profile exists');
      }

      await supabase.auth.signOut();
      
      log('\n🎉 ALL CHECKS PASSED!', 'green');
      log('Login should now work in your application.', 'green');
      log('\n📝 Next Steps:', 'cyan');
      log('1. Go to: http://localhost:3001/auth/login', 'cyan');
      log(`2. Login with: ${testEmail} / ${testPassword}`, 'cyan');
      log('3. Should redirect to /dashboard', 'cyan');
      
      return true;
    } else {
      logError('Login succeeded but no session returned');
      return false;
    }
  } catch (error) {
    logError(`Final verification error: ${error.message}`);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  fixLoginIssues()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { fixLoginIssues };









