import React from 'react';
import { 
  FormControl,
  FormDescription,
  FormField as UIFormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UseFormReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';

export type FieldType = 
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'switch'
  | 'radio'
  | 'custom';

export type SelectOption = {
  label: string;
  value: string;
};

export type RadioOption = {
  label: string;
  value: string;
};

type BaseFieldProps = {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

type TextFieldProps = BaseFieldProps & {
  type: 'text' | 'email' | 'password' | 'number';
};

type TextareaFieldProps = BaseFieldProps & {
  type: 'textarea';
  rows?: number;
};

type SelectFieldProps = BaseFieldProps & {
  type: 'select';
  options: SelectOption[];
};

type CheckboxFieldProps = BaseFieldProps & {
  type: 'checkbox';
};

type SwitchFieldProps = BaseFieldProps & {
  type: 'switch';
};

type RadioFieldProps = BaseFieldProps & {
  type: 'radio';
  options: RadioOption[];
  orientation?: 'horizontal' | 'vertical';
};

type CustomFieldProps = BaseFieldProps & {
  type: 'custom';
  renderInput: (field: any) => React.ReactNode;
};

export type FormFieldProps = 
  | TextFieldProps
  | TextareaFieldProps
  | SelectFieldProps
  | CheckboxFieldProps
  | SwitchFieldProps
  | RadioFieldProps
  | CustomFieldProps;

interface FormFieldComponentProps {
  form: UseFormReturn<any>;
  field: FormFieldProps;
}

const FormField: React.FC<FormFieldComponentProps> = ({ form, field }) => {
  const renderFieldInput = (field: FormFieldProps, formField: any) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            disabled={field.disabled}
            {...formField}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            disabled={field.disabled}
            rows={(field as TextareaFieldProps).rows || 3}
            {...formField}
          />
        );

      case 'select':
        const selectField = field as SelectFieldProps;
        return (
          <Select
            value={formField.value || ''}
            onValueChange={formField.onChange}
            disabled={field.disabled}
            defaultValue={formField.value}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {selectField.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={!!formField.value}
              onCheckedChange={formField.onChange}
              disabled={field.disabled}
              id={`checkbox-${field.name}`}
            />
          </div>
        );

      case 'switch':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={!!formField.value}
              onCheckedChange={formField.onChange}
              disabled={field.disabled}
              id={`switch-${field.name}`}
            />
          </div>
        );

      case 'radio':
        const radioField = field as RadioFieldProps;
        return (
          <RadioGroup
            value={formField.value || ''}
            onValueChange={formField.onChange}
            disabled={field.disabled}
            className={cn(
              'flex',
              radioField.orientation === 'horizontal'
                ? 'flex-row space-x-4'
                : 'flex-col space-y-2'
            )}
          >
            {radioField.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`radio-${field.name}-${option.value}`} />
                <label
                  htmlFor={`radio-${field.name}-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'custom':
        return (field as CustomFieldProps).renderInput(formField);

      default:
        return null;
    }
  };

  // For checkbox and switch fields, we'll render the label differently
  const isCheckboxOrSwitch = field.type === 'checkbox' || field.type === 'switch';

  return (
    <UIFormField
      control={form.control}
      name={field.name}
      render={({ field: formField }) => (
        <FormItem className={field.className}>
          {field.label && !isCheckboxOrSwitch && (
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}
          
          <FormControl>
            {isCheckboxOrSwitch ? (
              <div className="flex items-center space-x-2">
                {renderFieldInput(field, formField)}
                {field.label && (
                  <FormLabel className="!mt-0" htmlFor={`${field.type}-${field.name}`}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                )}
              </div>
            ) : (
              renderFieldInput(field, formField)
            )}
          </FormControl>
          
          {field.description && <FormDescription>{field.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormField;