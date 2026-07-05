'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Shield, MapPin, Activity, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface StatCardProps {
  icon: React.ElementType;
  value: string;
  label: string;
  delay: number;
}

function StatCard({ icon: Icon, value, label, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="flex items-center gap-4 rounded-lg bg-surface border border-border p-4 shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/10">
        <Icon className="h-5 w-5 text-white/80" />
      </div>
      <div>
        <p className="font-display text-xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs font-medium text-white/50 mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--background)] font-body">

      {/* ── Left Panel ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between bg-[var(--surface)] p-12 text-white relative overflow-hidden">
        {/* Subtle radial glow — restrained, not neon */}
        {/* Background decoration removed per guidelines */}

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="CivicFix home">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 border border-white/20">
              <Shield className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              CivicFix
            </span>
          </Link>

          <div className="mt-14 max-w-sm">
            <motion.h1
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55 }}
              className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-white"
            >
              Fix your city.{' '}
              <span className="text-white/60">One report at a time.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.55 }}
              className="mt-5 text-[0.9375rem] leading-relaxed text-white/55"
            >
              The modern civic reporting network. Connect directly with your local government to resolve infrastructure issues efficiently.
            </motion.p>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 space-y-3">
          <StatCard icon={Activity}      value="12,400" label="Reports Filed"     delay={0.4} />
          <StatCard icon={CheckCircle2}  value="89%"    label="Resolution Rate"   delay={0.5} />
          <StatCard icon={MapPin}        value="142"    label="Cities Active"     delay={0.6} />
        </div>
      </div>

      {/* ── Right Panel (Form) ──────────────────────── */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-8 lg:w-[58%] lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto w-full max-w-md"
        >
          {/* Mobile-only logo */}
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="CivicFix home">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)]">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-2xl font-bold text-[var(--text-primary)]">
                CivicFix
              </span>
            </Link>
            <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
              Fix your city. One report at a time.
            </p>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}
