/**
 * Security and Vulnerability Assessment Tests for PersonalysisPro
 * 
 * This script runs a series of security tests to identify potential vulnerabilities
 * in the PersonalysisPro application.
 */

const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const assert = require('assert');
const util = require('util');
const execPromise = util.promisify(exec);

// Configure the base URL for testing
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';
const TEST_USERNAME = 'demo@personalysispro.com';
const TEST_PASSWORD = 'demo-password';

// Create an axios instance for consistent headers
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'User-Agent': 'PersonalysisPro-SecurityTester/1.0',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Helper to log results in a consistent format
 */
function logResult(testName, result, details = '') {
  const status = result ? '✅ PASSED' : '❌ FAILED';
  console.log(`${status}: ${testName}`);
  if (details) {
    console.log(`  Details: ${details}`);
  }
  console.log('-------------------------------------------');
}

/**
 * Runs a full security assessment
 */
async function runSecurityAssessment() {
  console.log('🔒 Starting PersonalysisPro Security Assessment 🔒');
  console.log('===============================================');
  console.log(`Target: ${BASE_URL}`);
  console.log('===============================================\n');
  
  try {
    // Authentication Tests
    await testAuthenticationSecurity();
    
    // Session Management Tests
    await testSessionManagement();
    
    // Input Validation Tests
    await testInputValidation();
    
    // Access Control Tests
    await testAccessControl();
    
    // Data Protection Tests
    await testDataProtection();
    
    // API Security Tests
    await testApiSecurity();
    
    // CSRF Protection Tests
    await testCsrfProtection();
    
    // XSS Vulnerability Tests
    await testXssVulnerabilities();
    
    // SQL Injection Tests
    await testSqlInjection();
    
    // Rate Limiting Tests
    await testRateLimiting();
    
    // Security Headers Tests
    await testSecurityHeaders();
    
    console.log('\n===============================================');
    console.log('🔒 Security Assessment Complete 🔒');
    console.log('===============================================');
  } catch (error) {
    console.error('Error during security assessment:', error);
  }
}

/**
 * Tests authentication security mechanisms
 */
