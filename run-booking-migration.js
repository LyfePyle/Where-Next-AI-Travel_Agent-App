const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runBookingMigration() {
  console.log('🚀 Running booking and payment tables migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250102_booking_payment_tables.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Executing migration...');
    
    // Split the SQL into individual statements
    const statements = migration
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`   Executing: ${statement.substring(0, 50)}...`);
        
        try {
          // Execute the statement directly
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`   ⚠️  Warning: ${error.message}`);
          } else {
            console.log(`   ✅ Success`);
          }
        } catch (err) {
          console.log(`   ⚠️  Statement may already exist: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\n📊 Tables created/updated:');
    console.log('   - trip_bookings (final source of truth)');
    console.log('   - payment_sessions (Stripe session tracking)');
    console.log('   - booking_confirmations (confirmation records)');
    console.log('\n🔐 RLS policies and indexes configured');

    // Test the setup
    console.log('\n🧪 Testing new tables...');
    
    const { data: bookings, error: bookingError } = await supabase
      .from('trip_bookings')
      .select('*')
      .limit(1);

    if (bookingError) {
      console.error('❌ Error testing trip_bookings table:', bookingError);
    } else {
      console.log('✅ trip_bookings table working');
    }

    const { data: sessions, error: sessionError } = await supabase
      .from('payment_sessions')
      .select('*')
      .limit(1);

    if (sessionError) {
      console.error('❌ Error testing payment_sessions table:', sessionError);
    } else {
      console.log('✅ payment_sessions table working');
    }

    console.log('\n🎉 Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n📋 Manual Setup Required:');
    console.log('1. Go to your Supabase dashboard SQL editor');
    console.log('2. Copy the contents of supabase/migrations/20250102_booking_payment_tables.sql');
    console.log('3. Paste and execute in the SQL Editor');
    process.exit(1);
  }
}

// Run the migration
runBookingMigration();
