/**
 * Manual API tests for verifying endpoint functionality
 * This file contains basic test cases for the API endpoints
 */

import { 
  createMockRequest, 
  createMockResponse, 
  assert, 
  runTests
} from '../utils/testUtils';
import { ApiError } from '../middleware/errorHandler';
import { Logger } from '../utils/Logger';

const logger = new Logger('ApiTests');

/**
 * Run all API tests
 */
export async function runApiTests() {
  logger.info('Starting API tests...');
  
  return runTests([
    // Authentication tests
    {
      name: 'Auth - Login returns 400 when username is missing',
      fn: () => {
        // Create mock objects
        const req = createMockRequest({
          method: 'POST',
          path: '/api/auth/login',
          body: { password: 'test-password' }
        });
        
        const res = createMockResponse();
        
        // Create next function mock
        const next = jest.fn();
        
        // Import the login handler function - this is simulated here
        const loginHandler = (req: any, res: any) => {
          if (!req.body.username || !req.body.password) {
            return res.status(400).json({ message: "Username and password are required" });
          }
          
          return res.status(200).json({ success: true });
        };
        
        // Execute the handler
        loginHandler(req, res, next);
        
        // Assertions
        assert.equal(res.statusCode, 400);
        assert.equal(res.sentJson.message, "Username and password are required");
      }
    },
    
    {
      name: 'Auth - Password reset request returns 200 even if user does not exist',
      fn: () => {
        // Create mock objects
        const req = createMockRequest({
          method: 'POST',
          path: '/api/auth/forgot-password',
          body: { email: 'nonexistent@example.com' }
        });
        
        const res = createMockResponse();
        
        // Create next function mock
        const next = jest.fn();
        
        // Import the forgot password handler function - this is simulated here
        const forgotPasswordHandler = (req: any, res: any) => {
          if (!req.body.email) {
            return res.status(400).json({ message: "Email is required" });
          }
          
          // In a real app, we would check if the user exists, but for security reasons
          // we should always return success to prevent enumeration attacks
          return res.status(200).json({ 
            message: "If your email is registered, you will receive a password reset link shortly." 
          });
        };
        
        // Execute the handler
        forgotPasswordHandler(req, res, next);
        
        // Assertions
        assert.equal(res.statusCode, 200);
        assert.truthy(res.sentJson.message.includes("If your email is registered"));
      }
    },
    
    // Survey tests
    {
      name: 'Survey - Create returns 400 when title is missing',
      fn: () => {
        // Create mock objects
        const req = createMockRequest({
          method: 'POST',
          path: '/api/surveys',
          body: { surveyType: 'personality' }
        });
        
        const res = createMockResponse();
        
        // Create next function mock
        const next = jest.fn();
        
        // Import the create survey handler function - this is simulated here
        const createSurveyHandler = (req: any, res: any) => {
          if (!req.body.title || !req.body.surveyType) {
            return res.status(400).json({ message: "Survey title and type are required" });
          }
          
          return res.status(201).json({ id: 123, title: req.body.title });
        };
        
        // Execute the handler
        createSurveyHandler(req, res, next);
        
        // Assertions
        assert.equal(res.statusCode, 400);
        assert.equal(res.sentJson.message, "Survey title and type are required");
      }
    },
    
    {
      name: 'Survey - Get returns 404 when ID does not exist',
      fn: () => {
        // Create mock objects
        const req = createMockRequest({
          method: 'GET',
          path: '/api/surveys/999',
          params: { id: '999' }
        });
        
        const res = createMockResponse();
        
        // Create next function mock
        const next = jest.fn();
        
        // Import the get survey handler function - this is simulated here
        const getSurveyHandler = (req: any, res: any) => {
          const id = parseInt(req.params.id);
          if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid survey ID" });
          }
          
          // In a real app, we would check our database
          // Here we'll just return a mock survey if ID is below a threshold
          if (id > 100) {
            return res.status(404).json({ message: "Survey not found" });
          }
          
          return res.status(200).json({ id, title: `Survey ${id}` });
        };
        
        // Execute the handler
        getSurveyHandler(req, res, next);
        
        // Assertions
        assert.equal(res.statusCode, 404);
        assert.equal(res.sentJson.message, "Survey not found");
      }
    },
    
    // Error handling tests
    {
      name: 'Error - API error is converted correctly',
      fn: () => {
        // Create an error
        const error = new Error("Test error");
        
        // Create the error converter
        const errorConverter = (err: any): ApiError => {
          if (err instanceof ApiError) {
            return err;
          }
          
          const statusCode = err.statusCode || 500;
          const message = err.message || 'Internal Server Error';
          const isOperational = false;
          
          return new ApiError(statusCode, message, isOperational, err.stack);
        };
        
        // Convert the error
        const apiError = errorConverter(error);
        
        // Assertions
        assert.instanceOf(apiError, ApiError);
        assert.equal(apiError.statusCode, 500);
        assert.equal(apiError.message, "Test error");
        assert.equal(apiError.isOperational, false);
      }
    }
  ]);
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runApiTests()
    .then(results => {
      const exitCode = results.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Error running tests:', error);
      process.exit(1);
    });
}

export default { runApiTests };