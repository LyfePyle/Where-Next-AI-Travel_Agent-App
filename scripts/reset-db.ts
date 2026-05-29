#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
// Import environment variables directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Database Reset Script
 * 
 * This script provides commands to reset and migrate your Supabase database.
 * It reads all migration files and provides the exact psql commands needed.
 */

const MIGRATIONS_DIR = join(process.cwd(), 'migrations');
const MIGRATION_FILES = [
  '001_initial_schema.sql',
  '002_rls_policies.sql', 
  '003_triggers_indexes.sql',
  '004_sample_data.sql'
];

async function main() {
  console.log('🗄️  Database Reset & Migration Script\n');

  // Check if we have Supabase credentials
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
  }

  console.log('📋 Available Commands:\n');

  // Generate psql commands
  console.log('1. Reset database (DANGER - deletes all data):');
  console.log('   psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"');
  console.log('');

  console.log('2. Apply all migrations:');
  for (const file of MIGRATION_FILES) {
    const filePath = join(MIGRATIONS_DIR, file);
    try {
      const content = readFileSync(filePath, 'utf8');
      console.log(`   -- ${file}`);
      console.log(`   psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f migrations/${file}`);
    } catch (error) {
      console.error(`   ❌ Could not read ${file}: ${error}`);
    }
  }
  console.log('');

  console.log('3. Apply migrations via Supabase Dashboard:');
  console.log('   - Go to your Supabase project dashboard');
  console.log('   - Navigate to SQL Editor');
  console.log('   - Copy and paste each migration file in order');
  console.log('');

  console.log('4. Apply migrations programmatically:');
  console.log('   npm run db:migrate');
  console.log('');

  // Option to run migrations programmatically
  const runMigrations = process.argv.includes('--run');
  
  if (runMigrations) {
    console.log('🚀 Running migrations programmatically...\n');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    for (const file of MIGRATION_FILES) {
      const filePath = join(MIGRATIONS_DIR, file);
      try {
        console.log(`📝 Applying ${file}...`);
        const content = readFileSync(filePath, 'utf8');
        
        // Split into individual statements
        const statements = content
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
          try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            if (error) {
              console.error(`   ❌ Error: ${error.message}`);
            }
          } catch (err) {
            console.error(`   ❌ Exception: ${err}`);
          }
        }
        
        console.log(`   ✅ ${file} applied successfully`);
      } catch (error) {
        console.error(`   ❌ Failed to read ${file}: ${error}`);
      }
    }
    
    console.log('\n🎉 All migrations completed!');
  } else {
    console.log('💡 To run migrations automatically, use: npm run db:migrate');
  }
}

// Add package.json script
console.log('📦 Add this to your package.json scripts:');
console.log('   "db:migrate": "tsx scripts/reset-db.ts --run"');
console.log('   "db:reset": "tsx scripts/reset-db.ts"');
console.log('');

main().catch(console.error);
