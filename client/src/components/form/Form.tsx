import React from 'react';
import { 
  Form as UIForm,
  FormProvider
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import FormField, { FormFieldProps } from './FormField';

export interface FormProps<TFormValues extends FieldValues> {
  id?: string;
  onSubmit: (data: TFormValues) => void;
  schema?: z.ZodType<TFormValues>;
  defaultValues?: Partial<TFormValues>;
  fields: FormFieldProps[];
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  formProps?: UseFormProps<TFormValues>;
  className?: string;
}

export type FormReturns<TFormValues extends FieldValues> = {
  form: UseFormReturn<TFormValues>;
};

export function Form<TFormValues extends FieldValues>({
  id,
  onSubmit,
  schema,
  defaultValues,
  fields,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  isLoading = false,
  formProps,
  className,
}: FormProps<TFormValues>): JSX.Element {
  const form = useForm<TFormValues>({
    ...(schema ? { resolver: zodResolver(schema) } : {}),
    defaultValues: defaultValues as TFormValues,
    ...formProps,
  });

  const handleSubmit = async (data: TFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <UIForm {...form}>
      <form
        id={id}
        onSubmit={form.handleSubmit(handleSubmit)}
        className={className}
        noValidate
      >
        <div className="space-y-4">
          {fields.map((field) => (
            <FormField key={field.name} form={form} field={field} />
          ))}
        </div>

        <div className="flex items-center justify-end space-x-3 mt-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </UIForm>
  );
}

export default Form;