import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('error_rate');
const authDuration = new Trend('auth_duration');
const surveysApiDuration = new Trend('surveys_api_duration');

export const options = {
  // Test lifecycle
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
    { duration: '20s', target: 50 }, // Ramp up to 50 users
    { duration: '1m', target: 50 },  // Stay at 50 users for 1 minute
    { duration: '15s', target: 0 },  // Ramp down to 0 users
  ],
  
  // Thresholds
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'error_rate': ['rate<0.1'],         // Error rate should be less than 10%
    'auth_duration': ['p(95)<1000'],    // 95% of auth requests should be below 1s
    'surveys_api_duration': ['p(95)<300'], // 95% of surveys API requests should be below 300ms
  },
};

// Initial context for the test
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
let GLOBAL_SESSION = {};

// Helper to generate random user data
function generateRandomUser() {
  const username = `test_${randomString(8)}`;
  return {
    username,
    email: `${username}@example.com`,
    password: `Password_${randomString(8)}`,
    firstName: 'Test',
    lastName: 'User'
  };
}

export function setup() {
  // This runs once at the beginning of the test
  // Create a test user that we'll use throughout the test
  const testUser = {
    email: __ENV.TEST_EMAIL || 'loadtest@example.com',
    password: __ENV.TEST_PASSWORD || 'TestPassword123'
  };
  
  // Try to login with the test user
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(testUser), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  // If login succeeds, return the token/cookies for use in the test
  if (loginRes.status === 200) {
    const authData = {
      token: loginRes.json('token'),
      cookies: loginRes.cookies
    };
    console.log('Login successful, using existing test user');
    return { authData, testUser };
  }

  // If login fails, try to register a new user
  console.log('Login failed, registering a new test user');
  const newUser = generateRandomUser();
  const registerRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(newUser), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  // If registration succeeds, login with the new user
  if (registerRes.status === 201) {
    const loginNewRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: newUser.email,
      password: newUser.password
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (loginNewRes.status === 200) {
      return {
        authData: {
          token: loginNewRes.json('token'),
          cookies: loginNewRes.cookies
        },
        testUser: newUser
      };
    }
  }
  
  // If all fails, return empty data and the test will run with anonymous users
  console.log('Failed to create test user, tests will run anonymously');
  return { authData: null, testUser: null };
}

export default function(data) {
  // This is the main test function that will be called for each virtual user
  
  group('Anonymous API Access', function() {
    // Check system performance endpoint
    const perfRes = http.get(`${BASE_URL}/api/system/performance`);
    check(perfRes, {
      'Performance API status is 200': (r) => r.status === 200,
      'Performance API returns data': (r) => r.json().hasOwnProperty('endpoints')
    });
    errorRate.add(perfRes.status !== 200);
    
    sleep(Math.random() * 3);
    
    // Check public surveys endpoint
    const surveysStartTime = new Date();
    const surveysRes = http.get(`${BASE_URL}/api/surveys`);
    surveysApiDuration.add((new Date() - surveysStartTime) / 1000);
    
    check(surveysRes, {
      'Surveys API status is 200': (r) => r.status === 200,
      'Surveys API returns an array': (r) => Array.isArray(r.json())
    });
    errorRate.add(surveysRes.status !== 200);
    
    sleep(Math.random() * 3);
  });
  
  // Only run authenticated tests if we have auth data
  if (data.authData) {
    group('Authenticated User Actions', function() {
      // Set up headers with auth token
      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.authData.token}`
      };
      
      // Get user profile
      const authStartTime = new Date();
      const profileRes = http.get(`${BASE_URL}/api/auth/me`, { headers: authHeaders });
      authDuration.add((new Date() - authStartTime) / 1000);
      
      check(profileRes, {
        'Profile API status is 200': (r) => r.status === 200,
        'Profile API returns user data': (r) => r.json().hasOwnProperty('email')
      });
      errorRate.add(profileRes.status !== 200);
      
      sleep(Math.random() * 2);
      
      // Create a new survey (only for some users)
      if (Math.random() < 0.3) {
        const surveyData = {
          title: `Load Test Survey ${randomString(8)}`,
          description: 'This is a survey created during load testing',
          questions: [
            {
              type: 'multiple_choice',
              text: 'How would you rate our service?',
              options: ['Excellent', 'Good', 'Average', 'Poor']
            }
          ]
        };
        
        const createSurveyRes = http.post(
          `${BASE_URL}/api/surveys`,
          JSON.stringify(surveyData),
          { headers: authHeaders }
        );
        
        check(createSurveyRes, {
          'Create Survey API status is 201': (r) => r.status === 201,
          'Create Survey API returns survey ID': (r) => r.json().hasOwnProperty('id')
        });
        errorRate.add(createSurveyRes.status !== 201);
        
        sleep(Math.random() * 5);
      }
    });
  }
  
  // All users do some error testing
  group('Error Handling', function() {
    // Test non-existent endpoint
    const notFoundRes = http.get(`${BASE_URL}/api/not-found-endpoint`);
    check(notFoundRes, {
      'Not found returns 404': (r) => r.status === 404
    });
    
    // Test validation error
    const invalidLoginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: 'invalid', password: '' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    check(invalidLoginRes, {
      'Invalid login returns 400': (r) => r.status === 400,
      'Invalid login returns validation errors': (r) => r.json().hasOwnProperty('errors')
    });
  });
  
  // Sleep between iterations
  sleep(Math.random() * 3 + 1);
}

export function teardown(data) {
  // Clean up after the test is done
  if (data.authData) {
    // Logout the test user
    const logoutRes = http.post(`${BASE_URL}/api/auth/logout`, null, {
      headers: {
        'Authorization': `Bearer ${data.authData.token}`
      }
    });
    console.log(`Logged out test user: ${logoutRes.status === 200 ? 'Success' : 'Failed'}`);
  }
}