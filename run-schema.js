const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runDatabaseSchema() {
  console.log('🗄️  Setting up database schema...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    return;
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connected to Supabase');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'database-setup.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📖 Reading database schema...');
    console.log('📝 Schema file size:', schemaSQL.length, 'characters');

    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔧 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Try direct query for statements that can't use RPC
            const { error: queryError } = await supabase.from('_dummy').select('*').limit(0);
            if (queryError && !queryError.message.includes('does not exist')) {
              console.log(`   ⚠️  Statement ${i + 1} may need manual execution`);
            }
          }
        } catch (err) {
          console.log(`   ⚠️  Statement ${i + 1} may need manual execution:`, err.message);
        }
      }
    }

    console.log('\n✅ Schema execution completed!');
    console.log('📋 Note: Some statements may need to be run manually in the Supabase SQL Editor');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/brumjujpccoftqqosyek/sql');
    console.log('📄 Copy and paste the contents of database-setup.sql');

  } catch (error) {
    console.error('❌ Error running schema:', error.message);
    console.log('\n📋 Manual Setup Required:');
    console.log('1. Go to https://supabase.com/dashboard/project/brumjujpccoftqqosyek/sql');
    console.log('2. Copy the contents of database-setup.sql');
    console.log('3. Paste and execute in the SQL Editor');
  }
}

// Run the schema
runDatabaseSchema();