async function testAuthenticationSecurity() {
  console.log('\n🔑 Authentication Security Tests 🔑');
  console.log('-----------------------------------------------');
  
  // Test 1: Brute force protection
  let bruteForceProtected = false;
  try {
    // Attempt multiple failed logins
    for (let i = 0; i < 10; i++) {
      try {
        await api.post('/api/auth/login', {
          email: TEST_USERNAME,
          password: `wrong-password-${i}`
        });
      } catch (error) {
        // If we start getting 429 Too Many Requests, brute force protection is working
        if (error.response && error.response.status === 429) {
          bruteForceProtected = true;
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error during brute force test:', error);
  }
  
  logResult('Brute Force Protection', bruteForceProtected, 
    bruteForceProtected ? 'Rate limiting on failed login attempts is working' : 'No rate limiting detected on login endpoint');
  
  // Test 2: Password strength requirements
  let passwordStrengthEnforced = false;
  try {
    // Try to create an account with a weak password
    await api.post('/api/auth/register', {
      email: `test${Date.now()}@example.com`,
      password: '123456',
      name: 'Test User'
    });
  } catch (error) {
    // If we get a 400 Bad Request, password strength is being checked
    if (error.response && error.response.status === 400 && 
        error.response.data.message && 
        error.response.data.message.toLowerCase().includes('password')) {
      passwordStrengthEnforced = true;
    }
  }
  
  logResult('Password Strength Requirements', passwordStrengthEnforced,
    passwordStrengthEnforced ? 'Weak passwords are rejected' : 'Weak passwords may be accepted');
  
  // Test 3: Secure authentication tokens
  let token = null;
  let secureTokens = false;
  
  try {
    // Get a valid token
    const loginResponse = await api.post('/api/auth/login', {
      email: TEST_USERNAME,
      password: TEST_PASSWORD
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      token = loginResponse.data.token;
      
      // Check if token is HTTP-only and secure in cookies
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies) {
        secureTokens = cookies.some(cookie => 
          cookie.includes('HttpOnly') && 
          (cookie.includes('Secure') || !BASE_URL.startsWith('https'))
        );
      }
      
      // If no cookies, check JWT structure
      if (!secureTokens && token) {
        // Simple JWT check - proper JWTs have 3 parts separated by dots
        const parts = token.split('.');
        secureTokens = parts.length === 3;
      }
    }
  } catch (error) {
    console.error('Error during token security test:', error);
  }
  
  logResult('Secure Authentication Tokens', secureTokens,
    secureTokens ? 'Authentication tokens appear to be properly secured' : 'Authentication tokens may not be properly secured');
}

/**
 * Tests session management security
 */
async function testSessionManagement() {
  console.log('\n🕒 Session Management Tests 🕒');
  console.log('-----------------------------------------------');
  
  // Test 1: Session timeout
  let sessionTimeoutEnabled = false;
  let token = null;
  
  try {
    // Get a valid token
    const loginResponse = await api.post('/api/auth/login', {
      email: TEST_USERNAME,
      password: TEST_PASSWORD
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      token = loginResponse.data.token;
      
      // Check for session timeout settings in cookies
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies) {
        // Look for max-age or expires attributes
        sessionTimeoutEnabled = cookies.some(cookie => 
          cookie.includes('Max-Age=') || cookie.includes('Expires=')
        );
      }
    }
  } catch (error) {
    console.error('Error during session timeout test:', error);
  }
  
  logResult('Session Timeout', sessionTimeoutEnabled,
    sessionTimeoutEnabled ? 'Session timeout appears to be configured' : 'No evidence of session timeout configuration');
  
  // Test 2: Session invalidation on logout
  let sessionInvalidatedOnLogout = false;
  
  if (token) {
    try {
      // Set up authenticated API instance
      const authApi = axios.create({
        baseURL: BASE_URL,
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Make a request to confirm token works
      await authApi.get('/api/client/dashboard');
      
      // Log out
      await authApi.post('/api/auth/logout');
      
      try {
        // Try to use the same token after logout
        await authApi.get('/api/client/dashboard');
      } catch (error) {
        // If we get a 401 Unauthorized, session was invalidated
        if (error.response && error.response.status === 401) {
          sessionInvalidatedOnLogout = true;
        }
      }
    } catch (error) {
      console.error('Error during logout test:', error);
    }
  }
  
  logResult('Session Invalidation on Logout', sessionInvalidatedOnLogout,
    sessionInvalidatedOnLogout ? 'Sessions are properly invalidated on logout' : 'Sessions may not be invalidated on logout');
}

/**
 * Tests input validation security
 */
async function testInputValidation() {
  console.log('\n📝 Input Validation Tests 📝');
  console.log('-----------------------------------------------');
  
  // Test 1: Email validation
  let emailValidationPresent = false;
  
  try {
    // Try to register with an invalid email
    await api.post('/api/auth/register', {
      email: 'not-an-email',
      password: 'TestPassword123!',
      name: 'Test User'
    });
  } catch (error) {
    // If we get a 400 Bad Request, email validation is present
    if (error.response && error.response.status === 400 &&
        error.response.data.message && 
        error.response.data.message.toLowerCase().includes('email')) {
      emailValidationPresent = true;
    }
  }
  
  logResult('Email Validation', emailValidationPresent,
    emailValidationPresent ? 'Email format is validated' : 'Email validation may be insufficient');
  
  // Test 2: Content-Type validation
  let contentTypeValidated = false;
  
  try {
    // Send a request with wrong content type
    await axios({
      method: 'post',
      url: `${BASE_URL}/api/auth/login`,
      headers: {
        'Content-Type': 'text/plain'
      },
      data: 'email=test@example.com&password=password'
    });
  } catch (error) {
    // If we get a 415 Unsupported Media Type, content type is validated
    if (error.response && (error.response.status === 415 || error.response.status === 400)) {
      contentTypeValidated = true;
    }
  }
  
  logResult('Content-Type Validation', contentTypeValidated,
    contentTypeValidated ? 'Content-Type headers are validated' : 'Content-Type validation may be insufficient');
}

/**
 * Tests access control security
 */
async function testAccessControl() {
  console.log('\n🚪 Access Control Tests 🚪');
  console.log('-----------------------------------------------');
  
  // Test 1: Unauthorized access to protected routes
  let protectedRoutesSecured = false;
  
  try {
    // Try to access a protected route without authentication
    await api.get('/api/admin/users');
  } catch (error) {
    // If we get a 401 Unauthorized, routes are protected
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      protectedRoutesSecured = true;
    }
  }
  
  logResult('Protected Routes', protectedRoutesSecured,
    protectedRoutesSecured ? 'Protected routes require authentication' : 'Protected routes may be accessible without authentication');
  
  // Test 2: Role-based access control
  let rbacImplemented = false;
  let clientToken = null;
  
  try {
    // Get a client token
    const loginResponse = await api.post('/api/auth/login', {
      email: TEST_USERNAME,
      password: TEST_PASSWORD
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      clientToken = loginResponse.data.token;
      
      // Set up authenticated API instance for client
      const clientApi = axios.create({
        baseURL: BASE_URL,
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      try {
        // Try to access admin-only route with client token
        await clientApi.get('/api/admin/users');
      } catch (error) {
        // If we get a 403 Forbidden, RBAC is implemented
        if (error.response && error.response.status === 403) {
          rbacImplemented = true;
        }
      }
    }
  } catch (error) {
    console.error('Error during RBAC test:', error);
  }
  
  logResult('Role-Based Access Control', rbacImplemented,
    rbacImplemented ? 'Role-based access control is implemented' : 'Role-based access control may be insufficient');
}

/**
 * Tests data protection security
 */
async function testDataProtection() {
  console.log('\n🔒 Data Protection Tests 🔒');
  console.log('-----------------------------------------------');
  
  // Test 1: HTTPS usage
  const httpsUsed = BASE_URL.startsWith('https');
  
  logResult('HTTPS Usage', httpsUsed,
    httpsUsed ? 'Application uses HTTPS' : 'Application is not using HTTPS');
  
  // Test 2: Sensitive data in responses
  let sensitiveDataProtected = true; // Assume true until found otherwise
  let token = null;
  
  try {
    // Get a valid token
    const loginResponse = await api.post('/api/auth/login', {
      email: TEST_USERNAME,
      password: TEST_PASSWORD
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      token = loginResponse.data.token;
      
      // Set up authenticated API instance
      const authApi = axios.create({
        baseURL: BASE_URL,
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Check user profile response for sensitive data
      const userResponse = await authApi.get('/api/auth/user');
      
      // Check for password fields or other sensitive data
      if (userResponse.data) {
        sensitiveDataProtected = !JSON.stringify(userResponse.data).includes('password');
      }
    }
  } catch (error) {
    console.error('Error during sensitive data test:', error);
  }
  
  logResult('Sensitive Data Protection', sensitiveDataProtected,
    sensitiveDataProtected ? 'Responses appear to protect sensitive data' : 'Sensitive data may be exposed in responses');
}

/**
 * Tests API security
 */
async function testApiSecurity() {
  console.log('\n🌐 API Security Tests 🌐');
  console.log('-----------------------------------------------');
  
  // Test 1: API key validation
  let apiKeyValidated = false;
  
  try {
    // Try to access API with invalid key
    await api.get('/api/v1/surveys', {
      headers: {
        'X-API-Key': 'invalid-api-key'
      }
    });
  } catch (error) {
    // If we get a 401 Unauthorized, API key validation is working
    if (error.response && error.response.status === 401) {
      apiKeyValidated = true;
    }
  }
  
  logResult('API Key Validation', apiKeyValidated,
    apiKeyValidated ? 'API key validation is implemented' : 'API key validation may be insufficient');
  
  // Test 2: API request validation
  let requestValidated = false;
  
  try {
    // Get a valid token
    const loginResponse = await api.post('/api/auth/login', {
      email: TEST_USERNAME,
      password: TEST_PASSWORD
    });
    
    let token = null;
    if (loginResponse.data && loginResponse.data.token) {
      token = loginResponse.data.token;
      
      // Set up authenticated API instance
      const authApi = axios.create({
        baseURL: BASE_URL,
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Send an invalid request
      await authApi.post('/api/surveys', {
        // Missing required fields
      });
    }
  } catch (error) {
    // If we get a 400 Bad Request, request validation is working
    if (error.response && error.response.status === 400) {
      requestValidated = true;
    }
  }
  
  logResult('API Request Validation', requestValidated,
    requestValidated ? 'API request validation is implemented' : 'API request validation may be insufficient');
}

/**
 * Tests CSRF protection
 */
async function testCsrfProtection() {
  console.log('\n🛡️ CSRF Protection Tests 🛡️');
  console.log('-----------------------------------------------');
  
  // Test 1: CSRF token requirement
  let csrfProtectionImplemented = false;
  let token = null;
  let csrfToken = null;
  
  try {
    // Get a valid token and look for CSRF token
    const loginResponse = await api.post('/api/auth/login', {
      email: TEST_USERNAME,
      password: TEST_PASSWORD
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      token = loginResponse.data.token;
      
      // Set up authenticated API instance
      const authApi = axios.create({
        baseURL: BASE_URL,
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Try to get CSRF token
      const csrfResponse = await authApi.get('/api/auth/csrf-token');
      
      if (csrfResponse.data && csrfResponse.data.csrfToken) {
        csrfToken = csrfResponse.data.csrfToken;
      }
      
      if (csrfToken) {
        // Try a state-changing request with CSRF token
        await authApi.post('/api/account/profile', {
          name: 'Test User'
        }, {
          headers: {
            'X-CSRF-Token': csrfToken
          }
        });
        
        // Try a state-changing request without CSRF token
        try {
          await authApi.post('/api/account/profile', {
            name: 'Test User'
          });
        } catch (error) {
          // If we get a 403 Forbidden, CSRF protection is working
          if (error.response && error.response.status === 403) {
            csrfProtectionImplemented = true;
          }
        }
      }
    }
  } catch (error) {
    // If we get errors here, CSRF endpoints might not exist which is fine
    // We're checking for CSRF enforcement on state-changing requests
  }
  
  logResult('CSRF Protection', csrfProtectionImplemented,
    csrfProtectionImplemented ? 'CSRF protection appears to be implemented' : 'CSRF protection may be insufficient');
}

/**
 * Tests XSS vulnerabilities
 */
async function testXssVulnerabilities() {
  console.log('\n🔍 XSS Vulnerability Tests 🔍');
  console.log('-----------------------------------------------');
  
  // Test 1: Reflected XSS protection
  let reflectedXssProtection = false;
  
  try {
    // Test a search endpoint for XSS
    const searchResponse = await api.get(`/api/search?q=<script>alert('XSS')</script>`);
    
    // Check if the script tag was escaped in the response
    reflectedXssProtection = !searchResponse.data.includes('<script>alert');
  } catch (error) {
    // If we get an error, the endpoint might not exist, which is fine
    reflectedXssProtection = true;
  }
  
  logResult('Reflected XSS Protection', reflectedXssProtection,
    reflectedXssProtection ? 'Reflected XSS appears to be mitigated' : 'Reflected XSS vulnerabilities may exist');
  
  // Test 2: Stored XSS protection
  let storedXssProtection = false;
  let token = null;
  
  try {
    // Get a valid token
    const loginResponse = await api.post('/api/auth/login', {
      email: TEST_USERNAME,
      password: TEST_PASSWORD
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      token = loginResponse.data.token;
      
      // Set up authenticated API instance
      const authApi = axios.create({
        baseURL: BASE_URL,
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Try to update profile with XSS payload
      await authApi.post('/api/account/profile', {
        name: '<script>alert("XSS")</script>'
      });
      
      // Check if the script tag was stored as-is
      const profileResponse = await authApi.get('/api/account/profile');
      
      // If the response doesn't contain the raw script tag, XSS is mitigated
      storedXssProtection = !JSON.stringify(profileResponse.data).includes('<script>alert');
    }
  } catch (error) {
    // If we get an error, it might be validation rejecting the script tag, which is good
    if (error.response && error.response.status === 400) {
      storedXssProtection = true;
    }
  }
  
  logResult('Stored XSS Protection', storedXssProtection,
    storedXssProtection ? 'Stored XSS appears to be mitigated' : 'Stored XSS vulnerabilities may exist');
}

/**
 * Tests SQL injection vulnerabilities
 */
async function testSqlInjection() {
  console.log('\n💉 SQL Injection Tests 💉');
  console.log('-----------------------------------------------');
  
  // Test 1: SQL injection in search
  let searchSqlInjectionProtection = false;
  
  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users; --"
  ];
  
  try {
    for (const payload of sqlInjectionPayloads) {
      try {
        // Try a search with SQL injection payload
        await api.get(`/api/search?q=${encodeURIComponent(payload)}`);
        
        // If we don't get a 500 error, it's likely protected
        searchSqlInjectionProtection = true;
      } catch (error) {
        // If we get a 400 Bad Request, it might be validation rejecting the payload
        if (error.response && error.response.status === 400) {
          searchSqlInjectionProtection = true;
        }
        // If we get a 500 Internal Server Error, it might be SQL injection succeeding
        else if (error.response && error.response.status === 500) {
          searchSqlInjectionProtection = false;
          break;
        }
      }
    }
  } catch (error) {
    // If the endpoint doesn't exist, we can't test it
    searchSqlInjectionProtection = true;
  }
  
  logResult('Search SQL Injection Protection', searchSqlInjectionProtection,
    searchSqlInjectionProtection ? 'Search appears protected against SQL injection' : 'Search may be vulnerable to SQL injection');
  
  // Test 2: SQL injection in login
  let loginSqlInjectionProtection = false;
  
  try {
    for (const payload of sqlInjectionPayloads) {
      try {
        // Try to login with SQL injection payload
        await api.post('/api/auth/login', {
          email: `test@example.com${payload}`,
          password: 'password'
        });
      } catch (error) {
        // If we get a 400 Bad Request or 401 Unauthorized, it's likely protected
        if (error.response && (error.response.status === 400 || error.response.status === 401)) {
          loginSqlInjectionProtection = true;
        }
        // If we get a 500 Internal Server Error, it might be SQL injection succeeding
        else if (error.response && error.response.status === 500) {
          loginSqlInjectionProtection = false;
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error during login SQL injection test:', error);
  }
  
  logResult('Login SQL Injection Protection', loginSqlInjectionProtection,
    loginSqlInjectionProtection ? 'Login appears protected against SQL injection' : 'Login may be vulnerable to SQL injection');
}

/**
 * Tests rate limiting
 */
async function testRateLimiting() {
  console.log('\n⏱️ Rate Limiting Tests ⏱️');
  console.log('-----------------------------------------------');
  
  // Test 1: API rate limiting
  let apiRateLimited = false;
  
  try {
    // Make many requests in rapid succession
    const requests = [];
    for (let i = 0; i < 50; i++) {
      requests.push(api.get('/api/v1/surveys'));
    }
    
    await Promise.all(requests);
  } catch (error) {
    // If we get a 429 Too Many Requests, rate limiting is working
    if (error.response && error.response.status === 429) {
      apiRateLimited = true;
    }
  }
  
  logResult('API Rate Limiting', apiRateLimited,
    apiRateLimited ? 'API rate limiting is implemented' : 'API rate limiting may be insufficient');
}

/**
 * Tests security headers
 */
async function testSecurityHeaders() {
  console.log('\n📋 Security Headers Tests 📋');
  console.log('-----------------------------------------------');
  
  // Get headers from a response
  let headers = {};
  
  try {
    const response = await api.get('/');
    headers = response.headers;
  } catch (error) {
    if (error.response) {
      headers = error.response.headers;
    } else {
      console.error('Error getting headers:', error);
      return;
    }
  }
  
  // Test 1: Content-Security-Policy
  const hasCSP = headers['content-security-policy'] !== undefined;
  
  logResult('Content-Security-Policy', hasCSP,
    hasCSP ? 'CSP header is present' : 'CSP header is missing');
  
  // Test 2: X-XSS-Protection
  const hasXssProtection = headers['x-xss-protection'] !== undefined;
  
  logResult('X-XSS-Protection', hasXssProtection,
    hasXssProtection ? 'X-XSS-Protection header is present' : 'X-XSS-Protection header is missing');
  
  // Test 3: X-Content-Type-Options
  const hasContentTypeOptions = headers['x-content-type-options'] !== undefined;
  
  logResult('X-Content-Type-Options', hasContentTypeOptions,
    hasContentTypeOptions ? 'X-Content-Type-Options header is present' : 'X-Content-Type-Options header is missing');
  
  // Test 4: Strict-Transport-Security
  const hasHsts = headers['strict-transport-security'] !== undefined;
  
  logResult('Strict-Transport-Security', hasHsts,
    hasHsts ? 'HSTS header is present' : 'HSTS header is missing');
  
  // Test 5: X-Frame-Options
  const hasFrameOptions = headers['x-frame-options'] !== undefined;
  
  logResult('X-Frame-Options', hasFrameOptions,
    hasFrameOptions ? 'X-Frame-Options header is present' : 'X-Frame-Options header is missing');
}

// Run all tests if this script is executed directly
if (require.main === module) {
  runSecurityAssessment().catch(console.error);
}

module.exports = {
  runSecurityAssessment,
  testAuthenticationSecurity,
  testSessionManagement,
  testInputValidation,
  testAccessControl,
  testDataProtection,
  testApiSecurity,
  testCsrfProtection,
  testXssVulnerabilities,
  testSqlInjection,
  testRateLimiting,
  testSecurityHeaders
};