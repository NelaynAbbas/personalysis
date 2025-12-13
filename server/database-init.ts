import { db, pool } from './db';
import { Logger } from './utils/Logger';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

// Initialize module-specific logger
const logger = new Logger('DatabaseInit');

/**
 * Initialize the database by creating all tables defined in the schema
 * This is a safer alternative to using migrations when deploying to production
 */
export async function initializeDatabase() {
  logger.info('Starting database initialization');

  try {
    // Create tables if they don't exist
    logger.info('Creating database tables if they don\'t exist');
    
    // Check for existing tables
    const client = await pool.connect();

    try {
      const tableCheckResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);

      const existingTables = tableCheckResult.rows.map(row => row.table_name);
      logger.info(`Found ${existingTables.length} existing tables: ${existingTables.join(', ') || 'none'}`);
      
      if (existingTables.length === 0) {
        // If no tables exist, we need to run the full initialization
        logger.info('No existing tables found, running full database initialization');
        await runFullInitialization();
      } else {
        // Tables exist, check for any missing tables or columns
        logger.info('Existing tables found, checking for schema updates');
        // This would typically use a migration system, but for now we'll just
        // check if required tables exist
        const requiredTables = [
          'users', 'companies', 'business_contexts', 'surveys', 
          'survey_questions', 'survey_responses', 'survey_sharing',
          'collaboration_sessions', 'collaboration_participants',
          'collaboration_changes', 'collaboration_comments'
        ];
        
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        
        if (missingTables.length > 0) {
          logger.info(`Found ${missingTables.length} missing tables: ${missingTables.join(', ')}`);
          // Create missing tables
          await createMissingTables(missingTables);
        } else {
          logger.info('All required tables exist');
        }
      }
      
      // Check tables after initialization
      const afterTableCheckResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);

      const tablesAfter = afterTableCheckResult.rows.map(row => row.table_name);
      logger.info(`Database now has ${tablesAfter.length} tables: ${tablesAfter.join(', ')}`);
      
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Run a full database initialization, creating all tables from scratch
 */
async function runFullInitialization() {
  logger.info('Running full database initialization');
  
  // Create users table
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

  // Create companies table
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

  // Create business_contexts table
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

  // Create surveys table
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

  // Create survey_questions table
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

  // Create survey_responses table
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

  // Create survey_sharing table
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

  // Create collaboration_sessions table
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

  // Create collaboration_participants table
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

  // Create collaboration_changes table
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

  // Create collaboration_comments table
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
}

/**
 * Create missing tables as needed
 */
async function createMissingTables(missingTables: string[]) {
  // For each missing table, create it
  for (const table of missingTables) {
    switch (table) {
      case 'users':
        logger.info('Creating missing users table');
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
        break;
      
      case 'companies':
        logger.info('Creating missing companies table');
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
        break;
      
      case 'business_contexts':
        logger.info('Creating missing business_contexts table');
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
        break;

      case 'surveys':
        logger.info('Creating missing surveys table');
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
        break;

      case 'survey_questions':
        logger.info('Creating missing survey_questions table');
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
        break;

      case 'survey_responses':
        logger.info('Creating missing survey_responses table');
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
        break;

      case 'survey_sharing':
        logger.info('Creating missing survey_sharing table');
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
        break;

      case 'collaboration_sessions':
        logger.info('Creating missing collaboration_sessions table');
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
        break;

      case 'collaboration_participants':
        logger.info('Creating missing collaboration_participants table');
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
        break;

      case 'collaboration_changes':
        logger.info('Creating missing collaboration_changes table');
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
        break;

      case 'collaboration_comments':
        logger.info('Creating missing collaboration_comments table');
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
        break;
        
      default:
        logger.warn(`No creation logic for missing table: ${table}`);
    }
  }
}