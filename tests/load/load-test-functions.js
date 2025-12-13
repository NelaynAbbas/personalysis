/**
 * Helper functions for load testing PersonalysisPro
 */

// Client user credentials for testing (test accounts only)
const TEST_CLIENTS = [
  { email: 'demo@personalysispro.com', password: 'demo-password' },
  { email: 'test1@example.com', password: 'test1-password' },
  { email: 'test2@example.com', password: 'test2-password' },
  { email: 'test3@example.com', password: 'test3-password' },
  { email: 'test4@example.com', password: 'test4-password' }
];

// Test API keys for load testing
const TEST_API_KEYS = [
  { key: 'test-api-key-1', companyId: '1' },
  { key: 'test-api-key-2', companyId: '2' },
  { key: 'test-api-key-3', companyId: '3' }
];

// Admin password - would be securely loaded in a real environment
const ADMIN_PASSWORD = 'admin-password';

/**
 * Generates random test credentials from the test pool
 */
function generateRandomCredentials(userContext, events, done) {
  const randomClient = TEST_CLIENTS[Math.floor(Math.random() * TEST_CLIENTS.length)];
  userContext.vars.email = randomClient.email;
  userContext.vars.password = randomClient.password;
  userContext.vars.adminPassword = ADMIN_PASSWORD;
  return done();
}

/**
 * Generates API credentials for testing
 */
function generateApiCredentials(userContext, events, done) {
  const randomApi = TEST_API_KEYS[Math.floor(Math.random() * TEST_API_KEYS.length)];
  userContext.vars.apiKey = randomApi.key;
  userContext.vars.companyId = randomApi.companyId;
  return done();
}

/**
 * Generates a random survey response for testing
 */
function generateSurveyResponse(userContext, events, done) {
  const ratingValue = Math.floor(Math.random() * 5) + 1; // Random rating 1-5
  
  const response = {
    respondent: {
      email: userContext.vars.email,
      demographics: {
        age: Math.floor(Math.random() * 40) + 20, // Random age 20-60
        gender: ['male', 'female', 'non-binary'][Math.floor(Math.random() * 3)],
        location: ['New York', 'San Francisco', 'Chicago', 'Austin', 'Miami'][Math.floor(Math.random() * 5)]
      }
    },
    answers: [
      {
        questionId: '1',
        value: ratingValue
      },
      {
        questionId: '2',
        value: ['Yes', 'No', 'Maybe'][Math.floor(Math.random() * 3)]
      },
      {
        questionId: '3',
        value: Math.floor(Math.random() * 10) + 1 // Random rating 1-10
      }
    ],
    traits: [
      {
        trait: 'openness',
        score: Math.floor(Math.random() * 100)
      },
      {
        trait: 'conscientiousness',
        score: Math.floor(Math.random() * 100)
      },
      {
        trait: 'extraversion',
        score: Math.floor(Math.random() * 100)
      },
      {
        trait: 'agreeableness',
        score: Math.floor(Math.random() * 100)
      },
      {
        trait: 'neuroticism',
        score: Math.floor(Math.random() * 100)
      }
    ]
  };
  
  userContext.vars.surveyResponse = response;
  return done();
}

/**
 * Generates a new test survey for load testing
 */
function generateNewSurvey(userContext, events, done) {
  const timestamp = new Date().getTime();
  
  const survey = {
    title: `Load Test Survey ${timestamp}`,
    description: 'Automatically generated survey for load testing',
    questions: [
      {
        questionText: 'How satisfied are you with our product?',
        questionType: 'rating',
        required: true,
        options: {
          min: 1,
          max: 5,
          minLabel: 'Very Dissatisfied',
          maxLabel: 'Very Satisfied'
        }
      },
      {
        questionText: 'Would you recommend our product to others?',
        questionType: 'choice',
        required: true,
        options: {
          choices: ['Yes', 'No', 'Maybe']
        }
      },
      {
        questionText: 'How likely are you to purchase again?',
        questionType: 'rating',
        required: false,
        options: {
          min: 1,
          max: 10,
          minLabel: 'Very Unlikely',
          maxLabel: 'Very Likely'
        }
      }
    ],
    settings: {
      allowAnonymous: true,
      collectDemographics: true,
      closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  };
  
  userContext.vars.newSurvey = survey;
  return done();
}

module.exports = {
  generateRandomCredentials,
  generateApiCredentials,
  generateSurveyResponse,
  generateNewSurvey
};