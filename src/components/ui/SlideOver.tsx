'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export function SlideOver({
  open,
  onOpenChange,
  title,
  description,
  width = 'md',
  children,
}: SlideOverProps) {

  const widthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                // Overlay: inline rgba of locked --text-primary (#1A1917). No new token added.
                style={{ backgroundColor: 'rgba(26,25,23,0.5)' }}
                className="fixed inset-0 z-50"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={cn(
                  'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-surface border-l border-border',
                  widthClasses[width]
                )}
              >
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div>
                    <Dialog.Title className="text-base font-semibold text-text-primary">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-1 text-sm text-text-secondary">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded p-2 text-text-secondary transition-colors hover:bg-card hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="sr-only">Close panel</span>
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="relative flex-1 overflow-y-auto p-6">
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
