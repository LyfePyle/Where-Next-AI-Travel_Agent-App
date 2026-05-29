const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

async function runSchemaInNewProject() {
  console.log('🗄️  Running database schema in your new Supabase project...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    console.error('   Run: node setup-new-supabase.js first');
    return;
  }

  console.log('✅ Environment variables found');
  console.log('🔗 Supabase URL:', supabaseUrl);
  console.log('🔑 Using key:', supabaseKey.substring(0, 20) + '...');

  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connected to Supabase');

    // Read the updated schema file
    const schemaPath = path.join(__dirname, 'DATABASE_SCHEMA.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📖 Reading updated database schema...');
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
      console.log(`\n📝 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    }

    console.log('\n🎉 Database schema setup complete!');
    console.log('📋 Next steps:');
    console.log('1. Verify tables in Supabase Dashboard > Table Editor');
    console.log('2. Check RLS policies in Supabase Dashboard > Authentication > Policies');
    console.log('3. Test the app: npm run dev');
    console.log('4. Test OpenAI: node test-openai.js');

  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    console.error('Please check your environment variables and try again');
  }
}

runSchemaInNewProject();
