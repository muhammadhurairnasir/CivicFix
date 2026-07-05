'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full bg-surface border-b border-border text-text-secondary shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" strokeWidth={2} />
          <span className="text-lg font-bold tracking-tight text-text-primary">
            CivicFix
          </span>
        </div>
        <nav className="hidden items-center gap-8 md:flex text-sm font-medium text-text-secondary">
          <Link
            href="#how-it-works"
            className="transition-colors duration-150 relative after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-200 hover:after:w-full hover:text-text-primary"
          >
            How it Works
          </Link>
          <Link
            href="#impact"
            className="transition-colors duration-150 relative after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-200 hover:after:w-full hover:text-text-primary"
          >
            Impact
          </Link>
          <Link
            href="/reports"
            className="transition-colors duration-150 relative after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-200 hover:after:w-full hover:text-text-primary"
          >
            Browse Reports
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-medium transition-colors duration-150 md:block hover:text-text-primary"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-fg transition-colors duration-150 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Report Issue
          </Link>
        </div>
      </div>
    </header>
  );
}
