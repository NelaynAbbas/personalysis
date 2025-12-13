# PersonalysisPro Testing Guide

This document provides instructions on how to run the various tests for the PersonalysisPro application. These tests ensure the application is production-ready by validating functionality, performance, security, data integrity, and compatibility.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Test Suite Overview](#test-suite-overview)
- [Running All Tests](#running-all-tests)
- [Running Individual Test Categories](#running-individual-test-categories)
- [Test Reports](#test-reports)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)
- [Continuous Integration](#continuous-integration)

## Prerequisites

Before running tests, ensure you have the following:

1. Node.js 16 or higher
2. A running instance of the PersonalysisPro application
3. PostgreSQL database with test data
4. Required environment variables set:
   - `DATABASE_URL`: Connection string for the database
   - `TEST_URL` (optional): URL of the running application (defaults to http://localhost:5000)
   - `TEST_MODE` (optional): Type of tests to run (defaults to 'all')

For browser compatibility tests, you'll also need:
- Playwright browsers installed: `npx playwright install`

## Test Suite Overview

The PersonalysisPro test suite consists of the following categories:

1. **End-to-End Tests**: Functional tests that validate complete user journeys.
2. **Load Tests**: Performance tests that simulate high traffic conditions.
3. **Security Tests**: Tests that check for vulnerabilities and security best practices.
4. **Data Integrity Tests**: Tests that verify database consistency and data operations.
5. **Recovery Tests**: Tests that validate system resilience and failover capabilities.
6. **Compatibility Tests**: Tests that ensure the application works across browsers and devices.

## Running All Tests

To run the complete test suite:

```bash
node tests/run-qa-tests.js
```

This will execute all test categories and generate a comprehensive report. The process may take 15-20 minutes to complete.

## Running Individual Test Categories

To run specific test categories, set the `TEST_MODE` environment variable:

```bash
# End-to-End Tests
TEST_MODE=e2e node tests/run-qa-tests.js

# Load Tests
TEST_MODE=load node tests/run-qa-tests.js

# Security Tests
TEST_MODE=security node tests/run-qa-tests.js

# Data Integrity Tests
TEST_MODE=data node tests/run-qa-tests.js

# Recovery Tests
TEST_MODE=recovery node tests/run-qa-tests.js

# Compatibility Tests
TEST_MODE=compatibility node tests/run-qa-tests.js
```

## Test Reports

All test reports are generated in the `test-reports` directory:

- Individual test results are saved as `{test-category}-results-{timestamp}.txt`
- A summary report is saved as `qa-summary-report-{timestamp}.txt`

The summary report includes:
- Overall test results
- Brief output from each test category
- A production readiness assessment

## Troubleshooting Common Issues

### Database Connection Issues

If tests fail due to database connection issues:
1. Verify the `DATABASE_URL` environment variable is correct
2. Ensure the database server is running
3. Check network connectivity between the test environment and database server

### Browser Compatibility Test Failures

If browser compatibility tests fail:
1. Ensure Playwright browsers are installed: `npx playwright install`
2. Check for browser-specific errors in the test output
3. Verify the application is running and accessible at the test URL

### Load Test Failures

If load tests fail:
1. Check if the application is properly configured for the expected load
2. Verify the server has sufficient resources
3. Check for any rate limiting that might be affecting the tests

## Continuous Integration

To run tests in a CI/CD pipeline:

1. Set up the required environment variables in your CI environment
2. Install dependencies: `npm ci`
3. Run the appropriate test command: `node tests/run-qa-tests.js`
4. Configure your CI tool to treat the process exit code as test success/failure

Example GitHub Actions workflow:

```yaml
jobs:
  qa-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Start application
        run: npm run dev &
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - name: Wait for application startup
        run: sleep 30
      - name: Run QA tests
        run: node tests/run-qa-tests.js
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          TEST_URL: http://localhost:5000
      - name: Upload test reports
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: test-reports/
```

## Interpreting Test Results

The summary report includes a "QA READINESS ASSESSMENT" section that provides an overall assessment of the application's production readiness:

- **READY FOR PRODUCTION** (≥95% pass rate): The application meets quality standards for production deployment.
- **NEEDS MINOR FIXES** (80-94% pass rate): The application is close to production-ready but requires attention to failing tests.
- **NOT READY FOR PRODUCTION** (<80% pass rate): Significant issues must be addressed before deployment.

For any failing tests, check the detailed test output and address the identified issues before deployment.