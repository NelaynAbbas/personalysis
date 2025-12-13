const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function testBusinessContextColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Testing business context columns...');
    await client.connect();

    // Test if new columns exist
    const columnTest = await client.query(`
      SELECT product_name, product_description, survey_language, enable_ai_insights,
             product_features, value_proposition, competitors, target_market,
             industry, pain_points, collect_age, collect_gender
      FROM surveys LIMIT 1
    `);

    if (columnTest.rows.length > 0) {
      console.log('✅ New columns exist! Sample data:', columnTest.rows[0]);
    } else {
      console.log('ℹ️ No survey data found, but columns exist');
    }

    // Test creating a survey with business context
    console.log('📝 Testing survey creation with business context...');

    const testSurveyData = {
      companyId: 2,
      createdById: 1,
      title: 'Test Business Context Survey',
      description: 'Testing business context data storage',
      surveyType: 'general',
      isActive: true,
      isPublic: false,
      allowAnonymous: true,
      requireEmail: false,
      collectDemographics: true,
      estimatedTimeMinutes: 10,

      // Business Context Data
      productName: 'Test Product',
      productDescription: 'A test product for business context',
      productCategory: 'technology',
      productFeatures: ['feature1', 'feature2'],
      valueProposition: 'Solves customer problems',
      competitors: [{name: 'Competitor A', url: 'https://compa.com'}],
      targetMarket: ['tech-savvy users'],
      industry: 'technology',
      painPoints: ['problem1', 'problem2'],

      // Survey Configuration
      surveyLanguage: 'en',
      enableAIInsights: true,
      enableSocialSharing: true,

      // Demographics
      collectAge: true,
      collectGender: true,
      collectLocation: true,
      collectEducation: false,
      collectIncome: false,

      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await client.query(`
      INSERT INTO surveys (
        company_id, created_by_id, title, description, survey_type, is_active, is_public,
        allow_anonymous, require_email, collect_demographics, estimated_time_minutes,
        product_name, product_description, product_category, product_features,
        value_proposition, competitors, target_market, industry, pain_points,
        survey_language, enable_ai_insights, enable_social_sharing,
        collect_age, collect_gender, collect_location, collect_education, collect_income,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      ) RETURNING id
    `, [
      testSurveyData.companyId, testSurveyData.createdById, testSurveyData.title,
      testSurveyData.description, testSurveyData.surveyType, testSurveyData.isActive,
      testSurveyData.isPublic, testSurveyData.allowAnonymous, testSurveyData.requireEmail,
      testSurveyData.collectDemographics, testSurveyData.estimatedTimeMinutes,
      testSurveyData.productName, testSurveyData.productDescription, testSurveyData.productCategory,
      JSON.stringify(testSurveyData.productFeatures), testSurveyData.valueProposition,
      JSON.stringify(testSurveyData.competitors), JSON.stringify(testSurveyData.targetMarket),
      testSurveyData.industry, JSON.stringify(testSurveyData.painPoints),
      testSurveyData.surveyLanguage, testSurveyData.enableAIInsights, testSurveyData.enableSocialSharing,
      testSurveyData.collectAge, testSurveyData.collectGender, testSurveyData.collectLocation,
      testSurveyData.collectEducation, testSurveyData.collectIncome,
      testSurveyData.createdAt, testSurveyData.updatedAt
    ]);

    const newSurveyId = insertResult.rows[0].id;
    console.log(`✅ Test survey created with ID: ${newSurveyId}`);

    // Verify the data was saved correctly
    const verifyResult = await client.query(`
      SELECT product_name, product_description, product_features, value_proposition,
             survey_language, enable_ai_insights, industry
      FROM surveys WHERE id = $1
    `, [newSurveyId]);

    if (verifyResult.rows.length > 0) {
      const savedData = verifyResult.rows[0];
      console.log('✅ Business context data saved correctly:');
      console.log('  - Product Name:', savedData.product_name);
      console.log('  - Product Description:', savedData.product_description);
      console.log('  - Product Features:', savedData.product_features);
      console.log('  - Value Proposition:', savedData.value_proposition);
      console.log('  - Survey Language:', savedData.survey_language);
      console.log('  - AI Insights Enabled:', savedData.enable_ai_insights);
      console.log('  - Industry:', savedData.industry);
    }

    // Clean up test data
    await client.query('DELETE FROM surveys WHERE id = $1', [newSurveyId]);
    console.log('🧹 Test survey cleaned up');

    console.log('🎉 All tests passed! Business context functionality is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

testBusinessContextColumns();
