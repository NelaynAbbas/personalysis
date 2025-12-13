/**
 * Data Validation Module
 *
 * This module provides utilities for validating data integrity
 * using schema validation and business rule enforcement.
 */

import { Pool } from '@neondatabase/serverless';
import { NeonDatabase } from 'drizzle-orm/neon-serverless';
import * as schema from '../../shared/schema';
import { z } from 'zod';
import { Logger } from './Logger';

const logger = new Logger('DataValidation');

// Define the type to match the database with client
type DbWithClient = NeonDatabase<typeof schema> & { $client: Pool };

// Store validation schemas
const validationSchemas: Record<string, z.ZodSchema<any>> = {};

/**
 * Initialize and get validation schemas for all entities
 */
export async function getValidationSchemas(): Promise<Record<string, z.ZodSchema<any>>> {
  if (Object.keys(validationSchemas).length > 0) {
    return validationSchemas;
  }
  
  // Users validation schema
  validationSchemas.users = z.object({
    id: z.number().int().positive(),
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['admin', 'user', 'platform_admin', 'client_admin', 'analyst']),
    createdAt: z.date(),
    updatedAt: z.date().nullable().optional(),
    lastLoginAt: z.date().nullable().optional(),
    status: z.enum(['active', 'inactive', 'suspended']).optional()
  });
  
  // Companies validation schema
  validationSchemas.companies = z.object({
    id: z.number().int().positive(),
    name: z.string().min(2).max(100),
    ownerId: z.number().int().positive().optional(),
    status: z.enum(['active', 'inactive', 'pending', 'archived']),
    createdAt: z.date(),
    updatedAt: z.date().nullable().optional(),
    apiKey: z.string().optional(),
    industry: z.string().optional(),
    size: z.string().optional(),
    website: z.string().url().optional().nullable(),
    contactEmail: z.string().email().optional().nullable()
  });
  
  // Surveys validation schema
  validationSchemas.surveys = z.object({
    id: z.number().int().positive(),
    companyId: z.number().int().positive(),
    title: z.string().min(3).max(200),
    description: z.string().optional(),
    status: z.enum(['draft', 'active', 'closed', 'archived']),
    createdAt: z.date(),
    updatedAt: z.date().nullable().optional(),
    createdById: z.number().int().positive().optional(),
    closedAt: z.date().nullable().optional(),
    settings: z.record(z.unknown()).optional(),
    targetDemographic: z.string().optional()
  });
  
  // Survey responses validation schema
  validationSchemas.survey_responses = z.object({
    id: z.number().int().positive(),
    surveyId: z.number().int().positive(),
    companyId: z.number().int().positive(),
    respondentId: z.string(),
    respondentEmail: z.string().email().nullable().optional(),
    status: z.enum(['started', 'completed', 'abandoned', 'invalid']),
    createdAt: z.date(),
    completedAt: z.date().nullable().optional(),
    responses: z.record(z.unknown()),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
    traits: z.array(z.object({
      trait: z.string(),
      score: z.number().min(0).max(100)
    })).optional()
  });
  
  return validationSchemas;
}

/**
 * Define business rules for entity validation
 */
export const businessRules = {
  users: [
    {
      name: 'admin_role_sanity',
      description: 'Admin users must have proper permissions set',
      validate: (user: any) => {
        return !(user.role === 'admin' && user.permissions === 'basic');
      },
      errorMessage: 'Admin users must have admin permissions'
    },
    {
      name: 'valid_status',
      description: 'User status must be valid based on account activity',
      validate: (user: any) => {
        if (user.status === 'suspended' && (!user.suspendedAt || !user.suspendedReason)) {
          return false;
        }
        return true;
      },
      errorMessage: 'Suspended users must have a suspension timestamp and reason'
    }
  ],
  companies: [
    {
      name: 'active_company_validation',
      description: 'Active companies must have an owner',
      validate: (company: any) => {
        return !(company.status === 'active' && !company.ownerId);
      },
      errorMessage: 'Active companies must have an owner assigned'
    },
    {
      name: 'api_key_requirement',
      description: 'Companies need an API key if they use API integrations',
      validate: (company: any) => {
        return !(company.usesApiIntegration === true && !company.apiKey);
      },
      errorMessage: 'Companies with API integration must have an API key'
    }
  ],
  survey_responses: [
    {
      name: 'complete_response_validation',
      description: 'Completed responses must have all required questions answered',
      validate: (response: any) => {
        if (response.status !== 'completed') return true;
        
        // In a real implementation, this would check required questions
        return Object.keys(response.responses).length > 0;
      },
      errorMessage: 'Completed responses must have all required questions answered'
    },
    {
      name: 'trait_scores_validation',
      description: 'Trait scores must sum to 100 percent',
      validate: (response: any) => {
        if (!response.traits || response.traits.length === 0) return true;
        
        const sum = response.traits.reduce((acc: number, trait: any) => acc + trait.score, 0);
        // Allow for rounding errors
        return sum >= 99 && sum <= 101;
      },
      errorMessage: 'Trait scores must sum to approximately 100%'
    }
  ],
  surveys: [
    {
      name: 'survey_status_validation',
      description: 'Survey status must be consistent with dates',
      validate: (survey: any) => {
        if (survey.status === 'closed' && !survey.closedAt) {
          return false;
        }
        return true;
      },
      errorMessage: 'Closed surveys must have a closedAt date'
    }
  ]
};

