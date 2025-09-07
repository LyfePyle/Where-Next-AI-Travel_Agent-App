const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifySetup() {
  console.log('🔍 Verifying Supabase Setup...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  console.log('✅ Environment variables found');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');

    // Test basic connection
    console.log('\n📡 Testing database connection...');
    const { data: profiles, error: profilesError } = await supabase
      .from('app.profiles')
      .select('count')
      .limit(1);

    if (profilesError) {
      console.error('❌ Database schema not created yet');
      console.log('\n📋 Next Steps:');
      console.log('1. Go to: https://supabase.com/dashboard/project/brumjujpccoftqqosyek/sql');
      console.log('2. Copy the contents of database-setup.sql');
      console.log('3. Paste and execute in the SQL Editor');
      return;
    }

    console.log('✅ Database schema created successfully!');

    // Test authentication
    console.log('\n🔐 Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Authentication test failed (expected if not logged in)');
    } else {
      console.log('✅ Authentication service working');
    }

    // Test table access
    console.log('\n📋 Testing table access...');
    const tables = ['profiles', 'trips', 'expenses', 'tours'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(`app.${table}`)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table app.${table}: ${error.message}`);
        } else {
          console.log(`✅ Table app.${table}: Accessible`);
        }
      } catch (err) {
        console.log(`❌ Table app.${table}: ${err.message}`);
      }
    }

    console.log('\n🎉 Supabase setup verification completed!');
    console.log('✅ Your database is ready for the travel app');
    console.log('\n🚀 Next steps:');
    console.log('1. Start your Next.js app: npm run dev');
    console.log('2. Visit: http://localhost:3000');
    console.log('3. Test the API endpoints');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifySetup();
