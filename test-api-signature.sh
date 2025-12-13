#!/bin/bash

# Test script for API signature verification
# This script uses curl to send API requests with proper signatures
# to test the API signature verification middleware

# Define variables
API_URL="http://localhost:5000"
API_SECRET="development-signing-secret"  # Same as in csrfMiddleware.ts API_SIGNING_SECRET default
CSRF_TOKEN=""  # Will be populated after login

# Function to retrieve a CSRF token
get_csrf_token() {
  echo "Getting CSRF token..."
  
  # Call the CSRF token endpoint
  local response=$(curl -s "${API_URL}/api/auth/csrf-token")
  echo "Response: $response"
  
  # Extract token from JSON response - check for both token and csrfToken keys
  CSRF_TOKEN=$(echo "$response" | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)
  
  if [[ -z "$CSRF_TOKEN" ]]; then
    # Try alternative format
    CSRF_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  fi
  
  if [[ -n "$CSRF_TOKEN" ]]; then
    echo "CSRF token obtained: ${CSRF_TOKEN:0:10}..."
  else
    echo "Failed to get CSRF token"
    echo "Response was: $response"
  fi
}

# Function to generate API signature
# Arguments:
#   $1 - HTTP method (GET, POST, etc.)
#   $2 - API path
#   $3 - Request body or query string (optional)
generate_signature() {
  local method=$1
  local path=$2
  local body=$3
  local timestamp=$(date +%s)
  
  # Create string to sign
  local string_to_sign="${method}:${path}:${timestamp}"
  if [[ -n "$body" ]]; then
    string_to_sign="${string_to_sign}:${body}"
  fi
  
  # Generate signature with proper openssl format
  local signature=$(echo -n "$string_to_sign" | openssl dgst -sha256 -hmac "$API_SECRET" -hex | sed 's/^.* //')
  
  echo "Timestamp: $timestamp"
  echo "Signature: $signature"
  echo "String to sign: $string_to_sign"
  
  # Return result for use in other functions
  echo "timestamp=$timestamp"
  echo "signature=$signature"
}

# Perform a GET request with API signature
test_get_request() {
  local path=$1
  local query=$2
  local full_path="${path}"
  
  # Add query parameters if provided
  if [[ -n "$query" ]]; then
    full_path="${path}?${query}"
  fi
  
  echo "Testing GET request to $full_path"
  
  # Generate signature
  local result=$(generate_signature "GET" "$path" "$query")
  local timestamp=$(echo "$result" | grep "timestamp=" | cut -d'=' -f2)
  local signature=$(echo "$result" | grep "signature=" | cut -d'=' -f2)
  
  echo "Sending request..."
  curl -s -X GET "${API_URL}${full_path}" \
    -H "X-API-Timestamp: $timestamp" \
    -H "X-API-Signature: $signature" \
    -H "Content-Type: application/json"
  
  echo -e "\n"
}

# Perform a POST request with API signature
test_post_request() {
  local path=$1
  local body=$2
  local use_csrf=$3
  
  echo "Testing POST request to $path"
  
  # Generate signature
  local result=$(generate_signature "POST" "$path" "$body")
  local timestamp=$(echo "$result" | grep "timestamp=" | cut -d'=' -f2)
  local signature=$(echo "$result" | grep "signature=" | cut -d'=' -f2)
  
  # Set up headers
  local headers=()
  headers+=("-H" "X-API-Timestamp: $timestamp")
  headers+=("-H" "X-API-Signature: $signature")
  headers+=("-H" "Content-Type: application/json")
  
  # Add CSRF token if needed
  if [[ "$use_csrf" == "true" && -n "$CSRF_TOKEN" ]]; then
    headers+=("-H" "X-CSRF-Token: $CSRF_TOKEN")
    echo "Using CSRF token: ${CSRF_TOKEN:0:10}..."
  fi
  
  echo "Sending request..."
  curl -s -X POST "${API_URL}${path}" "${headers[@]}" -d "$body"
  
  echo -e "\n"
}

