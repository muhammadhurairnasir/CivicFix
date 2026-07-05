'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── Context ──────────────────────────────────────────────────────────────────
const TabsVariantContext = React.createContext<'underline' | 'pill'>('underline');

// ─── Root ────────────────────────────────────────────────────────────────────
interface TabsProps extends TabsPrimitive.TabsProps {
  variant?: 'underline' | 'pill';
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ variant = 'underline', children, ...props }, ref) => (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.Root ref={ref} {...props}>
        {children}
      </TabsPrimitive.Root>
    </TabsVariantContext.Provider>
  )
);
Tabs.displayName = 'Tabs';

// ─── List ─────────────────────────────────────────────────────────────────────
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'relative flex',
        variant === 'underline'
          ? 'border-b border-slate-200 gap-0'
          : 'bg-slate-100 p-1 rounded-xl gap-1 w-fit',
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = 'TabsList';

// ─── Trigger ──────────────────────────────────────────────────────────────────
interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  layoutId?: string;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, children, layoutId, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'relative inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'transition-colors duration-150',
        variant === 'underline'
          ? [
              'px-4 py-3 text-slate-500',
              'data-[state=active]:text-slate-900',
              'hover:text-slate-700',
            ].join(' ')
          : [
              'px-4 py-2 rounded-lg text-slate-500',
              'data-[state=active]:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-sm',
              'hover:text-slate-700',
            ].join(' '),
        className
      )}
      {...props}
    >
      {children}
      {/* Underline animated indicator */}
      {variant === 'underline' && (props as any)['data-state'] === 'active' && (
        <motion.span
          layoutId={layoutId ?? 'tab-underline'}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

// ─── Content ─────────────────────────────────────────────────────────────────
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
