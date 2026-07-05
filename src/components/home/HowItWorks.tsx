'use client';

import { Camera, FileText, CheckCircle2 } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const steps = [
  {
    icon: Camera,
    step: '01',
    title: 'Document the issue',
    description:
      'Snap a photo and provide a brief description. Location data is captured automatically to ensure accurate routing.',
  },
  {
    icon: FileText,
    step: '02',
    title: 'Automatic routing',
    description:
      'The report is analyzed and routed to the correct municipal department immediately. No phone calls. No guessing.',
  },
  {
    icon: CheckCircle2,
    step: '03',
    title: 'Track resolution',
    description:
      'Receive updates as the city assigns a crew, begins work, and closes the issue. Every step is visible.',
  },
];

export function HowItWorks() {
  const ref = useInView<HTMLElement>();

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="border-b border-border bg-background py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* Section header */}
        <div className="mb-16 max-w-2xl">
          <p
            className="civic-animate mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary"
            data-anim="fade-in"
          >
            How it works
          </p>
          <h2
            className="civic-animate civic-delay-1 text-3xl font-bold tracking-tight text-text-primary md:text-4xl"
            data-anim="fade-up"
          >
            A transparent process from report to resolution.
          </h2>
          <p
            className="civic-animate civic-delay-2 mt-4 text-lg text-text-secondary"
            data-anim="fade-up"
          >
            We bridge the gap between citizens and local government by standardising
            how infrastructure issues are reported and tracked.
          </p>
        </div>

        {/* Steps — with connecting dashed flow line on desktop */}
        <div className="relative">

          {/* Dashed connector line — desktop only, sits behind the cards */}
          <div
            className="pointer-events-none absolute hidden md:block"
            style={{
              top: '2.6rem',           // aligns vertically with the step numbers
              left: 'calc(33.33% - 0px)',
              right: 'calc(33.33% - 0px)',
              height: '1px',
              background: 'repeating-linear-gradient(90deg, var(--border) 0, var(--border) 6px, transparent 6px, transparent 14px)',
            }}
          />

          <div className="grid gap-0 divide-y divide-border border border-border md:grid-cols-3 md:divide-x md:divide-y-0">
            {steps.map((step, i) => (
              <div
                key={step.step}
                className={`civic-animate civic-delay-${i + 1} group flex flex-col gap-4 p-8 transition-all duration-300 hover:bg-surface hover:shadow-md hover:-translate-y-1`}
                data-anim="fade-up"
              >
                {/* Step number + dot indicator */}
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-xs font-bold font-mono tracking-widest text-text-secondary transition-all duration-300 group-hover:border-primary group-hover:text-primary"
                  >
                    {step.step}
                  </span>
                  {/* Arrow connector — only between steps, not after last */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute" />
                  )}
                </div>

                <step.icon
                  className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={2}
                />
                <h3 className="text-lg font-semibold text-text-primary">{step.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
