/**
 * PersonalysisPro Quality Assurance Test Suite
 * 
 * This script runs all QA tests to validate the application's readiness
 * for production deployment.
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const path = require('path');
const fs = require('fs');

// Import test modules
const { runDataIntegrityTests } = require('./data-integrity/data-integrity-tests');
const { runSecurityAssessment } = require('./security/security-tests');
const { runRecoveryTests } = require('./recovery/failover-recovery-tests');
const { runAllTests: runCompatibilityTests } = require('./compatibility/browser-compatibility-tests');

// Configuration
const REPORT_DIR = path.join(__dirname, '../test-reports');
const SERVER_URL = process.env.TEST_URL || 'http://localhost:5000';
const TEST_MODE = process.env.TEST_MODE || 'all'; // 'all', 'e2e', 'load', 'security', 'data', 'recovery', 'compatibility'

// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

/**
 * Log message with timestamp
 */
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

/**
 * Run end-to-end tests
 */
async function runE2ETests() {
  log('Starting End-to-End Tests', 'TEST');
  
  try {
    const result = await execPromise('npx playwright test tests/e2e/end-to-end-tests.js --reporter=html');
    log('End-to-End Tests completed successfully', 'SUCCESS');
    return { success: true, output: result.stdout };
  } catch (error) {
    log(`End-to-End Tests failed: ${error.message}`, 'ERROR');
    return { success: false, output: error.stdout || error.message };
  }
}

/**
 * Run load tests
 */
async function runLoadTests() {
  log('Starting Load Tests', 'TEST');
  
  try {
    const result = await execPromise('npx artillery run tests/load/load-test-config.yml');
    log('Load Tests completed successfully', 'SUCCESS');
    return { success: true, output: result.stdout };
  } catch (error) {
    log(`Load Tests failed: ${error.message}`, 'ERROR');
    return { success: false, output: error.stdout || error.message };
  }
}

/**
 * Save test results to file
 */
function saveTestResults(testName, results) {
  const filename = path.join(REPORT_DIR, `${testName}-results-${new Date().toISOString().replace(/:/g, '-')}.txt`);
  
  let content = `Test: ${testName}\n`;
  content += `Status: ${results.success ? 'PASSED' : 'FAILED'}\n`;
  content += `Timestamp: ${new Date().toISOString()}\n`;
  content += `Server URL: ${SERVER_URL}\n`;
  content += '\n=============== OUTPUT ===============\n\n';
  content += results.output || 'No output captured';
  
  fs.writeFileSync(filename, content);
  log(`Test results saved to ${filename}`, 'INFO');
}

/**
 * Run all QA tests
 */
async function runAllTests() {
  log('Starting PersonalysisPro QA Test Suite', 'START');
  log(`Test Mode: ${TEST_MODE}`, 'CONFIG');
  log(`Server URL: ${SERVER_URL}`, 'CONFIG');
  
  let testResults = {
    e2e: null,
    load: null,
    security: null,
    dataIntegrity: null,
    recovery: null,
    compatibility: null
  };
  
  // Run End-to-End Tests
  if (TEST_MODE === 'all' || TEST_MODE === 'e2e') {
    testResults.e2e = await runE2ETests();
    saveTestResults('e2e', testResults.e2e);
  }
  
  // Run Load Tests
  if (TEST_MODE === 'all' || TEST_MODE === 'load') {
    testResults.load = await runLoadTests();
    saveTestResults('load', testResults.load);
  }
  
  // Run Security Tests
  if (TEST_MODE === 'all' || TEST_MODE === 'security') {
    log('Starting Security Tests', 'TEST');
    try {
      const captureOutput = [];
      const originalConsoleLog = console.log;
      
      // Capture console output from the security tests
      console.log = (message) => {
        captureOutput.push(message);
        originalConsoleLog(message);
      };
      
      await runSecurityAssessment();
      
      // Restore original console.log
      console.log = originalConsoleLog;
      
      log('Security Tests completed successfully', 'SUCCESS');
      testResults.security = { success: true, output: captureOutput.join('\n') };
      saveTestResults('security', testResults.security);
    } catch (error) {
      log(`Security Tests failed: ${error.message}`, 'ERROR');
      testResults.security = { success: false, output: error.message };
      saveTestResults('security', testResults.security);
    }
  }
  
  // Run Data Integrity Tests
  if (TEST_MODE === 'all' || TEST_MODE === 'data') {
    log('Starting Data Integrity Tests', 'TEST');
    try {
      const captureOutput = [];
      const originalConsoleLog = console.log;
      
      // Capture console output
      console.log = (message) => {
        captureOutput.push(message);
        originalConsoleLog(message);
      };
      
      await runDataIntegrityTests();
      
      // Restore original console.log
      console.log = originalConsoleLog;
      
      log('Data Integrity Tests completed successfully', 'SUCCESS');
      testResults.dataIntegrity = { success: true, output: captureOutput.join('\n') };
      saveTestResults('data-integrity', testResults.dataIntegrity);
    } catch (error) {
      log(`Data Integrity Tests failed: ${error.message}`, 'ERROR');
      testResults.dataIntegrity = { success: false, output: error.message };
      saveTestResults('data-integrity', testResults.dataIntegrity);
    }
  }
  
  // Run Recovery Tests
  if (TEST_MODE === 'all' || TEST_MODE === 'recovery') {
    log('Starting Recovery Tests', 'TEST');
    try {
      const captureOutput = [];
      const originalConsoleLog = console.log;
      
      // Capture console output
      console.log = (message) => {
        captureOutput.push(message);
        originalConsoleLog(message);
      };
      
      await runRecoveryTests();
      
      // Restore original console.log
      console.log = originalConsoleLog;
      
      log('Recovery Tests completed successfully', 'SUCCESS');
      testResults.recovery = { success: true, output: captureOutput.join('\n') };
      saveTestResults('recovery', testResults.recovery);
    } catch (error) {
      log(`Recovery Tests failed: ${error.message}`, 'ERROR');
      testResults.recovery = { success: false, output: error.message };
      saveTestResults('recovery', testResults.recovery);
    }
  }
  
  // Run Compatibility Tests
  if (TEST_MODE === 'all' || TEST_MODE === 'compatibility') {
    log('Starting Compatibility Tests', 'TEST');
    try {
      const captureOutput = [];
      const originalConsoleLog = console.log;
      
      // Capture console output
      console.log = (message) => {
        captureOutput.push(message);
        originalConsoleLog(message);
      };
      
      await runCompatibilityTests();
      
      // Restore original console.log
      console.log = originalConsoleLog;
      
      log('Compatibility Tests completed successfully', 'SUCCESS');
      testResults.compatibility = { success: true, output: captureOutput.join('\n') };
      saveTestResults('compatibility', testResults.compatibility);
    } catch (error) {
      log(`Compatibility Tests failed: ${error.message}`, 'ERROR');
      testResults.compatibility = { success: false, output: error.message };
      saveTestResults('compatibility', testResults.compatibility);
    }
  }
  
  // Generate Summary Report
  generateSummaryReport(testResults);
  
  log('PersonalysisPro QA Test Suite Completed', 'END');
}

