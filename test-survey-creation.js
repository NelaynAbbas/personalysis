// Test survey creation after fixing session issue
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Configure Neon Database to use WebSockets
neonConfig.webSocketConstructor = ws;

async function testSurveyCreation() {
  console.log('🧪 Testing survey creation functionality...');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });

  try {
    const client = await pool.connect();

    // Check current state
    console.log('📊 Current database state:');
    const usersResult = await client.query('SELECT id, username, email, company_id, is_active FROM users');
    console.log('Users:', usersResult.rows);

    const companiesResult = await client.query('SELECT id, name, email FROM companies');
    console.log('Companies:', companiesResult.rows);

    const surveysResult = await client.query('SELECT id, title, company_id, created_by_id FROM surveys');
    console.log('Existing surveys:', surveysResult.rows);

    // Test creating a new survey
    console.log('🔧 Testing survey creation...');

    const testSurveyData = {
      title: `Test Survey ${Date.now()}`,
      description: 'Test survey created after fixing session issue',
      surveyType: 'personality-profile',
      companyId: 11, // Use the company we just created
      createdById: 2, // Use the user we just created
      isActive: true,
      isPublic: false,
      allowAnonymous: true,
      requireEmail: false,
      collectDemographics: true,
      estimatedTimeMinutes: 8,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertQuery = `
      INSERT INTO surveys (
        title, description, survey_type, company_id, created_by_id, is_active,
        is_public, allow_anonymous, require_email, collect_demographics,
        estimated_time_minutes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING id, title, company_id, created_by_id
    `;

    const result = await client.query(insertQuery, [
      testSurveyData.title,
      testSurveyData.description,
      testSurveyData.surveyType,
      testSurveyData.companyId,
      testSurveyData.createdById,
      testSurveyData.isActive,
      testSurveyData.isPublic,
      testSurveyData.allowAnonymous,
      testSurveyData.requireEmail,
      testSurveyData.collectDemographics,
      testSurveyData.estimatedTimeMinutes,
      testSurveyData.createdAt,
      testSurveyData.updatedAt
    ]);

    if (result.rows.length > 0) {
      console.log('✅ Survey created successfully!');
      console.log('New survey:', result.rows[0]);

      // Verify all surveys
      const allSurveys = await client.query('SELECT id, title, company_id, created_by_id FROM surveys');
      console.log(`📊 Total surveys in database: ${allSurveys.rows.length}`);
      console.log('All surveys:', allSurveys.rows);
    } else {
      console.log('❌ Failed to create survey');
    }

    client.release();
    await pool.end();

    console.log('🎉 Survey creation test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing survey creation:', error.message);
  }
}

testSurveyCreation();
