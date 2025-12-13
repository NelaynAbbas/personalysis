/**
 * Test Runner
 * 
 * This script provides a centralized way to run different types of tests.
 * Usage: npx tsx tests/test-runner.ts [unit|integration|e2e|load|all]
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Default test type
let testType = process.argv[2] || 'unit';

// Validate test type
const validTypes = ['unit', 'integration', 'e2e', 'load', 'all'];
if (!validTypes.includes(testType)) {
  console.error(`Invalid test type: ${testType}`);
  console.error(`Valid options are: ${validTypes.join(', ')}`);
  process.exit(1);
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper to run commands with live output
function runCommand(command: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    console.log(`${colors.bright}${colors.cyan}Running: ${command} ${args.join(' ')}${colors.reset}\n`);
    
    const proc = spawn(command, args, { 
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`\n${colors.green}✓ Command completed successfully${colors.reset}\n`);
        resolve(0);
      } else {
        console.error(`\n${colors.red}✗ Command failed with code ${code}${colors.reset}\n`);
        resolve(code || 1);
      }
    });
    
    proc.on('error', (err) => {
      console.error(`\n${colors.red}✗ Command failed to start: ${err}${colors.reset}\n`);
      reject(err);
    });
  });
}

// Header for test output
function printHeader(text: string) {
  const line = '='.repeat(text.length + 8);
  console.log(`\n${colors.bright}${colors.yellow}${line}${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}==  ${text}  ==${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}${line}${colors.reset}\n`);
}

// Run unit tests
async function runUnitTests(): Promise<number> {
  printHeader('RUNNING UNIT TESTS');
  return runCommand('npx', ['vitest', 'run', '--config', 'vitest.config.ts']);
}

// Run integration tests
async function runIntegrationTests(): Promise<number> {
  printHeader('RUNNING INTEGRATION TESTS');
  return runCommand('npx', ['vitest', 'run', 'tests/integration']);
}

// Run E2E tests
async function runE2ETests(): Promise<number> {
  printHeader('RUNNING E2E TESTS');
  
  // We don't need to explicitly start a server here
  // The E2E test file will directly use the test-server module
  
  // Tell the E2E tests to use the in-memory test server
  process.env.USE_IN_MEMORY_TEST_SERVER = 'true';
  
  try {
    // Run the tests
    const result = await runCommand('npx', ['vitest', 'run', '--config', 'vitest.e2e.config.ts']);
    return result;
  } finally {
    // Clear the environment variable
    delete process.env.USE_IN_MEMORY_TEST_SERVER;
  }
}

// Run load tests
async function runLoadTests(): Promise<number> {
  printHeader('RUNNING LOAD TESTS (Basic Artillery)');
  return runCommand('npx', ['artillery', 'run', 'tests/load/load-test.yml']);
}

// Run test by type
async function runTest(type: string): Promise<number> {
  switch (type) {
    case 'unit':
      return runUnitTests();
    case 'integration':
      return runIntegrationTests();
    case 'e2e':
      return runE2ETests();
    case 'load':
      return runLoadTests();
    default:
      console.error(`Unknown test type: ${type}`);
      return 1;
  }
}

// Main execution
async function main() {
  try {
    if (testType === 'all') {
      // Run all tests in sequence
      const results: number[] = [];
      results.push(await runUnitTests());
      results.push(await runIntegrationTests());
      results.push(await runE2ETests());
      
      // Summarize results
      const totalFailed = results.filter(code => code !== 0).length;
      if (totalFailed > 0) {
        console.error(`\n${colors.red}${colors.bright}${totalFailed} test suites failed${colors.reset}`);
        process.exit(1);
      } else {
        console.log(`\n${colors.green}${colors.bright}All test suites passed!${colors.reset}`);
        process.exit(0);
      }
    } else {
      // Run a specific test type
      const result = await runTest(testType);
      process.exit(result);
    }
  } catch (error) {
    console.error(`\n${colors.red}Error running tests: ${error}${colors.reset}`);
    process.exit(1);
  }
}

// Run the main function
main();