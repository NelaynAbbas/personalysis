import { useState, useCallback } from 'react';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

/**
 * Custom hook for form validation and error handling
 * @param schema - Zod schema for validation
 * @returns Form validation utilities
 */
export function useFormValidation<T>(schema: z.ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Validate an object against the schema
  const validate = useCallback(
    (data: unknown): data is T => {
      try {
        schema.parse(data);
        // Clear errors if validation passes
        setErrors({});
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Transform Zod errors into a more user-friendly format
          const formattedErrors: Record<string, string> = {};
          
          error.errors.forEach((err) => {
            if (err.path.length > 0) {
              // Get the field name from the path
              const fieldName = err.path.join('.');
              formattedErrors[fieldName] = err.message;
            }
          });
          
          setErrors(formattedErrors);
          
          // Show first error in toast for better UX
          if (error.errors.length > 0) {
            toast({
              title: "Validation Error",
              description: error.errors[0].message,
              variant: "destructive",
            });
          }
        } else {
          // Handle unexpected errors
          console.error("Validation error:", error);
          toast({
            title: "Error",
            description: "An unexpected error occurred during validation.",
            variant: "destructive",
          });
        }
        return false;
      }
    },
    [schema]
  );
  
  // Get error for a specific field
  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      return errors[fieldName];
    },
    [errors]
  );
  
  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);
  
  // Clear error for a specific field
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const { [fieldName]: _, ...rest } = prev;
      return rest;
    });
  }, []);
  
  // Set a custom error for a field
  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);
  
  return {
    validate,
    errors,
    getFieldError,
    clearErrors,
    clearFieldError,
    setFieldError,
    hasErrors: Object.keys(errors).length > 0
  };
}

export default useFormValidation;