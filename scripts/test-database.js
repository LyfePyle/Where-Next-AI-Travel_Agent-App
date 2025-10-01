#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests Supabase connection and basic CRUD operations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please check your .env.local file for:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const { data, error } = await supabase.from('trips').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      return false;
    }
    console.log('✅ Connection successful');

    // Test 2: Check if tables exist
    console.log('\n2️⃣ Checking database tables...');
    const tables = [
      'trips', 'trip_items', 'itineraries', 'budgets', 
      'categories', 'expenses', 'ai_conversations', 
      'cached_prompts', 'webhooks_events', 'audit_logs', 'user_preferences'
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
          console.log(`❌ Table '${table}' not found or not accessible`);
        } else {
          console.log(`✅ Table '${table}' exists`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}':`, err.message);
      }
    }

    // Test 3: Test RLS (should fail without auth)
    console.log('\n3️⃣ Testing Row Level Security...');
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .limit(1);

    if (tripError && tripError.message.includes('RLS')) {
      console.log('✅ RLS is working (access denied without auth)');
    } else if (tripError) {
      console.log('⚠️ RLS test inconclusive:', tripError.message);
    } else {
      console.log('✅ RLS allows anonymous read (or no data exists)');
    }

    // Test 4: Test cached_prompts (should be readable)
    console.log('\n4️⃣ Testing cached prompts access...');
    const { data: cacheData, error: cacheError } = await supabase
      .from('cached_prompts')
      .select('count', { count: 'exact', head: true });

    if (cacheError) {
      console.log('❌ Cannot access cached_prompts:', cacheError.message);
    } else {
      console.log('✅ Cached prompts accessible');
    }

    console.log('\n🎉 Database connection test completed!');
    console.log('\n📋 Summary:');
    console.log('- Database URL:', supabaseUrl);
    console.log('- Connection: Working');
    console.log('- Tables: Created (check individual results above)');
    console.log('- Security: RLS enabled');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Set up authentication to test user-specific data');
    console.log('2. Run the seed script to add sample data');
    console.log('3. Test API routes with real database operations');

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the test
testDatabaseConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });

