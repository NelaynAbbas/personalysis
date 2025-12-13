import { z } from 'zod';
import logger from './logger';

/**
 * Common validation patterns used throughout the application
 * Centralizing these makes validation consistent and maintainable
 */

// Email validation with detailed error messages
export const emailSchema = z
  .string()
  .min(1, { message: 'Email is required' })
  .email({ message: 'Please enter a valid email address' })
  .refine(
    (email) => !email.endsWith('.con'), 
    { message: 'Did you mean to type .com instead of .con?' }
  )
  .refine(
    (email) => !/\s/.test(email),
    { message: 'Email cannot contain spaces' }
  );

// Password validation with strength requirements
export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(100, { message: 'Password is too long' })
  .refine(
    (password) => /[A-Z]/.test(password),
    { message: 'Password must contain at least one uppercase letter' }
  )
  .refine(
    (password) => /[a-z]/.test(password),
    { message: 'Password must contain at least one lowercase letter' }
  )
  .refine(
    (password) => /[0-9]/.test(password),
    { message: 'Password must contain at least one number' }
  )
  .refine(
    (password) => /[^A-Za-z0-9]/.test(password),
    { message: 'Password must contain at least one special character' }
  );

// URL validation
export const urlSchema = z
  .string()
  .min(1, { message: 'URL is required' })
  .url({ message: 'Please enter a valid URL' })
  .refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    { message: 'URL must start with http:// or https://' }
  );

// Phone number validation with formatting
export const phoneSchema = z
  .string()
  .min(1, { message: 'Phone number is required' })
  .refine(
    (phone) => /^(\+?[0-9]{1,3}[ -]?)?(\([0-9]{1,5}\)[ -]?)?[0-9]{1,14}$/.test(phone),
    { message: 'Please enter a valid phone number' }
  );

// Name validation (for first name, last name, etc.)
export const nameSchema = z
  .string()
  .min(2, { message: 'Name must be at least 2 characters' })
  .max(50, { message: 'Name is too long' })
  .refine(
    (name) => /^[A-Za-z ,.'-]+$/.test(name),
    { message: 'Name contains invalid characters' }
  );

// Company name validation
export const companyNameSchema = z
  .string()
  .min(2, { message: 'Company name must be at least 2 characters' })
  .max(100, { message: 'Company name is too long' });

// Job title validation
export const jobTitleSchema = z
  .string()
  .min(2, { message: 'Job title must be at least 2 characters' })
  .max(100, { message: 'Job title is too long' });

// Username validation
export const usernameSchema = z
  .string()
  .min(3, { message: 'Username must be at least 3 characters' })
  .max(30, { message: 'Username is too long' })
  .refine(
    (username) => /^[a-zA-Z0-9_.-]+$/.test(username),
    { message: 'Username can only contain letters, numbers, underscores, dots, and hyphens' }
  );

// Date validation (must be a valid date and not in the future)
export const pastDateSchema = z
  .date()
  .refine(
    (date) => date <= new Date(),
    { message: 'Date cannot be in the future' }
  );

// Future date validation (must be a valid date and not in the past)
export const futureDateSchema = z
  .date()
  .refine(
    (date) => date >= new Date(),
    { message: 'Date cannot be in the past' }
  );

// Currency amount validation
export const currencySchema = z
  .number()
  .min(0, { message: 'Amount cannot be negative' })
  .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number));

// API Key validation
export const apiKeySchema = z
  .string()
  .min(10, { message: 'API key is too short' })
  .refine(
    (key) => /^[A-Za-z0-9_-]+$/.test(key),
    { message: 'API key contains invalid characters' }
  );

/**
 * Custom validation error handler for showing detailed error info
 * @param error Zod validation error
 * @returns Formatted error message
 */
export function handleZodError(error: z.ZodError): string {
  // Log validation errors at debug level
  logger.debug('Form validation error', { 
    error, 
    formattedIssues: error.format(),
    formErrors: error.formErrors
  });
  
  // Return first error message for user display
  const firstError = error.errors[0];
  return firstError?.message || 'Validation failed';
}

/**
 * Common validation setup for forms
 * @returns Object with validation utils
 */
export function useFormValidation() {
  // Get validation functions and schemas
  return {
    email: emailSchema,
    password: passwordSchema,
    url: urlSchema,
    phone: phoneSchema,
    name: nameSchema,
    companyName: companyNameSchema,
    jobTitle: jobTitleSchema,
    username: usernameSchema,
    pastDate: pastDateSchema,
    futureDate: futureDateSchema,
    currency: currencySchema,
    apiKey: apiKeySchema,
    handleError: handleZodError
  };
}

export default useFormValidation;