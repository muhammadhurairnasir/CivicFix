'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md';
  color?: 'brand' | 'success';
  id?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, disabled, label, description, size = 'md', color = 'brand', id, ...props }, ref) => {
    const switchId = id ?? React.useId();

    const trackSize  = size === 'sm' ? 'h-4 w-7'    : 'h-5 w-9';
    const thumbSize  = size === 'sm' ? 'h-3 w-3'    : 'h-4 w-4';
    const thumbTrans = size === 'sm' ? 'translate-x-3' : 'translate-x-4';
    const colorOn    = color === 'success' ? 'bg-emerald-500' : 'bg-brand-600';

    return (
      <div className="flex items-center justify-between gap-4">
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label
                htmlFor={switchId}
                className={cn(
                  'text-sm font-medium text-slate-900 cursor-pointer',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
        )}

        <SwitchPrimitive.Root
          ref={ref}
          id={switchId}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className={cn(
            'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent',
            'transition-colors duration-200 ease-in-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            trackSize,
            checked ? colorOn : 'bg-slate-200'
          )}
          {...props}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'pointer-events-none block rounded-full bg-white shadow-md',
              'transition-transform duration-200 ease-in-out',
              'data-[state=checked]:translate-x-0',
              thumbSize,
              checked ? thumbTrans : 'translate-x-0'
            )}
          />
        </SwitchPrimitive.Root>
      </div>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
