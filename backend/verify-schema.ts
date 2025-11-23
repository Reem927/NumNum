/**
 * Schema Verification Script
 * This script checks if the database schema matches the expected structure
 * 
 * Run with: npx tsx verify-schema.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qqmilwmhvdhwvewwraci.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbWlsd21odmRod3Zld3dyYWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTk0OTQsImV4cCI6MjA3NzY5NTQ5NH0.rAqbr0BdG0q5iA2uGmlwPQ2hZ72MF8KhNPmjOVIE-AQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

async function checkTableSchema(tableName: string): Promise<ColumnInfo[]> {
  // Try to query the table structure by attempting a select with limit 0
  // This will fail if the table doesn't exist, but we can catch that
  const { error } = await supabase.from(tableName).select('*').limit(0);
  
  if (error) {
    console.error(`❌ Error accessing table "${tableName}":`, error.message);
    return [];
  }

  // Expected columns for each table
  const expectedColumns: Record<string, string[]> = {
    posts: ['id', 'user_id', 'type', 'content', 'restaurant_id', 'rating', 'image_urls', 'likes_count', 'comments_count', 'created_at', 'updated_at'],
    comments: ['id', 'post_id', 'user_id', 'parent_id', 'content', 'likes_count', 'created_at', 'updated_at'],
    likes: ['id', 'user_id', 'post_id', 'comment_id', 'created_at'],
  };

  // Try to select one row to see what columns are available
  const { data, error: queryError } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (queryError) {
    console.error(`❌ Error querying table "${tableName}":`, queryError.message);
    
    // Check if it's a column error
    if (queryError.message.includes('does not exist')) {
      console.log(`\n⚠️  Table "${tableName}" exists but has schema issues.`);
      console.log(`   Expected columns: ${expectedColumns[tableName]?.join(', ') || 'N/A'}`);
      console.log(`   Run the migration script: fix-all-schema.sql\n`);
    }
    return [];
  }

  if (data && data.length > 0) {
    const actualColumns = Object.keys(data[0]);
    const expected = expectedColumns[tableName] || [];
    const missing = expected.filter(col => !actualColumns.includes(col));
    const extra = actualColumns.filter(col => !expected.includes(col) && col !== 'id');

    console.log(`\n✅ Table "${tableName}" exists`);
    console.log(`   Columns found: ${actualColumns.length}`);
    
    if (missing.length > 0) {
      console.log(`   ⚠️  Missing columns: ${missing.join(', ')}`);
    }
    
    if (extra.length > 0) {
      console.log(`   ℹ️  Extra columns: ${extra.join(', ')}`);
    }

    // Check specifically for user_id
    if (!actualColumns.includes('user_id')) {
      console.log(`   ❌ CRITICAL: "user_id" column is missing!`);
      if (actualColumns.includes('userId')) {
        console.log(`   ℹ️  Found "userId" (camelCase) - needs to be renamed to "user_id"`);
      }
    } else {
      console.log(`   ✅ "user_id" column exists`);
    }
  } else {
    // Table exists but is empty
    console.log(`\n✅ Table "${tableName}" exists (empty)`);
    console.log(`   Expected columns: ${expectedColumns[tableName]?.join(', ') || 'N/A'}`);
  }

  return [];
}

async function main() {
  console.log('🔍 Verifying database schema...\n');
  console.log('=' .repeat(50));

  const tables = ['posts', 'comments', 'likes'];

  for (const table of tables) {
    await checkTableSchema(table);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n📋 Next Steps:');
  console.log('1. If any tables are missing columns, run: fix-all-schema.sql in Supabase SQL Editor');
  console.log('2. Check the SCHEMA_FIX_README.md for detailed instructions');
  console.log('3. After running the migration, run this script again to verify\n');
}

main().catch(console.error);

