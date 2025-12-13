import { type SurveyResponse, type Survey } from '../../shared/schema';
import crypto from 'crypto';

/**
 * Anonymize a single survey response
 * @param response The survey response to anonymize
 * @returns The anonymized survey response
 */
export function anonymizeSingleResponse(response: SurveyResponse): SurveyResponse {
  if (!response) return response;
  
  // Create a deep copy
  const anonymized = JSON.parse(JSON.stringify(response)) as SurveyResponse;
  
  // Replace personal identifiable information
  if (anonymized.respondentEmail) {
    // Hash email for consistent anonymization (same email always hashes to same value)
    const hash = crypto.createHash('sha256').update(anonymized.respondentEmail).digest('hex');
    anonymized.respondentEmail = `anon-${hash.substring(0, 8)}@example.com`;
  }
  
  // Remove IP address completely
  anonymized.ipAddress = null;
  
  // Anonymize demographics data
  if (anonymized.demographics && typeof anonymized.demographics === 'object') {
    const demographics = anonymized.demographics as Record<string, any>;
    
    // Generalize age ranges
    if (demographics.age) {
      const age = Number(demographics.age);
      if (!isNaN(age)) {
        // Convert precise age to age range
        if (age < 25) demographics.age = 'Under 25';
        else if (age < 35) demographics.age = '25-34';
        else if (age < 45) demographics.age = '35-44';
        else if (age < 55) demographics.age = '45-54';
        else if (age < 65) demographics.age = '55-64';
        else demographics.age = '65+';
      }
    }
    
    // Generalize location data if present
    if (demographics.city || demographics.postalCode) {
      // Keep only region/state and country
      demographics.city = null;
      demographics.postalCode = null;
      
      // Only keep higher-level location data
      if (demographics.address) {
        demographics.address = null;
      }
    }
    
    // Remove any other sensitive information
    const sensitiveFields = [
      'phoneNumber', 'phone', 'ssn', 'socialSecurityNumber',
      'dob', 'dateOfBirth', 'birthDate', 'fullName'
    ];
    
    sensitiveFields.forEach(field => {
      if (field in demographics) {
        demographics[field] = null;
      }
    });
    
    anonymized.demographics = demographics;
  }
  
  // Remove or anonymize potentially sensitive free-text responses
  if (anonymized.responses) {
    let responseData = anonymized.responses;
    
    if (typeof responseData === 'string') {
      try {
        // Parse stringified JSON responses
        responseData = JSON.parse(responseData);
      } catch (e) {
        console.error('Error parsing response data during anonymization:', e);
        // If we can't parse it, keep as is
      }
    }
    
    if (Array.isArray(responseData)) {
      // Handle array-based response format (questionId, answer)
      responseData = responseData.map(item => {
        if (item && typeof item === 'object' && 'answer' in item) {
          const answer = item.answer;
          
          // If it's a long text response, it might contain personal information
          if (typeof answer === 'string' && answer.length > 100) {
            return {
              ...item,
              answer: answer.substring(0, 100) + '... [redacted for privacy]'
            };
          }
        }
        return item;
      });
    } else if (typeof responseData === 'object') {
      // Handle record/object-based response format
      Object.keys(responseData).forEach(key => {
        const value = responseData[key];
        
        // If it's a long text response, it might contain personal information
        if (typeof value === 'string' && value.length > 100) {
          responseData[key] = value.substring(0, 100) + '... [redacted for privacy]';
        }
      });
    }
    
    // Update the anonymized responses
    anonymized.responses = typeof anonymized.responses === 'string' 
      ? JSON.stringify(responseData) 
      : responseData;
  }
  
  // Flag as anonymized
  (anonymized as any).isAnonymized = true;
  
  return anonymized;
}

/**
 * Anonymize an array of survey responses
 * @param responses Array of survey responses to anonymize
 * @returns Array of anonymized survey responses
 */
export function anonymizeResponses(responses: SurveyResponse[]): SurveyResponse[] {
  if (!responses || !Array.isArray(responses)) return [];
  return responses.map(response => anonymizeSingleResponse(response));
}

/**
 * Check if a user has permission to export survey responses
 * @param req Express request object
 * @param companyId Optional company ID to check permission against
 * @returns Boolean indicating whether the user has export permission
 */
export async function checkExportPermission(req: any, companyId?: number): Promise<boolean> {
  // Check for admin role in headers (used for testing/development)
  if (req.headers['x-mock-admin'] === 'true' || req.headers['x-user-role'] === 'platform_admin') {
    return true;
  }
  
  // For actual production implementation, check company permissions in DB
  if (companyId) {
    try {
      // Simple implementation - in a real system, would check user's company access
      // and verify the company's data_export feature flag
      const { db } = require('../db');
      const { companies, eq } = require('../../shared/schema');
      
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
        columns: {
          dataExport: true
        }
      });
      
      return company && company.dataExport === true;
    } catch (error) {
      console.error('Error checking export permission:', error);
      return false;
    }
  }
  
  // Default to no permission
  return false;
}

/**
 * Validate a survey response against required fields and business rules
 * @param response Survey response to validate
 * @param survey Survey metadata including questions
 * @returns Validation results
 */
