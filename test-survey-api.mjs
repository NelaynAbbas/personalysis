import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Configure Neon Database to use WebSockets
neonConfig.webSocketConstructor = ws;

async function testSurveyAPI() {
  console.log('Testing survey API endpoints...');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });

  try {
    // First, check if there are any surveys in the database
    console.log('Checking for existing surveys...');
    const surveysResult = await pool.query('SELECT id, title, description FROM surveys LIMIT 5');

    if (surveysResult.rows.length === 0) {
      console.log('❌ No surveys found in database');
      console.log('Creating a test survey...');

      // Create a test survey
      const testSurvey = {
        companyId: 1,
        createdById: 1,
        title: 'Test Survey for Edit Page',
        description: 'This is a test survey to verify the edit page functionality',
        surveyType: 'general',
        isActive: true,
        isPublic: false,
        allowAnonymous: true,
        requireEmail: false,
        collectDemographics: true,
        estimatedTimeMinutes: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertResult = await pool.query(`
        INSERT INTO surveys (
          company_id, created_by_id, title, description, survey_type,
          is_active, is_public, allow_anonymous, require_email, collect_demographics,
          estimated_time_minutes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [
        testSurvey.companyId, testSurvey.createdById, testSurvey.title,
        testSurvey.description, testSurvey.surveyType, testSurvey.isActive,
        testSurvey.isPublic, testSurvey.allowAnonymous, testSurvey.requireEmail,
        testSurvey.collectDemographics, testSurvey.estimatedTimeMinutes,
        testSurvey.createdAt, testSurvey.updatedAt
      ]);

      console.log('✅ Test survey created with ID:', insertResult.rows[0].id);
    } else {
      console.log('✅ Found existing surveys:', surveysResult.rows.length);
      surveysResult.rows.forEach(survey => {
        console.log(`  - ID ${survey.id}: ${survey.title}`);
      });
    }

    // Test the API endpoint by making a request to localhost
    console.log('Testing API endpoint...');
    const fetch = (await import('node-fetch')).default;

    try {
      // Test GET request first
      const getResponse = await fetch('http://localhost:5000/api/surveys/9');
      const getData = await getResponse.json();

      console.log('GET API Response Status:', getResponse.status);
      console.log('GET Survey Title:', getData.data?.title);
      console.log('GET Business Context:', getData.data?.businessContext);

      if (getData.status === 'success' && getData.data) {
        console.log('✅ GET API endpoint working correctly');

        // Now test PUT request to update the survey
        console.log('Testing PUT API endpoint...');
        const updateData = {
          title: 'Updated Survey Title - ' + new Date().toISOString(),
          description: 'Updated description for testing',
          businessContext: {
            productName: 'Updated Product Name',
            productDescription: 'Updated product description',
            productCategory: 'Updated Category',
            productFeatures: ['Feature 1', 'Feature 2'],
            valueProposition: 'Updated value proposition',
            competitors: [{ name: 'Updated Competitor', url: 'https://example.com' }],
            targetMarket: ['Updated Market Segment'],
            industry: 'Updated Industry',
            painPoints: ['Updated Pain Point']
          },
          surveyType: 'Professional Profile',
          estimatedTime: 15,
          isActive: true,
          allowAnonymous: false
        };

        const putResponse = await fetch('http://localhost:5000/api/surveys/9', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });

        const putData = await putResponse.json();
        console.log('PUT API Response Status:', putResponse.status);
        console.log('PUT Response:', JSON.stringify(putData, null, 2));

        if (putResponse.status === 200 && putData.status === 'success') {
          console.log('✅ PUT API endpoint working correctly');

          // Test GET again to verify the update
          console.log('Verifying update with GET request...');
          const verifyResponse = await fetch('http://localhost:5000/api/surveys/9');
          const verifyData = await verifyResponse.json();

          console.log('Updated Survey Title:', verifyData.data?.title);
          console.log('Updated Business Context:', verifyData.data?.businessContext);
          console.log('Updated Survey Type:', verifyData.data?.surveyType);
          console.log('Updated Estimated Time:', verifyData.data?.estimatedTime);
        } else {
          console.log('❌ PUT API endpoint failed');
        }
      } else {
        console.log('❌ GET API endpoint returned unexpected response');
      }
    } catch (fetchError) {
      console.log('❌ Could not connect to API endpoint:', fetchError.message);
      console.log('Make sure the server is running on port 5000');
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

testSurveyAPI();
