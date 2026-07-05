'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { name: 'How it Works',   href: '/#how-it-works' },
  { name: 'Live Activity',  href: '/#impact' },
  { name: 'Browse Reports', href: '/reports' },
];

export function Navbar() {
  const [isScrolled,   setIsScrolled]   = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-200',
        isScrolled
          ? 'bg-surface border-b border-border'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="CivicFix home">
          <Shield className="h-5 w-5 text-primary" strokeWidth={2} />
          <span className="text-base font-bold tracking-tight text-text-primary">
            CivicFix
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
          {NAV_LINKS.map((link, i) => {
            const isActive = pathname === link.href;
            return (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={link.href}
                  className={cn(
                    'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary bg-card'
                      : 'text-text-secondary hover:text-text-primary hover:bg-card'
                  )}
                >
                  {link.name}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <button
                onClick={logout}
                title="Log out"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-text-primary font-bold text-sm hover:bg-surface transition-colors"
                aria-label="User menu — click to log out"
              >
                {user?.name?.charAt(0).toUpperCase() ?? '?'}
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Report Issue</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden flex h-8 w-8 items-center justify-center rounded text-text-secondary hover:text-text-primary hover:bg-card transition-colors"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-expanded={isMobileOpen}
          aria-label="Toggle navigation menu"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden bg-surface border-b border-border overflow-hidden"
          >
            <div className="px-4 pt-2 pb-5 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block px-3 py-2.5 rounded text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-card transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-border flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard">
                      <Button fullWidth variant="secondary" size="md">Dashboard</Button>
                    </Link>
                    <Button fullWidth variant="ghost" size="md" onClick={() => { logout(); }}>
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login"><Button fullWidth variant="secondary" size="md">Log in</Button></Link>
                    <Link href="/register"><Button fullWidth size="md">Report Issue</Button></Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
