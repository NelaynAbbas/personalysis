
import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function fixDatabaseSchema() {
  try {
    console.log('🔧 Starting database schema fixes...');
    
    // Add business_context_id column if it doesn't exist
    try {
      await db.execute(sql`
        ALTER TABLE surveys 
        ADD COLUMN IF NOT EXISTS business_context_id INTEGER;
      `);
      console.log('✅ Added business_context_id column to surveys table');
    } catch (error) {
      console.log('ℹ️ business_context_id column already exists or error occurred:', error);
    }
    
    // Add missing trial_ends column to companies table
    try {
      await db.execute(sql`
        ALTER TABLE companies 
        ADD COLUMN IF NOT EXISTS trial_ends TIMESTAMP;
      `);
      console.log('✅ Added trial_ends column to companies table');
    } catch (error) {
      console.log('ℹ️ trial_ends column already exists or error occurred:', error);
    }

    // Add missing license_start_date column to companies table
    try {
      await db.execute(sql`
        ALTER TABLE companies 
        ADD COLUMN IF NOT EXISTS license_start_date TIMESTAMP DEFAULT NOW();
      `);
      console.log('✅ Added license_start_date column to companies table');
    } catch (error) {
      console.log('ℹ️ license_start_date column already exists or error occurred:', error);
    }

    // Add missing license_end_date column to companies table
    try {
      await db.execute(sql`
        ALTER TABLE companies 
        ADD COLUMN IF NOT EXISTS license_end_date TIMESTAMP;
      `);
      console.log('✅ Added license_end_date column to companies table');
    } catch (error) {
      console.log('ℹ️ license_end_date column already exists or error occurred:', error);
    }

    // Add missing license_status column to companies table
    try {
      await db.execute(sql`
        ALTER TABLE companies 
        ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'active';
      `);
      console.log('✅ Added license_status column to companies table');
    } catch (error) {
      console.log('ℹ️ license_status column already exists or error occurred:', error);
    }

    // Add missing subscription_tier column to companies table
    try {
      await db.execute(sql`
        ALTER TABLE companies 
        ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'trial';
      `);
      console.log('✅ Added subscription_tier column to companies table');
    } catch (error) {
      console.log('ℹ️ subscription_tier column already exists or error occurred:', error);
    }

    // Check and fix any other missing columns
    try {
      await db.execute(sql`
        ALTER TABLE survey_responses
        ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending';
      `);
      console.log('✅ Added validation_status column to survey_responses table');
    } catch (error) {
      console.log('ℹ️ validation_status column already exists or error occurred:', error);
    }

    // Add missing notification columns for admin notifications system
    try {
      await db.execute(sql`
        ALTER TABLE notifications
        ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false NOT NULL;
      `);
      console.log('✅ Added is_global column to notifications table');
    } catch (error) {
      console.log('ℹ️ is_global column already exists or error occurred:', error);
    }

    try {
      await db.execute(sql`
        ALTER TABLE notifications
        ADD COLUMN IF NOT EXISTS category VARCHAR(50);
      `);
      console.log('✅ Added category column to notifications table');
    } catch (error) {
      console.log('ℹ️ category column already exists or error occurred:', error);
    }

    try {
      await db.execute(sql`
        ALTER TABLE notifications
        ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
      `);
      console.log('✅ Added priority column to notifications table');
    } catch (error) {
      console.log('ℹ️ priority column already exists or error occurred:', error);
    }

    try {
      await db.execute(sql`
        ALTER TABLE notifications
        ADD COLUMN IF NOT EXISTS actionable_user_id INTEGER;
      `);
      console.log('✅ Added actionable_user_id column to notifications table');
    } catch (error) {
      console.log('ℹ️ actionable_user_id column already exists or error occurred:', error);
    }

    console.log('✅ Database schema fixes completed');
  } catch (error) {
    console.error('❌ Database schema fix failed:', error);
    throw error;
  }
}

// This module is designed to be imported and called from index.ts
// The fixDatabaseSchema function is exported above and called in the main server initialization
