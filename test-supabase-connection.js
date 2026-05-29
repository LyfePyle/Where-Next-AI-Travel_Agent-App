const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase connection...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Environment variables:');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
  console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Found' : '❌ Missing');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Found' : '❌ Missing');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('\n❌ Missing required Supabase credentials');
    return;
  }

  try {
    // Test anon key connection
    console.log('\n🔑 Testing anon key connection...');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('profiles')
      .select('count')
      .limit(1);

    if (anonError) {
      console.error('❌ Anon key test failed:', anonError.message);
    } else {
      console.log('✅ Anon key connection successful');
    }

    // Test service role key connection
    console.log('\n🔑 Testing service role key connection...');
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('profiles')
      .select('count')
      .limit(1);

    if (serviceError) {
      console.error('❌ Service role key test failed:', serviceError.message);
    } else {
      console.log('✅ Service role key connection successful');
    }

    // Test if we can create a table (this will fail if RLS is blocking)
    console.log('\n🗄️  Testing database access...');
    const { data: testData, error: testError } = await supabaseService
      .from('profiles')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('⚠️  Database access test:', testError.message);
      console.log('   This might be normal if tables don\'t exist yet');
    } else {
      console.log('✅ Database access successful');
    }

    console.log('\n🎉 Supabase connection test completed!');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testSupabaseConnection();