/**
 * Generate summary report of all test results
 */
function generateSummaryReport(testResults) {
  const filename = path.join(REPORT_DIR, `qa-summary-report-${new Date().toISOString().replace(/:/g, '-')}.txt`);
  
  let content = '=============================================\n';
  content += '    PersonalysisPro QA Test Suite Summary\n';
  content += '=============================================\n\n';
  content += `Generated: ${new Date().toISOString()}\n`;
  content += `Server: ${SERVER_URL}\n\n`;
  content += 'Test Results Summary:\n\n';
  
  for (const [testName, results] of Object.entries(testResults)) {
    if (results) {
      const status = results.success ? 'PASSED' : 'FAILED';
      content += `${testName.padEnd(20)}: ${status}\n`;
    }
  }
  
  content += '\n=============================================\n';
  content += 'Detailed Results:\n';
  
  for (const [testName, results] of Object.entries(testResults)) {
    if (results) {
      content += `\n----- ${testName} -----\n`;
      content += `Status: ${results.success ? 'PASSED' : 'FAILED'}\n`;
      
      // Include first few lines of output
      if (results.output) {
        const outputLines = results.output.split('\n').slice(0, 10);
        content += 'Output Preview:\n' + outputLines.join('\n') + '\n';
        
        if (results.output.split('\n').length > 10) {
          content += '... (truncated) ...\n';
        }
      }
    }
  }
  
  content += '\n=============================================\n';
  content += 'QA READINESS ASSESSMENT:\n\n';
  
  // Calculate overall readiness
  const testedCategories = Object.values(testResults).filter(result => result !== null);
  const passedCategories = testedCategories.filter(result => result.success);
  const passRate = testedCategories.length > 0 ? (passedCategories.length / testedCategories.length) * 100 : 0;
  
  if (passRate >= 95) {
    content += 'VERDICT: READY FOR PRODUCTION ✅\n';
    content += `${passRate.toFixed(1)}% of test categories passed.\n`;
    content += 'The application meets quality standards for production deployment.\n';
  } else if (passRate >= 80) {
    content += 'VERDICT: NEEDS MINOR FIXES ⚠️\n';
    content += `${passRate.toFixed(1)}% of test categories passed.\n`;
    content += 'The application is close to production-ready but requires attention to failing tests.\n';
  } else {
    content += 'VERDICT: NOT READY FOR PRODUCTION ❌\n';
    content += `${passRate.toFixed(1)}% of test categories passed.\n`;
    content += 'Significant issues must be addressed before deployment.\n';
  }
  
  fs.writeFileSync(filename, content);
  log(`Summary report saved to ${filename}`, 'INFO');
  
  // Also print summary to console
  console.log('\n' + content);
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Test Suite execution failed: ${error.message}`, 'FATAL');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  runE2ETests,
  runLoadTests,
  runDataIntegrityTests,
  runSecurityAssessment,
  runRecoveryTests,
  runCompatibilityTests
};