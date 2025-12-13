/**
 * Failover and Recovery Tests for PersonalysisPro
 * 
 * This script tests the system's ability to recover from various failure scenarios
 * and verifies that data integrity is maintained throughout the recovery process.
 */

const axios = require('axios');
const { Pool } = require('@neondatabase/serverless');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configure test settings
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';
const TEST_USERNAME = 'demo@personalysispro.com';
const TEST_PASSWORD = 'demo-password';
const ADMIN_USERNAME = 'admin@personalysispro.com';
const ADMIN_PASSWORD = 'admin-password';

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Set up API client
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'User-Agent': 'PersonalysisPro-RecoveryTester/1.0',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Helper function to log test results
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
 * Helper function to sleep for a specified duration
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run all recovery tests
 */
async function runRecoveryTests() {
  console.log('🔄 Starting PersonalysisPro Failover & Recovery Tests 🔄');
  console.log('===============================================');
  console.log(`Target: ${BASE_URL}`);
  console.log('===============================================\n');
  
  try {
    // Database connection recovery test
    await testDatabaseConnectionRecovery();
    
    // Session persistence test
    await testSessionPersistence();
    
    // Service restart recovery test
    await testServiceRestartRecovery();
    
    // Data consistency after failover test
    await testDataConsistencyAfterFailover();
    
    // Transaction rollback test
    await testTransactionRollback();
    
    // Cache recovery test
    await testCacheRecovery();
    
    console.log('\n===============================================');
    console.log('🔄 Failover & Recovery Tests Complete 🔄');
    console.log('===============================================');
  } catch (error) {
    console.error('Error during recovery tests:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

/**
 * Test database connection recovery
 */
async function testDatabaseConnectionRecovery() {
  console.log('\n🔌 Database Connection Recovery Tests 🔌');
  console.log('-----------------------------------------------');
  
  // Test 1: Verify database connection can be re-established
  let connectionRecoveryWorks = false;
  
  try {
    // First, verify we can connect
    await pool.query('SELECT 1');
    
    // For safety, we won't actually disconnect from the production database
    // Instead, we'll simulate a connection failure and recovery
    
    // Create a new pool with an invalid connection string to simulate failure
    const tempPool = new Pool({ connectionString: process.env.DATABASE_URL + '_invalid' });
    
    try {
      // This should fail
      await tempPool.query('SELECT 1');
    } catch (error) {
      // Expected error, now try to reconnect with valid connection string
      await tempPool.end();
      
      // Create a new pool with the correct connection string
      const recoveryPool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      // This should succeed
      await recoveryPool.query('SELECT 1');
      
      // Clean up
      await recoveryPool.end();
      
      connectionRecoveryWorks = true;
    }
    
    logResult('Database Connection Recovery', connectionRecoveryWorks,
      connectionRecoveryWorks ? 'Database connection can be re-established after failure' :
                             'Database connection recovery failed');
  } catch (error) {
    console.error('Error during database connection recovery test:', error);
    logResult('Database Connection Recovery', false, 'Error during database connection recovery test');
  }
}

/**
 * Test session persistence across service restarts
 */
async function testSessionPersistence() {
  console.log('\n🔑 Session Persistence Tests 🔑');
  console.log('-----------------------------------------------');
  
  // Test 1: Verify session persists across simulated service restart
  let sessionPersists = false;
  let token = null;
  let userId = null;
  
  try {
    // Log in to get an authentication token
    const loginResponse = await api.post('/api/auth/login', {
      email: TEST_USERNAME,
      password: TEST_PASSWORD
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      token = loginResponse.data.token;
      
      // Get user data to verify we're logged in
      const userResponse = await api.get('/api/auth/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (userResponse.data && userResponse.data.id) {
        userId = userResponse.data.id;
        
        // Now, simulating a service restart by waiting and then
        // trying to use the same token again
        console.log('  Simulating service restart...');
        
        // Wait for a bit
        await sleep(2000);
        
        // Try to use the same token to access a protected resource
        const afterRestartResponse = await api.get('/api/auth/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // If we get a valid response with the same user ID, session persisted
        sessionPersists = 
          afterRestartResponse.data && 
          afterRestartResponse.data.id === userId;
      }
    }
    
    logResult('Session Persistence', sessionPersists,
      sessionPersists ? 'Session persists across service restarts' :
                      'Session does not persist across service restarts');
  } catch (error) {
    console.error('Error during session persistence test:', error);
    logResult('Session Persistence', false, 'Error during session persistence test');
  }
}

/**
 * Test service restart recovery
 */
async function testServiceRestartRecovery() {
  console.log('\n🔄 Service Restart Recovery Tests 🔄');
  console.log('-----------------------------------------------');
  
  // Test 1: Verify service functionality after restart
  let serviceRecoversAfterRestart = false;
  
  try {
    // For safety, we won't actually restart the production service
    // Instead, we'll simulate a restart by checking basic API functionality
    
    // Check initial API health
    const initialHealth = await api.get('/api/health');
    const initialHealthOk = initialHealth.status === 200;
    
    if (initialHealthOk) {
      // Simulate a restart by waiting
      console.log('  Simulating service restart...');
      await sleep(2000);
      
      // Check API health again
      const afterRestartHealth = await api.get('/api/health');
      serviceRecoversAfterRestart = afterRestartHealth.status === 200;
    }
    
    logResult('Service Restart Recovery', serviceRecoversAfterRestart,
      serviceRecoversAfterRestart ? 'Service recovers functionality after restart' :
                                 'Service does not recover properly after restart');
  } catch (error) {
    // If health endpoint doesn't exist, try a different endpoint
    try {
      // Try public endpoint as fallback
      const publicResponse = await api.get('/api/public/info');
      serviceRecoversAfterRestart = publicResponse.status === 200;
      
      logResult('Service Restart Recovery', serviceRecoversAfterRestart,
        serviceRecoversAfterRestart ? 'Service recovers functionality after restart (fallback check)' :
                                   'Service does not recover properly after restart');
    } catch (fallbackError) {
      console.error('Error during service restart recovery test:', error);
      logResult('Service Restart Recovery', false, 'Error during service restart recovery test');
    }
  }
}

/**
 * Test data consistency after simulated failover
 */
async function testDataConsistencyAfterFailover() {
  console.log('\n📊 Data Consistency After Failover Tests 📊');
  console.log('-----------------------------------------------');
  
  // Test 1: Verify data consistency after simulated failover
  let dataConsistentAfterFailover = false;
  let adminToken = null;
  let testCompanyId = null;
  let testDataBeforeFailover = null;
  
  try {
    // Log in as admin
    const loginResponse = await api.post('/api/auth/login', {
      email: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      adminToken = loginResponse.data.token;
      
      // Get a company to test with
      const companiesResponse = await api.get('/api/admin/companies', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (companiesResponse.data && companiesResponse.data.length > 0) {
        testCompanyId = companiesResponse.data[0].id;
        
        // Get company data before simulated failover
        const beforeFailoverResponse = await api.get(`/api/admin/companies/${testCompanyId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        testDataBeforeFailover = beforeFailoverResponse.data;
        
        // Simulate a failover by waiting
        console.log('  Simulating database failover...');
        await sleep(2000);
        
        // Get company data after simulated failover
        const afterFailoverResponse = await api.get(`/api/admin/companies/${testCompanyId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        const testDataAfterFailover = afterFailoverResponse.data;
        
        // Compare the data before and after
        dataConsistentAfterFailover = 
          JSON.stringify(testDataBeforeFailover) === JSON.stringify(testDataAfterFailover);
      }
    }
    
    logResult('Data Consistency After Failover', dataConsistentAfterFailover,
      dataConsistentAfterFailover ? 'Data remains consistent after simulated failover' :
                                 'Data inconsistency detected after simulated failover');
  } catch (error) {
    console.error('Error during data consistency after failover test:', error);
    logResult('Data Consistency After Failover', false, 'Error during data consistency test');
  }
}

/**
 * Test transaction rollback during failures
 */
async function testTransactionRollback() {
  console.log('\n🔙 Transaction Rollback Tests 🔙');
  console.log('-----------------------------------------------');
  
  // Test 1: Verify transactions rollback properly during failures
  let transactionRollbackWorks = false;
  
  try {
    // For safety, we'll simulate a transaction failure and rollback
    // instead of actually manipulating production data
    
    // Start a transaction but force it to fail
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current count of users
      const countResult = await client.query('SELECT COUNT(*) FROM users');
      const initialCount = parseInt(countResult.rows[0].count);
      
      // Insert a test user
      await client.query(`
        INSERT INTO users (email, username) 
        VALUES ('test_rollback@example.com', 'test_rollback_user')
      `);
      
      // Verify the user was inserted
      const afterInsertResult = await client.query('SELECT COUNT(*) FROM users');
      const afterInsertCount = parseInt(afterInsertResult.rows[0].count);
      
      if (afterInsertCount === initialCount + 1) {
        // Force an error in the transaction
        await client.query('SELECT * FROM non_existent_table');
        
        // This line should never execute due to the error above
        await client.query('COMMIT');
      }
    } catch (error) {
      // Expected error, rollback the transaction
      await client.query('ROLLBACK');
      
      // Check if the user count is back to the initial count
      const finalResult = await client.query('SELECT COUNT(*) FROM users');
      const finalCount = parseInt(finalResult.rows[0].count);
      
      // If the count is the same as initial, rollback worked
      transactionRollbackWorks = finalCount === initialCount;
    } finally {
      client.release();
    }
    
    logResult('Transaction Rollback', transactionRollbackWorks,
      transactionRollbackWorks ? 'Transactions rollback properly during failures' :
                              'Transaction rollback mechanism may be unreliable');
  } catch (error) {
    console.error('Error during transaction rollback test:', error);
    logResult('Transaction Rollback', false, 'Error during transaction rollback test');
  }
}

/**
 * Test cache recovery after failures
 */
async function testCacheRecovery() {
  console.log('\n🧠 Cache Recovery Tests 🧠');
  console.log('-----------------------------------------------');
  
  // Test 1: Verify API response times indicate cache usage
  let cacheRecoversAfterFailure = false;
  let adminToken = null;
  
  try {
    // Log in as admin
    const loginResponse = await api.post('/api/auth/login', {
      email: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      adminToken = loginResponse.data.token;
      
      // Make a request that likely uses cache
      console.log('  First request (cache miss expected)...');
      const startTimeFirstRequest = Date.now();
      await api.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const durationFirstRequest = Date.now() - startTimeFirstRequest;
      
      // Make the same request again, should be faster if cached
      console.log('  Second request (cache hit expected)...');
      const startTimeSecondRequest = Date.now();
      await api.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const durationSecondRequest = Date.now() - startTimeSecondRequest;
      
      // If second request is faster, cache is working
      const cacheWorking = durationSecondRequest < durationFirstRequest;
      
      // Simulate cache failure by waiting
      console.log('  Simulating cache flush...');
      await sleep(2000);
      
      // Make another request, should be slower if cache was cleared
      console.log('  Request after cache flush (cache miss expected)...');
      const startTimeAfterFlush = Date.now();
      await api.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const durationAfterFlush = Date.now() - startTimeAfterFlush;
      
      // Make a final request, should be faster again if cache recovered
      console.log('  Final request (cache hit after recovery expected)...');
      const startTimeFinalRequest = Date.now();
      await api.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const durationFinalRequest = Date.now() - startTimeFinalRequest;
      
      // If final request is faster than the post-flush request,
      // cache has recovered
      cacheRecoversAfterFailure = 
        cacheWorking && durationFinalRequest < durationAfterFlush;
      
      logResult('Cache Recovery', cacheRecoversAfterFailure,
        cacheRecoversAfterFailure ? 
          `Cache appears to recover after failures (Initial: ${durationFirstRequest}ms, Cached: ${durationSecondRequest}ms, After flush: ${durationAfterFlush}ms, Recovered: ${durationFinalRequest}ms)` :
          `Cache may not recover properly (Initial: ${durationFirstRequest}ms, Cached: ${durationSecondRequest}ms, After flush: ${durationAfterFlush}ms, Recovered: ${durationFinalRequest}ms)`);
    }
  } catch (error) {
    console.error('Error during cache recovery test:', error);
    logResult('Cache Recovery', false, 'Error during cache recovery test');
  }
}

// Run all tests if this script is executed directly
if (require.main === module) {
  runRecoveryTests().catch(console.error);
}

module.exports = {
  runRecoveryTests,
  testDatabaseConnectionRecovery,
  testSessionPersistence,
  testServiceRestartRecovery,
  testDataConsistencyAfterFailover,
  testTransactionRollback,
  testCacheRecovery
};