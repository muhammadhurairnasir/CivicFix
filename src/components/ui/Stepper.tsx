'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: number;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Background connector */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2 z-0 hidden md:block" />

        {/* Active connector */}
        <div
          className="absolute top-1/2 left-0 h-px -translate-y-1/2 z-0 hidden md:block transition-all duration-300 ease-in-out"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            backgroundColor: 'var(--primary)',
          }}
        />

        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive    = currentStep === step.id;
          const isUpcoming  = currentStep < step.id;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors duration-300'
                )}
                style={{
                  backgroundColor: isCompleted ? 'var(--primary)' : isActive ? 'var(--surface)' : 'var(--surface)',
                  borderColor: isUpcoming ? 'var(--border)' : 'var(--primary)',
                  color: isCompleted ? 'var(--primary-fg)' : isActive ? 'var(--primary)' : 'var(--text-secondary)',
                }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <span>{step.id}</span>
                )}
              </div>

              <div className="mt-2 text-center md:absolute md:top-12 md:w-32 md:-ml-11">
                <span
                  className="text-xs font-medium transition-colors duration-300 hidden md:block"
                  style={{
                    color: isCompleted
                      ? 'var(--text-primary)'
                      : isActive
                      ? 'var(--primary)'
                      : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : undefined,
                  }}
                >
                  {step.label}
                </span>
                {isActive && (
                  <span
                    className="text-xs font-semibold block md:hidden mt-1 text-center whitespace-nowrap"
                    style={{ color: 'var(--primary)' }}
                  >
                    {step.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
