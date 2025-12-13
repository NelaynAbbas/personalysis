import React, { useState } from 'react';
import { useForm, UseFormProps, UseFormReturn, FieldValues, SubmitHandler, SubmitErrorHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import logger from '../../lib/logger';

interface FormWithValidationProps<TFormValues extends FieldValues> {
  /**
   * Form schema for validation
   */
  schema: z.ZodSchema<any>;
  
  /**
   * Initial form values
   */
  defaultValues?: UseFormProps<TFormValues>['defaultValues'];
  
  /**
   * Form submit handler
   */
  onSubmit: SubmitHandler<TFormValues>;
  
  /**
   * Optional error handler for form submission
   */
  onError?: SubmitErrorHandler<TFormValues>;
  
  /**
   * Children render prop that receives form methods
   */
  children: (form: UseFormReturn<TFormValues>) => React.ReactNode;
  
  /**
   * Text for submit button
   */
  submitText?: string;
  
  /**
   * Text for submit button when loading
   */
  loadingText?: string;
  
  /**
   * If true, form fields will be disabled during submission
   */
  disableOnSubmit?: boolean;
  
  /**
   * If provided, shows this at the form level (e.g. for API errors)
   */
  formError?: string | null;
  
  /**
   * Custom class for submit button
   */
  submitClassName?: string;
  
  /**
   * Custom class for form container
   */
  className?: string;
  
  /**
   * If false, the form won't have a submit button (controlled by parent)
   */
  showSubmitButton?: boolean;
  
  /**
   * Render custom submit button section
   */
  renderSubmit?: (form: UseFormReturn<TFormValues>, isSubmitting: boolean) => React.ReactNode;
  
  /**
   * Additional form props
   */
  formProps?: React.FormHTMLAttributes<HTMLFormElement>;
}

/**
 * Enhanced form component with built-in validation, loading states, and error handling
 */
function FormWithValidation<TFormValues extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  onError,
  children,
  submitText = 'Submit',
  loadingText = 'Submitting...',
  disableOnSubmit = true,
  formError,
  submitClassName = '',
  className = '',
  showSubmitButton = true,
  renderSubmit,
  formProps = {}
}: FormWithValidationProps<TFormValues>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set up form with schema validation
  const form = useForm<TFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });
  
  // Handle form submission
  const handleSubmit = async (values: TFormValues) => {
    setIsSubmitting(true);
    
    try {
      logger.debug('Form submission started', { values }, 'FormWithValidation');
      await onSubmit(values);
    } catch (error) {
      logger.error('Form submission error', { error, values }, 'FormWithValidation');
      form.setError('root.serverError', {
        type: 'server',
        message: error instanceof Error ? error.message : 'Form submission failed'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle validation errors
  const handleError: SubmitErrorHandler<TFormValues> = (errors) => {
    logger.debug('Form validation errors', { errors }, 'FormWithValidation');
    
    // Call custom error handler if provided
    if (onError) {
      onError(errors);
    }
  };
  
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, handleError)}
        className={className}
        noValidate
        {...formProps}
      >
        {/* Show form-level errors */}
        {(formError || form.formState.errors.root) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {formError || form.formState.errors.root?.serverError?.message || 
               form.formState.errors.root?.message || 'An error occurred'}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Form fields from children */}
        <fieldset disabled={disableOnSubmit && isSubmitting}>
          {children(form)}
        </fieldset>
        
        {/* Submit button section */}
        {showSubmitButton && (
          renderSubmit ? (
            renderSubmit(form, isSubmitting)
          ) : (
            <Button
              type="submit"
              className={submitClassName}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loadingText}
                </>
              ) : (
                submitText
              )}
            </Button>
          )
        )}
      </form>
    </Form>
  );
}

export default FormWithValidation;