# Perform a POST request without API signature but with CSRF token
test_csrf_post() {
  local path=$1
  local body=$2
  
  echo "Testing POST request with only CSRF protection to $path"
  
  # Set up headers
  local headers=()
  headers+=("-H" "Content-Type: application/json")
  
  # Add CSRF token if available
  if [[ -n "$CSRF_TOKEN" ]]; then
    headers+=("-H" "X-CSRF-Token: $CSRF_TOKEN")
    echo "Using CSRF token: ${CSRF_TOKEN:0:10}..."
  else
    echo "Warning: No CSRF token available"
  fi
  
  echo "Sending request..."
  curl -s -X POST "${API_URL}${path}" "${headers[@]}" -d "$body"
  
  echo -e "\n"
}

# Perform a POST request without any security tokens (should fail)
test_unsafe_post() {
  local path=$1
  local body=$2
  
  echo "Testing unsafe POST request to $path (should fail)"
  
  echo "Sending request..."
  curl -s -X POST "${API_URL}${path}" \
    -H "Content-Type: application/json" \
    -d "$body"
  
  echo -e "\n"
}

# Comprehensive test suite for API security
run_comprehensive_tests() {
  echo "=== Running Comprehensive Security Tests ==="
  echo "======================================================="
  
  # Step 1: Get CSRF token first
  echo "Step 1: Obtaining CSRF token..."
  get_csrf_token
  echo "======================================================="
  
  # Step 2: Test API endpoints with different security combinations
  echo "Step 2: Testing API endpoints with different security configurations..."
  
  # Test 2.1: Login with API signature only
  echo -e "\nTest 2.1: Login with API signature only"
  test_post_request "/api/auth/login" '{"username":"admin","password":"admin123"}' "false"
  
  # Test 2.2: Login with API signature + CSRF token
  echo -e "\nTest 2.2: Login with API signature + CSRF token"
  test_post_request "/api/auth/login" '{"username":"admin","password":"admin123"}' "true"
  
  # Test 2.3: Login with CSRF token only
  echo -e "\nTest 2.3: Login with CSRF token only"
  test_csrf_post "/api/auth/login" '{"username":"admin","password":"admin123"}'
  
  # Test 2.4: Login with no security (should fail)
  echo -e "\nTest 2.4: Login with no security (should fail with 403)"
  test_unsafe_post "/api/auth/login" '{"username":"admin","password":"admin123"}'
  
  # Test 2.5: Test GET request with API signature
  echo -e "\nTest 2.5: GET request with API signature"
  test_get_request "/api/auth/me"
  echo "======================================================="
  
  # Step 3: Test API endpoints that require authentication
  echo "Step 3: Testing endpoints that require authentication..."
  
  # Test 3.1: Create survey with API signature + CSRF
  echo -e "\nTest 3.1: Create survey with API signature + CSRF"
  test_post_request "/api/surveys" '{"title":"Test Survey","description":"Created via API signature test"}' "true"
  
  # Test 3.2: Create survey with CSRF only
  echo -e "\nTest 3.2: Create survey with CSRF only"
  test_csrf_post "/api/surveys" '{"title":"Test Survey 2","description":"Created via CSRF test"}'
  
  # Test 3.3: Create survey with no security (should fail)
  echo -e "\nTest 3.3: Create survey with no security (should fail)"
  test_unsafe_post "/api/surveys" '{"title":"Test Survey 3","description":"Should fail"}'
  echo "======================================================="
  
  # Step 4: Test replay attack prevention
  echo "Step 4: Testing replay attack prevention..."
  
  # Generate signature but don't use it right away
  echo -e "\nGenerating signature for delayed request (simulating replay attack)..."
  local result=$(generate_signature "POST" "/api/auth/login" '{"username":"admin","password":"admin123"}')
  local timestamp=$(echo "$result" | grep "timestamp=" | cut -d'=' -f2)
  local signature=$(echo "$result" | grep "signature=" | cut -d'=' -f2)
  
  # Sleep to allow the signature to expire
  echo "Waiting 5 seconds to simulate delay in replay attack..."
  sleep 5
  
  # Now try to use the expired signature
  echo -e "\nAttempting to use expired signature (should fail):"
  curl -s -X POST "${API_URL}/api/auth/login" \
    -H "X-API-Timestamp: $timestamp" \
    -H "X-API-Signature: $signature" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}'
  
  echo -e "\n======================================================="
  echo "Tests completed."
}

# Execute the comprehensive test suite
run_comprehensive_tests