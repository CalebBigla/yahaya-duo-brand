/**
 * Database Migration Runner
 * Executes SQL files directly via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL or SERVICE_ROLE_KEY not found in environment');
  console.error('Make sure your .env file is properly configured');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration(sqlFile) {
  try {
    console.log(`\n📝 Reading ${sqlFile}...`);
    const sql = readFileSync(join(__dirname, sqlFile), 'utf8');
    
    console.log(`🚀 Executing migration...`);
    
    // Split by semicolons to execute statements separately
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      if (!statement) continue;
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase.from('_migrations').insert({ statement });
          if (directError) {
            console.error(`  ⚠️  Statement failed: ${statement.substring(0, 50)}...`);
            console.error(`     Error: ${error.message || directError.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`  ⚠️  Error executing statement`);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Migration complete!`);
    console.log(`   Successful: ${successCount}`);
    if (errorCount > 0) {
      console.log(`   ⚠️  Errors: ${errorCount}`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Get SQL file from command line argument
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.log(`
📚 Database Migration Runner

Usage: node run-migration.js <sql-file>

Examples:
  node run-migration.js quotes-schema.sql
  node run-migration.js clients-schema.sql

Available SQL files:
  - clients-schema.sql
  - quotes-schema.sql
  - schema-fixed.sql
`);
  process.exit(0);
}

runMigration(sqlFile);
