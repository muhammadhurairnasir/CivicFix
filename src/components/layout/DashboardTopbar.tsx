'use client';

import React from 'react';
import { Menu, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useReports';

interface DashboardTopbarProps {
  onMenuClick: () => void;
}

export default function DashboardTopbar({ onMenuClick }: DashboardTopbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const { data: notifData } = useNotifications(true, 1);
  const unreadCount = notifData?.unreadCount || 0;

  // Helper to generate a readable page title from the pathname
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Overview';
    if (pathname.startsWith('/my-reports')) return 'My Reports';
    if (pathname.startsWith('/reports')) return 'Community Reports';
    if (pathname.startsWith('/dashboard/notifications')) return 'Notifications';
    if (pathname.startsWith('/dashboard/settings')) return 'Settings';
    if (pathname.startsWith('/admin')) return 'Admin Portal';
    if (pathname.startsWith('/crew')) return 'Crew Portal';
    return 'Dashboard';
  };

  return (
    <header className="h-16 flex-shrink-0 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10 shadow-sm">
      
      {/* Left side: Hamburger (Mobile) + Title (Desktop/Mobile) */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-lg transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col">
          <h1 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)] leading-tight">
            {getPageTitle()}
          </h1>
          <div className="hidden sm:flex items-center text-xs text-[var(--text-secondary)] font-medium mt-0.5">
            <span>CivicFix</span>
            <span className="mx-1.5">•</span>
            <span className="capitalize">{user?.role?.replace('_', ' ')} Dashboard</span>
          </div>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell (Quick Link to Notifications Page) */}
        <Link 
          href="/dashboard/notifications" 
          className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-full transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[var(--status-critical)] rounded-full border-2 border-[var(--background)]" />
          )}
        </Link>
      </div>

    </header>
  );
}
