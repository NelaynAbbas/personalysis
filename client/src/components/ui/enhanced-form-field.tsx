import React from "react";
import { cn } from "@/lib/utils";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle } from "lucide-react";
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form";

interface EnhancedFormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
> {
  form: UseFormReturn<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  showSuccessState?: boolean;
  className?: string;
  disabled?: boolean;
  autoComplete?: string;
  renderInput?: (field: any) => React.ReactNode;
  hideMessage?: boolean;
}

/**
 * Enhanced Form Field with improved validation feedback
 * Shows success/error states visually with icons and colors
 */
export function EnhancedFormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
>({
  form,
  name,
  label,
  description,
  placeholder,
  type = "text",
  required = false,
  showSuccessState = true,
  className,
  disabled = false,
  autoComplete,
  renderInput,
  hideMessage = false,
}: EnhancedFormFieldProps<TFieldValues, TName>) {
  // Get field state to determine if field is valid or has errors
  const fieldState = form.getFieldState(name, form.formState);
  const isValid = fieldState.isDirty && !fieldState.error && form.getValues(name);
  const hasError = !!fieldState.error;

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
              {label}
            </FormLabel>
          )}
          <div className="relative">
            <FormControl>
              {renderInput ? (
                renderInput(field)
              ) : (
                <Input
                  {...field}
                  type={type}
                  placeholder={placeholder}
                  className={cn(
                    "pr-10", // Add padding for the icon
                    hasError && "border-red-500 focus-visible:ring-red-500",
                    isValid && showSuccessState && "border-green-500 focus-visible:ring-green-500"
                  )}
                  disabled={disabled}
                  autoComplete={autoComplete}
                  aria-invalid={hasError}
                  aria-required={required}
                />
              )}
            </FormControl>
            
            {/* Error or success icon */}
            {hasError && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
            )}
            {isValid && showSuccessState && !hasError && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
              </div>
            )}
          </div>
          
          {description && <FormDescription>{description}</FormDescription>}
          {!hideMessage && <FormMessage />}
        </FormItem>
      )}
    />
  );
}