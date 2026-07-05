import * as React from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { Input, InputProps } from './Input';

interface FormFieldProps<TFieldValues extends FieldValues> extends Omit<InputProps, 'name'> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
}

export function FormField<TFieldValues extends FieldValues>({
  control,
  name,
  ...props
}: FormFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <Input
          {...field}
          {...props}
          error={error?.message}
          // The field object provides value, onChange, onBlur, ref. 
          // We override value to ensure it's never undefined (controlled component warning).
          value={field.value ?? ''}
        />
      )}
    />
  );
}
