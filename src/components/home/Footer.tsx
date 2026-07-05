import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 border-b pb-12 md:grid-cols-4 lg:gap-12" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>

          <div className="md:col-span-2">
            <Link href="/" className="mb-4 inline-flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" strokeWidth={2} />
              <span className="text-base font-bold tracking-tight text-primary">CivicFix</span>
            </Link>
            <p className="max-w-xs text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              A modern civic issue reporting platform connecting citizens directly with their local government.
            </p>
            <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Prefer to call?{' '}
              <a href="tel:311" className="font-semibold text-white hover:text-primary transition-colors">
                Dial 311
              </a>
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Platform
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Browse Reports', href: '/reports' },
                { label: 'Analytics', href: '/analytics' },
                { label: 'How it Works', href: '/#how-it-works' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Legal
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Accessibility', href: '/accessibility' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="flex flex-col items-start justify-between gap-4 pt-8 md:flex-row md:items-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            &copy; {new Date().getFullYear()} CivicFix Platform. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Built for municipalities &middot; Open Source
          </p>
        </div>
      </div>
    </footer>
  );
}
