import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center whitespace-nowrap',
    'text-sm font-semibold',
    'rounded-md',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-40',
    'select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        // Primary — `--primary` is reserved for this single element per screen.
        primary: [
          'bg-primary text-primary-fg',
          'hover:bg-primary-hover',
        ].join(' '),

        // Secondary — neutral outlined.
        secondary: [
          'bg-surface text-text-primary',
          'border border-border',
          'hover:bg-card',
        ].join(' '),

        // Ghost — for nav items and low-priority inline actions.
        ghost: [
          'bg-transparent text-text-secondary',
          'hover:bg-surface hover:text-text-primary',
        ].join(' '),

        // Danger — destructive operations and SLA critical states only.
        danger: [
          'bg-status-critical text-primary-fg',
          'hover:opacity-90',
        ].join(' '),

        // Link — inline text-only actions.
        link: [
          'bg-transparent text-primary underline-offset-4',
          'hover:underline hover:text-primary-hover',
          'p-0 h-auto',
        ].join(' '),
      },
      size: {
        sm:   'h-8 px-3 text-xs gap-1.5',
        md:   'h-9 px-4 gap-2',
        lg:   'h-10 px-5 gap-2',
        xl:   'h-12 px-6 text-base gap-2.5',
        icon: 'h-9 w-9',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {!loading && leftIcon && <span className="inline-flex shrink-0" aria-hidden="true">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="inline-flex shrink-0" aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
