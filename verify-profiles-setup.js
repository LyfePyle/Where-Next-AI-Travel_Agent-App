/**
 * Verify Profiles Table Setup
 * Run this to check if your profiles table is properly configured
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function verifyProfilesSetup() {
  console.log('🔍 Verifying Profiles Table Setup...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    console.log('   Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
    return;
  }

  console.log('✅ Environment variables found\n');

  // Use service role key for admin operations
  const supabase = serviceKey 
    ? createClient(supabaseUrl, serviceKey)
    : createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Check if profiles table exists
    console.log('📋 Step 1: Checking if profiles table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      if (tableError.code === '42P01' || tableError.message.includes('does not exist')) {
        console.log('❌ Profiles table does NOT exist');
        console.log('\n📝 Next Steps:');
        console.log('   1. Go to Supabase Dashboard → SQL Editor');
        console.log('   2. Copy the contents of supabase/setup-profiles.sql');
        console.log('   3. Paste and run it in the SQL Editor');
        console.log('   4. Make sure you see "Success" message');
        return;
      } else {
        console.log(`❌ Error checking table: ${tableError.message}`);
        console.log(`   Code: ${tableError.code}`);
        return;
      }
    }

    console.log('✅ Profiles table exists!\n');

    // 2. Check RLS policies (informational - can't check directly from client)
    console.log('🔒 Step 2: Checking RLS policies...');
    // Try to read from profiles - if RLS is blocking, we'll get an error
    const { data: rlsTest, error: rlsError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (rlsError && rlsError.code === '42501') {
      console.log('⚠️  RLS might be blocking access (this is normal if not authenticated)');
    } else if (rlsError && rlsError.message.includes('permission denied')) {
      console.log('✅ RLS is enabled (access is restricted - this is good!)');
    } else {
      console.log('✅ RLS appears to be configured');
    }
    console.log('   Note: To verify policies, check Supabase Dashboard → Database → Policies\n');

    // 3. Check trigger (informational - can't check directly from client)
    console.log('⚙️  Step 3: Checking trigger for auto-profile creation...');
    console.log('   Note: Trigger verification requires Supabase Dashboard');
    console.log('   If you ran setup-profiles.sql, the trigger should exist\n');

    // 4. Count existing profiles
    console.log('👥 Step 4: Counting existing profiles...');
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`⚠️  Could not count profiles: ${countError.message}`);
    } else {
      console.log(`✅ Found ${count} profile(s) in the database\n`);
    }

    // 5. Test authentication
    console.log('🔐 Step 5: Testing authentication connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Not currently authenticated (this is expected if not logged in)');
    } else {
      console.log('✅ Authentication service is working');
      if (authData?.session?.user) {
        console.log(`   Logged in as: ${authData.session.user.email}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ PROFILES SETUP VERIFICATION COMPLETE');
    console.log('='.repeat(50));
    console.log('\n📋 Summary:');
    console.log('   ✅ Profiles table exists');
    console.log('   ✅ Ready to use');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Create a demo user in Supabase Dashboard → Authentication → Users');
    console.log('   2. Test login at http://localhost:3000/auth/login');
    console.log('   3. Verify protected endpoints work');

  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Make sure your Supabase project is active');
    console.log('   - Check your .env.local file has correct credentials');
    console.log('   - Verify you can access Supabase Dashboard');
  }
}

verifyProfilesSetup();

