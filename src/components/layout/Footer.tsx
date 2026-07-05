import Link from 'next/link';
import { Shield } from 'lucide-react';

const FOOTER_LINKS = {
  Product: [
    { name: 'Features',       href: '/#features' },
    { name: 'How It Works',   href: '/#how-it-works' },
    { name: 'Track a Report', href: '/#track' },
    { name: 'Sign In',        href: '/login' },
  ],
  'For Cities': [
    { name: 'Municipal Operations', href: '/cities' },
    { name: 'Crew App',             href: '/crew' },
    { name: 'Data Analytics',       href: '/analytics' },
    { name: 'Request a Demo',       href: '/contact' },
  ],
  Legal: [
    { name: 'Privacy Policy',  href: '/privacy' },
    { name: 'Terms of Service',href: '/terms' },
    { name: 'Accessibility',   href: '/accessibility' },
  ],
};

export function Footer() {
  return (
    <footer
      className="border-t border-[var(--border)] bg-[var(--background)]"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:grid-cols-5">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 group" aria-label="CivicFix home">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--primary)]">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)]">
                CivicFix
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--text-secondary)]">
              The civic reporting network that connects citizens directly with local government to resolve infrastructure issues efficiently.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-semibold tracking-widest text-[var(--text-secondary)] uppercase mb-4">
                {heading}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[var(--transition-fast)]"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--text-secondary)]">
          <p>&copy; {new Date().getFullYear()} CivicFix. All rights reserved.</p>
          <p className="font-medium">Built for civic good.</p>
        </div>
      </div>
    </footer>
  );
}
