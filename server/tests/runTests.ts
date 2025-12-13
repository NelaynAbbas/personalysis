/**
 * Main test runner script
 * Runs all the test suites and reports results
 */

import { runApiTests } from './apiTests';
import { runUtilTests } from './utilTests';
import { Logger } from '../utils/Logger';

const logger = new Logger('RunTests');

async function runAllTests() {
  logger.info('========== TEST EXECUTION STARTED ==========');
  logger.info('Running all tests...');
  
  const startTime = Date.now();
  
  // Track test results
  const results = {
    api: { passed: 0, failed: 0, total: 0, duration: 0, failedTests: [] as string[] },
    util: { passed: 0, failed: 0, total: 0, duration: 0, failedTests: [] as string[] }
  };
  
  try {
    // Run API tests
    logger.info('\n========== RUNNING API TESTS ==========');
    results.api = await runApiTests();
    
    // Run utility tests
    logger.info('\n========== RUNNING UTILITY TESTS ==========');
    results.util = await runUtilTests();
    
    // Calculate overall results
    const totalTests = results.api.total + results.util.total;
    const totalPassed = results.api.passed + results.util.passed;
    const totalFailed = results.api.failed + results.util.failed;
    const totalDuration = Date.now() - startTime;
    
    logger.info('\n========== TEST EXECUTION SUMMARY ==========');
    logger.info(`API Tests: ${results.api.passed}/${results.api.total} passed (${results.api.duration}ms)`);
    logger.info(`Utility Tests: ${results.util.passed}/${results.util.total} passed (${results.util.duration}ms)`);
    logger.info(`Overall: ${totalPassed}/${totalTests} passed (${totalDuration}ms)`);
    
    if (totalFailed > 0) {
      logger.error('\nFailed Tests:');
      
      if (results.api.failedTests.length > 0) {
        logger.error('  API Tests:');
        results.api.failedTests.forEach(test => logger.error(`    - ${test}`));
      }
      
      if (results.util.failedTests.length > 0) {
        logger.error('  Utility Tests:');
        results.util.failedTests.forEach(test => logger.error(`    - ${test}`));
      }
      
      process.exit(1);
    } else {
      logger.info('\nAll tests passed! 🎉');
      process.exit(0);
    }
  } catch (error) {
    logger.error('Error running tests:', error);
    process.exit(1);
  }
}

// Run all tests
runAllTests();