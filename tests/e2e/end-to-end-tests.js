/**
 * End-to-End Testing Suite for PersonalysisPro
 * 
 * This suite performs comprehensive end-to-end testing of the full application
 * using real user journeys and authenticated sessions.
 */

const { chromium } = require('playwright');
const assert = require('assert');

// Test configuration
const TEST_URL = process.env.TEST_URL || 'http://localhost:5000';
const TEST_ADMIN_EMAIL = 'admin@personalysispro.com';
const TEST_ADMIN_PASSWORD = 'test-admin-password'; // Using a test password for demonstration
const TEST_CLIENT_EMAIL = 'demo@personalysispro.com';
const TEST_CLIENT_PASSWORD = 'test-client-password'; // Using a test password for demonstration

/**
 * Helper function to log in a user
 */
async function loginUser(page, email, password) {
  await page.goto(`${TEST_URL}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}

/**
 * Helper function to create a test survey
 */
async function createTestSurvey(page, surveyName) {
  await page.goto(`${TEST_URL}/dashboard`);
  await page.click('text=Create Survey');
  await page.fill('input[name="surveyName"]', surveyName);
  await page.fill('textarea[name="surveyDescription"]', 'Automated test survey');
  
  // Add a sample question
  await page.click('button:has-text("Add Question")');
  await page.fill('input[name="questions[0].questionText"]', 'How would you rate this product?');
  await page.selectOption('select[name="questions[0].questionType"]', { label: 'Rating Scale' });
  
  await page.click('button:has-text("Save Survey")');
  await page.waitForSelector('text=Survey created successfully');
}

/**
 * Helper function to check if elements exist
 */
async function elementExists(page, selector) {
  return await page.$(selector) !== null;
}

describe('PersonalysisPro End-to-End Tests', () => {
  let browser;
  let adminContext;
  let clientContext;
  let adminPage;
  let clientPage;
  let testSurveyId;
  
  before(async () => {
    browser = await chromium.launch({
      headless: true, // Set to false for debugging
      slowMo: 100, // Slow down Playwright operations for visual debugging
    });
    
    // Create contexts for different user sessions
    adminContext = await browser.newContext();
    clientContext = await browser.newContext();
    
    // Create pages for each context
    adminPage = await adminContext.newPage();
    clientPage = await clientContext.newPage();
  });
  
  after(async () => {
    await browser.close();
  });
  
  describe('Authentication Tests', () => {
    it('Admin can log in successfully', async () => {
      await loginUser(adminPage, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
      const isLoggedIn = await elementExists(adminPage, 'text=Admin Dashboard');
      assert.strictEqual(isLoggedIn, true, 'Admin failed to log in');
    });
    
    it('Client can log in successfully', async () => {
      await loginUser(clientPage, TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD);
      const isLoggedIn = await elementExists(clientPage, 'text=Client Dashboard');
      assert.strictEqual(isLoggedIn, true, 'Client failed to log in');
    });
  });
  
  describe('Admin Panel Tests', () => {
    it('Admin can access user management', async () => {
      await adminPage.goto(`${TEST_URL}/admin/users`);
      const hasUserTable = await elementExists(adminPage, 'table.user-table');
      assert.strictEqual(hasUserTable, true, 'Admin cannot access user management');
    });
    
    it('Admin can access license management', async () => {
      await adminPage.goto(`${TEST_URL}/admin/licenses`);
      const hasLicenseTable = await elementExists(adminPage, 'table.license-table');
      assert.strictEqual(hasLicenseTable, true, 'Admin cannot access license management');
    });
    
    it('Admin can access system settings', async () => {
      await adminPage.goto(`${TEST_URL}/admin/settings`);
      const hasSettingsForm = await elementExists(adminPage, 'form.settings-form');
      assert.strictEqual(hasSettingsForm, true, 'Admin cannot access system settings');
    });
  });
  
  describe('Survey Creation and Management', () => {
    it('Admin can create a new survey', async () => {
      const surveyName = `Test Survey ${Date.now()}`;
      await createTestSurvey(adminPage, surveyName);
      
      // Get the survey ID for later tests
      await adminPage.goto(`${TEST_URL}/admin/surveys`);
      const surveyRow = await adminPage.$(`tr:has-text("${surveyName}")`);
      const hrefAttribute = await surveyRow.$eval('a', el => el.getAttribute('href'));
      testSurveyId = hrefAttribute.split('/').pop();
      
      assert.ok(testSurveyId, 'Failed to extract survey ID');
    });
    
    it('Admin can edit an existing survey', async () => {
      await adminPage.goto(`${TEST_URL}/admin/surveys/${testSurveyId}/edit`);
      await adminPage.fill('input[name="surveyName"]', 'Updated Survey Name');
      await adminPage.click('button:has-text("Save Changes")');
      
      await adminPage.waitForSelector('text=Survey updated successfully');
      const updatedName = await adminPage.$eval('input[name="surveyName"]', el => el.value);
      assert.strictEqual(updatedName, 'Updated Survey Name', 'Survey name was not updated');
    });
    
    it('Admin can publish a survey', async () => {
      await adminPage.goto(`${TEST_URL}/admin/surveys/${testSurveyId}/edit`);
      await adminPage.click('button:has-text("Publish Survey")');
      await adminPage.waitForSelector('text=Survey published successfully');
      
      // Verify the survey status changed to published
      const statusText = await adminPage.$eval('.survey-status', el => el.textContent);
      assert.strictEqual(statusText.includes('Published'), true, 'Survey was not published');
    });
  });
  
  describe('Client Survey Interaction', () => {
    it('Client can view available surveys', async () => {
      await clientPage.goto(`${TEST_URL}/client/surveys`);
      const surveysExist = await elementExists(clientPage, '.survey-card');
      assert.strictEqual(surveysExist, true, 'Client cannot view surveys');
    });
    
    it('Client can open and complete a survey', async () => {
      // Find our test survey
      await clientPage.goto(`${TEST_URL}/client/surveys`);
      await clientPage.click('text=Updated Survey Name');
      
      // Complete the survey
      await clientPage.waitForSelector('form.survey-form');
      await clientPage.click('input[type="radio"][value="4"]'); // Select rating 4
      await clientPage.click('button:has-text("Submit")');
      
      await clientPage.waitForSelector('text=Thank you for completing the survey');
      const thankYouExists = await elementExists(clientPage, 'text=Thank you for completing the survey');
      assert.strictEqual(thankYouExists, true, 'Survey submission failed');
    });
    
    it('Client can view survey results and analytics', async () => {
      await clientPage.goto(`${TEST_URL}/client/results`);
      const resultsExist = await elementExists(clientPage, '.results-chart');
      assert.strictEqual(resultsExist, true, 'Client cannot view survey results');
    });
  });
  
  describe('Business Intelligence Tests', () => {
    it('Client can access competitor analysis', async () => {
      await clientPage.goto(`${TEST_URL}/client/analytics/competitors`);
      const analysisExists = await elementExists(clientPage, '.competitor-chart');
      assert.strictEqual(analysisExists, true, 'Client cannot access competitor analysis');
    });
    
    it('Client can access market fit analysis', async () => {
      await clientPage.goto(`${TEST_URL}/client/analytics/market-fit`);
      const analysisExists = await elementExists(clientPage, '.market-fit-analysis');
      assert.strictEqual(analysisExists, true, 'Client cannot access market fit analysis');
    });
    
    it('Client can access customer segments', async () => {
      await clientPage.goto(`${TEST_URL}/client/analytics/segments`);
      const segmentsExist = await elementExists(clientPage, '.segment-table');
      assert.strictEqual(segmentsExist, true, 'Client cannot access customer segments');
    });
    
    it('Client can generate revenue forecasts', async () => {
      await clientPage.goto(`${TEST_URL}/client/analytics/forecasts`);
      await clientPage.click('button:has-text("Generate Forecast")');
      await clientPage.waitForSelector('.forecast-results');
      
      const forecastExists = await elementExists(clientPage, '.forecast-chart');
      assert.strictEqual(forecastExists, true, 'Client cannot generate revenue forecasts');
    });
  });
  
  describe('User Profile and Account Tests', () => {
    it('Client can update profile information', async () => {
      await clientPage.goto(`${TEST_URL}/account/profile`);
      await clientPage.fill('input[name="companyName"]', 'Updated Company Name');
      await clientPage.click('button:has-text("Save Changes")');
      
      await clientPage.waitForSelector('text=Profile updated successfully');
      const updatedName = await clientPage.$eval('input[name="companyName"]', el => el.value);
      assert.strictEqual(updatedName, 'Updated Company Name', 'Profile was not updated');
    });
    
    it('Client can manage notification preferences', async () => {
      await clientPage.goto(`${TEST_URL}/account/notifications`);
      await clientPage.click('input[name="emailNotifications"]');
      await clientPage.click('button:has-text("Save Preferences")');
      
      await clientPage.waitForSelector('text=Preferences updated successfully');
      const isChecked = await clientPage.$eval('input[name="emailNotifications"]', el => el.checked);
      assert.strictEqual(isChecked, true, 'Notification preferences were not updated');
    });
  });
  
  describe('API Integration Tests', () => {
    it('Client can generate and manage API keys', async () => {
      await clientPage.goto(`${TEST_URL}/account/api-keys`);
      await clientPage.click('button:has-text("Generate New API Key")');
      await clientPage.fill('input[name="keyName"]', 'Test API Key');
      await clientPage.click('button:has-text("Create")');
      
      await clientPage.waitForSelector('text=API key created successfully');
      const apiKeyExists = await elementExists(clientPage, '.api-key-item');
      assert.strictEqual(apiKeyExists, true, 'API key was not created');
    });
  });
  
  describe('Logout Tests', () => {
    it('Admin can log out successfully', async () => {
      await adminPage.click('.user-menu-trigger');
      await adminPage.click('button:has-text("Log Out")');
      
      await adminPage.waitForNavigation();
      const loginExists = await elementExists(adminPage, 'form.login-form');
      assert.strictEqual(loginExists, true, 'Admin failed to log out');
    });
    
    it('Client can log out successfully', async () => {
      await clientPage.click('.user-menu-trigger');
      await clientPage.click('button:has-text("Log Out")');
      
      await clientPage.waitForNavigation();
      const loginExists = await elementExists(clientPage, 'form.login-form');
      assert.strictEqual(loginExists, true, 'Client failed to log out');
    });
  });
});

// If this file is run directly
if (require.main === module) {
  console.log('Running E2E tests...');
  // You would typically use a test runner like Mocha
  console.log('Please run this file with a proper test runner.');
}