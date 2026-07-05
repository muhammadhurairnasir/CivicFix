import * as React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperId = `${inputId}-helper`;
    const errorId  = `${inputId}-error`;
    const [showPassword, setShowPassword] = React.useState(false);

    const isPassword = type === 'password';
    const inputType  = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--text-primary)] font-body"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 text-[var(--text-secondary)]">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={inputType}
            className={cn(
              // Base
              'flex h-9 w-full rounded-md text-sm',
              'bg-[var(--surface)] text-[var(--text-primary)]',
              'border border-[var(--border)]',
              'px-3 py-2',
              'placeholder:text-[var(--text-secondary)]',
              // Focus
              'focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
              'focus-visible:border-[var(--primary)]',
              // Transition
              'transition-[border-color,box-shadow] duration-[var(--transition-fast)]',
              // Disabled
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--surface)]',
              // Icon padding
              leftIcon && 'pl-10',
              (rightIcon || isPassword) && 'pr-10',
              // Error state
              error && [
                'border-[var(--status-critical)]',
                'focus-visible:ring-[var(--status-critical)]',
                'focus-visible:border-[var(--status-critical)]',
              ],
              className
            )}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={
              cn(error ? errorId : undefined, helperText ? helperId : undefined) || undefined
            }
            {...props}
          />

          {/* Right icon or password toggle */}
          {rightIcon && !isPassword && (
            <div className="pointer-events-none absolute right-3 text-[var(--text-secondary)]">
              {rightIcon}
            </div>
          )}
          {isPassword && (
            <button
              type="button"
              className="absolute right-3 text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-sm"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword
                ? <EyeOff className="h-4 w-4" />
                : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p id={errorId} className="flex items-center gap-1.5 text-xs text-[var(--status-critical)] font-body">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        {/* Helper text */}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-[var(--text-secondary)] font-body">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
