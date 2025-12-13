import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './errorHandler';

/**
 * Middleware for validating request data using Zod schemas
 * @param schema The Zod schema to validate against
 * @returns Middleware function that validates request body against the schema
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse the request body against the schema
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        // Format the validation errors
        const errors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        
        next(
          new AppError(
            'Validation failed. Please check your input.',
            400,
            errors
          )
        );
      } else {
        // Pass through other errors
        next(error);
      }
    }
  };
};

/**
 * Middleware for validating query parameters using Zod schemas
 * @param schema The Zod schema to validate against
 * @returns Middleware function that validates request query against the schema
 */
export const validateQuery = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse the query parameters against the schema
      await schema.parseAsync(req.query);
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        // Format the validation errors
        const errors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        
        next(
          new AppError(
            'Query validation failed. Please check your parameters.',
            400,
            errors
          )
        );
      } else {
        // Pass through other errors
        next(error);
      }
    }
  };
};

/**
 * Middleware for validating URL parameters using Zod schemas
 * @param schema The Zod schema to validate against
 * @returns Middleware function that validates request params against the schema
 */
export const validateParams = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse the URL parameters against the schema
      await schema.parseAsync(req.params);
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        // Format the validation errors
        const errors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        
        next(
          new AppError(
            'Parameter validation failed. Please check your request.',
            400,
            errors
          )
        );
      } else {
        // Pass through other errors
        next(error);
      }
    }
  };
};

/**
 * Helper function to create a validation error outside of middleware
 * @param errors Object containing validation errors
 * @returns AppError instance with validation errors
 */
export const createValidationError = (errors: Record<string, string[]>) => {
  return new AppError('Validation failed', 400, errors);
};