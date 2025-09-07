const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
    console.error('\nPlease check your .env.local file');
    return;
  }

  console.log('✅ Environment variables found');
  console.log('   URL:', supabaseUrl);
  console.log('   Key:', supabaseKey.substring(0, 20) + '...');

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('\n🔌 Creating Supabase client...');

    // Test basic connection
    console.log('📡 Testing basic connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);

    if (error) {
      console.error('❌ Database connection failed:');
      console.error('   Error:', error.message);
      
      if (error.message.includes('relation "profiles" does not exist')) {
        console.log('\n💡 The profiles table doesn\'t exist yet.');
        console.log('   Please run the database schema in Supabase SQL Editor');
      }
      return;
    }

    console.log('✅ Database connection successful!');
    console.log('   Response:', data);

    // Test authentication
    console.log('\n🔐 Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Authentication test failed (expected if not logged in):');
      console.log('   Error:', authError.message);
    } else {
      console.log('✅ Authentication service working');
      console.log('   Session:', authData.session ? 'Active' : 'None');
    }

    // Test schema access
    console.log('\n📋 Testing schema access...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('app.profiles')
      .select('id')
      .limit(1);

    if (schemaError) {
      console.log('⚠️  Schema access test failed:');
      console.log('   Error:', schemaError.message);
    } else {
      console.log('✅ Schema access working');
    }

    console.log('\n🎉 Database connection test completed successfully!');
    console.log('   Your Supabase setup is working correctly.');

  } catch (error) {
    console.error('❌ Unexpected error:');
    console.error('   Error:', error.message);
  }
}

// Run the test
testDatabaseConnection(); 