/**
 * Validate entity data against schema and business rules
 * @param db Database instance
 * @param entityName Name of the entity to validate
 * @param validationSchema Zod schema to validate against
 * @param sampleSize Optional limit for how many records to validate
 */
export async function validateEntityData(
  db: DbWithClient,
  entityName: string,
  validationSchema: z.ZodSchema<any>,
  sampleSize?: number
): Promise<any> {
  try {
    // Get sample of data to validate
    const limitClause = sampleSize ? `LIMIT ${sampleSize}` : '';
    const { rows } = await db.$client.query(
      `SELECT * FROM ${entityName} ${limitClause}`
    );
    
    if (rows.length === 0) {
      return {
        status: 'success',
        message: 'No data found to validate',
        processedCount: 0,
        schemaValid: true,
        businessRulesValid: true
      };
    }
    
    // Schema validation
    const schemaResults = validateDataAgainstSchema(rows, validationSchema);
    
    // Business rules validation
    const businessRuleResults = validateDataAgainstBusinessRules(rows, entityName);
    
    return {
      status: schemaResults.valid && businessRuleResults.valid ? 'success' : 'issues_found',
      processedCount: rows.length,
      schemaValid: schemaResults.valid,
      schemaErrors: schemaResults.errors,
      businessRulesValid: businessRuleResults.valid,
      businessRuleErrors: businessRuleResults.errors
    };
  } catch (error) {
    logger.error(`Error validating ${entityName} data`, { error });
    throw error;
  }
}

/**
 * Validate array of data records against a Zod schema
 * @param data Array of data records to validate
 * @param schema Zod schema to validate against
 */
function validateDataAgainstSchema(data: any[], schema: z.ZodSchema<any>): {
  valid: boolean;
  errors: any[];
} {
  const errors: any[] = [];
  
  data.forEach((record, index) => {
    try {
      schema.parse(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push({
          recordId: record.id,
          index,
          issues: error.errors
        });
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate array of data records against business rules
 * @param data Array of data records to validate
 * @param entityName Name of the entity to validate
 */
function validateDataAgainstBusinessRules(data: any[], entityName: string): {
  valid: boolean;
  errors: any[];
} {
  const errors: any[] = [];
  
  // Get business rules for this entity
  const rules = businessRules[entityName as keyof typeof businessRules] || [];
  
  data.forEach((record, index) => {
    const recordErrors: any[] = [];
    
    rules.forEach(rule => {
      try {
        if (!rule.validate(record)) {
          recordErrors.push({
            rule: rule.name,
            message: rule.errorMessage
          });
        }
      } catch (error) {
        recordErrors.push({
          rule: rule.name,
          message: `Error evaluating rule: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    });
    
    if (recordErrors.length > 0) {
      errors.push({
        recordId: record.id,
        index,
        issues: recordErrors
      });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a survey response's structure and completeness
 * @param surveyResponse Survey response to validate
 * @param surveyStructure Structure of the survey for validation
 */
export function validateSurveyResponse(surveyResponse: any, surveyStructure: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate required fields
  if (!surveyResponse.surveyId) {
    errors.push('Survey ID is required');
  }
  
  if (!surveyResponse.respondentId) {
    errors.push('Respondent ID is required');
  }
  
  // Check if the response has any answers
  if (!surveyResponse.responses || Object.keys(surveyResponse.responses).length === 0) {
    errors.push('No responses provided');
  }
  
  // Check if all required questions have been answered
  if (surveyStructure && surveyStructure.questions) {
    const requiredQuestionIds = surveyStructure.questions
      .filter(q => q.required)
      .map(q => q.id);
    
    if (surveyResponse.responses) {
      const answeredQuestionIds = Object.keys(surveyResponse.responses);
      
      requiredQuestionIds.forEach(id => {
        if (!answeredQuestionIds.includes(id)) {
          errors.push(`Required question ${id} not answered`);
        }
      });
    }
  }
  
  // Validate trait scores if they exist
  if (surveyResponse.traits && surveyResponse.traits.length > 0) {
    // Check if trait scores are valid (0-100)
    surveyResponse.traits.forEach((trait: any) => {
      if (trait.score < 0 || trait.score > 100) {
        errors.push(`Trait score for ${trait.trait} must be between 0 and 100`);
      }
    });
    
    // Check if trait scores sum to approximately 100%
    const sum = surveyResponse.traits.reduce((acc: number, trait: any) => acc + trait.score, 0);
    if (sum < 99 || sum > 101) {
      errors.push(`Trait scores must sum to approximately 100% (current sum: ${sum})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}