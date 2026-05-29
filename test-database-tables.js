const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testDatabaseTables() {
  console.log('🗄️  Testing Database Tables...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase credentials missing');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const tables = [
    'profiles',
    'user_preferences',
    'saved_trips', 
    'budgets',
    'budget_categories',
    'expenses',
    'carts',
    'cart_items',
    'orders',
    'order_items',
    'payments',
    'trip_bookings',
    'payment_sessions',
    'booking_confirmations',
    'city_profiles',
    'addons',
    'addon_templates'
  ];
  
  let tablesFound = 0;
  let missingTables = [];
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
        missingTables.push(table);
      } else {
        console.log(`✅ Table ${table}: Exists`);
        tablesFound++;
      }
    } catch (err) {
      console.log(`❌ Table ${table}: ${err.message}`);
      missingTables.push(table);
    }
  }
  
  console.log(`\n📊 Results: ${tablesFound}/${tables.length} tables found`);
  
  if (missingTables.length > 0) {
    console.log('\n❌ Missing tables:');
    missingTables.forEach(table => console.log(`  - ${table}`));
    console.log('\n🔧 You need to run the database migrations in Supabase SQL Editor');
  } else {
    console.log('\n✅ All required tables exist!');
  }
}

testDatabaseTables();









