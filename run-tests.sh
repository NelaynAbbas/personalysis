#!/bin/bash

# Setup colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
print_header() {
  echo -e "\n${YELLOW}========================================"
  echo -e "  $1"
  echo -e "========================================${NC}\n"
}

# Run test command with colorized output
run_command() {
  echo -e "${BLUE}Running: $1${NC}\n"
  eval $1
  
  if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ Tests completed successfully${NC}\n"
    return 0
  else
    echo -e "\n${RED}✗ Tests failed${NC}\n"
    return 1
  fi
}

# Show usage if no arguments provided
if [ $# -eq 0 ]; then
  echo -e "${YELLOW}Usage:${NC} $0 [unit|integration|e2e|all|client|server|watch|coverage|load|bench]"
  exit 1
fi

# Get test type from argument
TEST_TYPE=$1

case $TEST_TYPE in
  unit)
    print_header "UNIT TESTS"
    run_command "npx vitest run"
    ;;
    
  integration)
    print_header "INTEGRATION TESTS"
    run_command "npx vitest run tests/integration"
    ;;
    
  e2e)
    print_header "END-TO-END TESTS"
    run_command "npx vitest run --config vitest.e2e.config.ts"
    ;;
    
  all)
    print_header "ALL TESTS"
    run_command "npx tsx tests/test-runner.ts all"
    ;;
    
  client)
    print_header "CLIENT TESTS"
    run_command "npx vitest run --config vitest.client.config.ts"
    ;;
    
  server)
    print_header "SERVER TESTS"
    run_command "npx vitest run --config vitest.server.config.ts"
    ;;
    
  watch)
    print_header "TESTS (WATCH MODE)"
    run_command "npx vitest"
    ;;
    
  coverage)
    print_header "TESTS WITH COVERAGE"
    run_command "npx vitest run --coverage"
    ;;
    
  load)
    print_header "LOAD TESTS"
    run_command "npx artillery run tests/load/load-test.yml"
    ;;
    
  bench)
    print_header "BENCHMARKS"
    run_command "npx autocannon -c 100 -d 10 -p 10 http://localhost:3000/api/system/performance"
    ;;
    
  *)
    echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
    echo -e "${YELLOW}Valid options:${NC} unit, integration, e2e, all, client, server, watch, coverage, load, bench"
    exit 1
    ;;
esac

exit $?