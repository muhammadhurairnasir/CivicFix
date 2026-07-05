'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useInView } from '@/hooks/useInView';

export function CTASection() {
  const ref = useInView<HTMLElement>();

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-32 md:py-40"
      style={{ background: 'linear-gradient(135deg, #0a0f0a 0%, #0d1f0d 40%, #0a1a10 100%)' }}
    >
      {/* Background glow orbs */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }}
      />

      {/* Dot grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6 text-center">

        {/* Eyebrow */}
        <p
          className="civic-animate mb-4 text-xs font-semibold uppercase tracking-widest"
          data-anim="fade-in"
          style={{ color: 'var(--primary)' }}
        >
          Join thousands of citizens
        </p>

        <h2
          className="civic-animate text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
          data-anim="fade-up"
          style={{ color: '#ffffff', lineHeight: 1.1 }}
        >
          Your street.{' '}
          <span style={{ color: 'var(--primary)' }}>Your city.</span>{' '}
          One tap away.
        </h2>

        <p
          className="civic-animate civic-delay-1 mx-auto mt-6 max-w-xl text-lg"
          data-anim="fade-up"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          Every report you submit is a direct line to the people who fix it.
          No phone trees. No bureaucracy. Just results.
        </p>

        <div
          className="civic-animate civic-delay-2 mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          data-anim="fade-up"
        >
          <Link
            href="/register"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-md px-8 py-4 text-sm font-semibold transition-all hover:opacity-90 hover:-translate-y-px hover:shadow-lg sm:w-auto"
            style={{ background: 'var(--primary)', color: '#ffffff' }}
          >
            Report an Issue
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2} />
          </Link>
          <Link
            href="/reports"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border px-8 py-4 text-sm font-semibold transition-all hover:bg-white/5 sm:w-auto"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' }}
          >
            View Public Reports
          </Link>
        </div>

        {/* Trust line */}
        <p
          className="civic-animate civic-delay-3 mt-10 text-xs"
          data-anim="fade-in"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          Free · No account required to report · Open to all citizens
        </p>

      </div>
    </section>
  );
}
