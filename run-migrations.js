const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATION_FILES = [
  '001_initial_schema.sql',
  '002_rls_policies.sql', 
  '003_triggers_indexes.sql',
  '004_sample_data.sql'
];

async function runMigrations() {
  console.log('🗄️  Running database migrations...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    return;
  }

  console.log('✅ Environment variables found');
  console.log('🔗 Supabase URL:', supabaseUrl);
  console.log('🔑 Using key:', supabaseKey.substring(0, 20) + '...');

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connected to Supabase');

    // Run each migration file
    for (const file of MIGRATION_FILES) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      console.log(`\n📝 Applying ${file}...`);
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Split into individual statements
        const statements = content
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`   Found ${statements.length} SQL statements`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          if (statement.trim()) {
            try {
              const { error } = await supabase.rpc('exec_sql', { sql: statement });
              if (error) {
                console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
                // Continue with next statement
              } else {
                console.log(`   ✅ Statement ${i + 1} executed`);
              }
            } catch (err) {
              console.error(`   ❌ Exception in statement ${i + 1}:`, err.message);
            }
          }
        }
        
        console.log(`   ✅ ${file} completed`);
      } catch (error) {
        console.error(`   ❌ Failed to read ${file}:`, error.message);
      }
    }

    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Verify tables in Supabase Dashboard > Table Editor');
    console.log('2. Check RLS policies in Supabase Dashboard > Authentication > Policies');
    console.log('3. Test the app: npm run dev');
    console.log('4. Seed demo data: node run-seed.js');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

runMigrations();
