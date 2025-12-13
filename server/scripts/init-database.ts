import { db, pool } from '../db';
import { Logger } from '../utils/Logger';
import * as schema from '../../shared/schema';
import { sql } from 'drizzle-orm';

// Initialize module-specific logger
const logger = new Logger('DatabaseInit');

/**
 * Initialize database schema by creating all tables
 */
async function initializeDatabaseSchema() {
  logger.info('Starting database schema initialization');
  
  try {
    // Create tables using the schema definitions
    // We'll use raw SQL for this to ensure all tables are created properly
    
    // Users table
    logger.info('Creating users table');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        company_id INTEGER,
        role TEXT,
        permissions JSONB,
        profile_image TEXT,
        last_login TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Companies table
    logger.info('Creating companies table');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        api_key TEXT NOT NULL UNIQUE,
        subscription_tier TEXT NOT NULL DEFAULT 'trial',
        license_status TEXT NOT NULL DEFAULT 'active',
        license_start_date TIMESTAMP NOT NULL DEFAULT NOW(),
        license_end_date TIMESTAMP,
        trial_ends TIMESTAMP,
        logo_url TEXT,
        website TEXT,
        industry TEXT,
        company_size TEXT,
        primary_contact TEXT,
        contact_phone TEXT,
        address TEXT,
        max_users INTEGER DEFAULT 3,
        max_surveys INTEGER DEFAULT 2,
        max_responses INTEGER DEFAULT 100,
        max_storage_gb INTEGER DEFAULT 5,
        custom_branding BOOLEAN DEFAULT FALSE,
        social_sharing BOOLEAN DEFAULT TRUE,
        crm_integration BOOLEAN DEFAULT FALSE,
        ai_insights BOOLEAN DEFAULT FALSE,
        advanced_analytics BOOLEAN DEFAULT FALSE,
        data_export BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Business contexts table
    logger.info('Creating business_contexts table');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS business_contexts (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id),
        created_by_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        industry TEXT,
        company_size TEXT,
        company_stage TEXT,
        department TEXT,
        role TEXT,
        target_market JSONB,
        product_name TEXT,
        product_description TEXT,
        product_category TEXT,
        product_features JSONB,
        value_proposition TEXT,
        unique_selling_points JSONB,
        competitors JSONB,
        market_position TEXT,
        pricing_strategy TEXT,
        decision_timeframe TEXT,
        budget TEXT,
        decision_makers JSONB,
        pain_points JSONB,
        current_solutions TEXT,
        desired_outcomes JSONB,
        ideal_customer_profile TEXT,
        customer_demographics TEXT,
        customer_psychographics TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Surveys table
    logger.info('Creating surveys table');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS surveys (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id),
        created_by_id INTEGER NOT NULL REFERENCES users(id),
        business_context_id INTEGER REFERENCES business_contexts(id),
        title TEXT NOT NULL,
        description TEXT,
        survey_type TEXT NOT NULL DEFAULT 'general',
        is_active BOOLEAN DEFAULT TRUE,
        is_public BOOLEAN DEFAULT FALSE,
        access_code TEXT,
        theme JSONB,
        settings JSONB,
        welcome_message TEXT,
        completion_message TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Survey questions table
    logger.info('Creating survey_questions table');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS survey_questions (
        id SERIAL PRIMARY KEY,
        survey_id INTEGER NOT NULL REFERENCES surveys(id),
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL,
        options JSONB,
        required BOOLEAN DEFAULT TRUE,
        order_index INTEGER NOT NULL,
        section TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Survey responses table
    logger.info('Creating survey_responses table');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS survey_responses (
        id SERIAL PRIMARY KEY,
        survey_id INTEGER NOT NULL REFERENCES surveys(id),
        company_id INTEGER NOT NULL REFERENCES companies(id),
        respondent_id TEXT,
        respondent_name TEXT,
        respondent_email TEXT,
        country TEXT,
        city TEXT,
        gender TEXT,
        age INTEGER,
        profession TEXT,
        is_complete BOOLEAN DEFAULT FALSE,
        answers JSONB,
        traits JSONB,
        recommendations JSONB,
        satisfaction_score INTEGER,
        sentiment JSONB,
        notes TEXT,
        ip_address TEXT,
        browser TEXT,
        device TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);

    // Survey sharing table
    logger.info('Creating survey_sharing table');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS survey_sharing (
        id SERIAL PRIMARY KEY,
        survey_id INTEGER NOT NULL REFERENCES surveys(id),
        company_id INTEGER NOT NULL REFERENCES companies(id),
        created_by_id INTEGER NOT NULL REFERENCES users(id),
        share_type TEXT NOT NULL,
        share_url TEXT,
        access_code TEXT,
        recipient_email TEXT,
        expiration_date TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Collaboration sessions table
    logger.info('Creating collaboration_sessions table');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS collaboration_sessions (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        company_id INTEGER NOT NULL REFERENCES companies(id),
        created_by_id INTEGER NOT NULL REFERENCES users(id),
        is_active BOOLEAN DEFAULT TRUE,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        settings JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Collaboration participants table
    logger.info('Creating collaboration_participants table');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS collaboration_participants (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES collaboration_sessions(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'online',
        cursor_position JSONB,
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_active_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Collaboration changes table
    logger.info('Creating collaboration_changes table');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS collaboration_changes (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES collaboration_sessions(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        change_type TEXT NOT NULL,
        change_data JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Collaboration comments table
    logger.info('Creating collaboration_comments table');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS collaboration_comments (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES collaboration_sessions(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        position JSONB,
        parent_id INTEGER,
        is_resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    logger.info('All tables created successfully');
    return true;
  } catch (error) {
    logger.error('Error creating database tables:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    await initializeDatabaseSchema();
    logger.info('Database initialized successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Execute the script
main();