export function validateSurveyResponse(response: SurveyResponse, survey: Survey & { questions?: any[] }): {
  valid: boolean;
  errors?: Record<string, string[]>;
} {
  if (!response || !survey) {
    return { 
      valid: false,
      errors: { general: ['Invalid survey response or survey data'] }
    };
  }
  
  const errors: Record<string, string[]> = {};
  
  // Validate required fields
  if (!response.responses || typeof response.responses !== 'object') {
    errors.responses = ['No response data found'];
    return { valid: false, errors };
  }
  
  // Check for required email if survey requires it
  if (survey.requireEmail && !response.respondentEmail) {
    errors.respondentEmail = ['Email is required for this survey'];
  }
  
  // Validate against required questions
  if (survey.questions && Array.isArray(survey.questions)) {
    // Handle both array format and record format for responses
    let responseArray: Array<{questionId: number, answer: string}> = [];
    
    if (Array.isArray(response.responses)) {
      responseArray = response.responses;
    } else if (typeof response.responses === 'string') {
      try {
        // The response might be a stringified JSON
        responseArray = JSON.parse(response.responses);
      } catch (e) {
        console.error('Error parsing response data:', e);
        errors.responses = ['Invalid response data format'];
        return { valid: false, errors };
      }
    } else {
      // Handle object format if present
      const responseData = response.responses as Record<string, any>;
      responseArray = Object.keys(responseData).map(key => ({
        questionId: parseInt(key),
        answer: responseData[key]
      }));
    }
    
    // Create a map for easier lookup
    const answeredQuestions = new Map();
    responseArray.forEach(item => {
      if (item && item.questionId) {
        answeredQuestions.set(item.questionId.toString(), item.answer);
      }
    });
    
    survey.questions.forEach(question => {
      if (question.required) {
        const questionId = question.id.toString();
        
        // Check if the question was answered
        if (!answeredQuestions.has(questionId) || !answeredQuestions.get(questionId)) {
          if (!errors[questionId]) errors[questionId] = [];
          errors[questionId].push('This question requires an answer');
        }
        
        // Apply additional custom validation if specified
        if (question.customValidation && answeredQuestions.has(questionId)) {
          try {
            const validationRule = question.customValidation;
            const value = answeredQuestions.get(questionId);
            
            // Implement custom validation based on the rule
            // Here's a simple implementation for common validation types
            if (validationRule === 'email' && typeof value === 'string') {
              // Basic email validation
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                if (!errors[questionId]) errors[questionId] = [];
                errors[questionId].push('Invalid email format');
              }
            } else if (validationRule === 'number' && isNaN(Number(value))) {
              if (!errors[questionId]) errors[questionId] = [];
              errors[questionId].push('Must be a valid number');
            }
            // Add more validation types as needed
          } catch (validationError) {
            console.error('Validation error:', validationError);
            if (!errors[questionId]) errors[questionId] = [];
            errors[questionId].push('Validation error');
          }
        }
      }
    });
  }
  
  // Validate demographics if required
  if (survey.collectDemographics) {
    if (!response.demographics || typeof response.demographics !== 'object') {
      errors.demographics = ['Demographics data is required for this survey'];
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  };
}

/**
 * Generate CSV data from survey responses
 * @param responses Array of survey responses
 * @param surveyInfo Optional survey metadata
 * @returns CSV formatted string
 */
export function generateCSV(responses: any[], surveyInfo: any | null): string {
  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return 'No data';
  }
  
  // Start with CSV header row
  let csvData = '';
  
  // Add metadata header if survey info is available
  if (surveyInfo) {
    csvData += `# Survey: ${surveyInfo.title || 'Untitled'}\n`;
    
    if (surveyInfo.description) {
      csvData += `# Description: ${surveyInfo.description}\n`;
    }
    
    csvData += `# Export Date: ${new Date().toISOString()}\n`;
    csvData += `# Total Responses: ${responses.length}\n`;
    csvData += '#\n'; // Empty line to separate metadata from data
  }
  
  // Get all possible columns from all responses
  const columns = new Set<string>();
  responses.forEach(response => {
    // Add standard fields
    columns.add('id');
    columns.add('surveyId');
    columns.add('companyId');
    columns.add('respondentId');
    columns.add('respondentEmail');
    columns.add('ipAddress');
    columns.add('source');
    columns.add('startTime');
    columns.add('completeTime');
    columns.add('createdAt');
    
    // Add fields from responses
    if (response.responses && typeof response.responses === 'object') {
      Object.keys(response.responses).forEach(key => {
        columns.add(`response_${key}`);
      });
    }
    
    // Add traits
    if (response.traits && typeof response.traits === 'object') {
      Object.keys(response.traits).forEach(key => {
        columns.add(`trait_${key}`);
      });
    }
    
    // Add demographics
    if (response.demographics && typeof response.demographics === 'object') {
      Object.keys(response.demographics).forEach(key => {
        columns.add(`demographic_${key}`);
      });
    }
  });
  
  // Convert columns to array and sort for consistent output
  const columnArray = Array.from(columns).sort();
  
  // Add header row
  csvData += columnArray.join(',') + '\n';
  
  // Add data rows
  responses.forEach(response => {
    const rowData: string[] = [];
    
    columnArray.forEach(column => {
      let value = '';
      
      if (column.startsWith('response_') && response.responses) {
        const key = column.replace('response_', '');
        value = response.responses[key] || '';
      } else if (column.startsWith('trait_') && response.traits) {
        const key = column.replace('trait_', '');
        value = response.traits[key] || '';
      } else if (column.startsWith('demographic_') && response.demographics) {
        const key = column.replace('demographic_', '');
        value = response.demographics[key] || '';
      } else {
        value = response[column] || '';
      }
      
      // Format value for CSV (escape quotes, handle commas)
      if (typeof value === 'string') {
        // Escape double quotes with double double quotes
        value = value.replace(/"/g, '""');
        
        // If value contains comma or newline, wrap in quotes
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          value = `"${value}"`;
        }
      } else if (typeof value === 'object') {
        // Convert objects to JSON string
        value = `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      rowData.push(String(value));
    });
    
    csvData += rowData.join(',') + '\n';
  });
  
  return csvData;
}