'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, FileText, Map, PlusCircle, Bell, 
  ShieldCheck, ClipboardList, Truck, BarChart2, Wrench, 
  Settings, LogOut, X 
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';
import { useNotifications } from '@/hooks/useReports';

interface DashboardSidebarProps {
  onMobileClose?: () => void;
}

export default function DashboardSidebar({ onMobileClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const isAdmin = ['admin', 'super_admin'].includes(user?.role || '');
  const isCrew = user?.role === 'crew';

  const { data: notifData } = useNotifications(true, 1);
  const unreadCount = notifData?.unreadCount || 0;

  if (!user) return null;


  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const NavItem = ({ href, icon: Icon, label, badge }: any) => {
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    return (
      <Link 
        href={href}
        onClick={onMobileClose}
        className={`flex items-center justify-between px-3 py-2.5 rounded-btn mb-1 transition-all ${
          isActive 
            ? 'bg-[var(--primary)] text-white shadow-sm font-medium' 
            : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] font-medium'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-secondary)]'}`} />
          <span className="text-sm">{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--primary)] text-white'}`}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)]">
      {/* Header / Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-[var(--border)] flex-shrink-0">
        <Link href="/" className="font-display font-bold text-xl text-[var(--text-primary)] flex items-center gap-2" onClick={onMobileClose}>
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          CivicFix
        </Link>
        {onMobileClose && (
          <button onClick={onMobileClose} className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar space-y-8">
        
        {/* Core Menu */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 px-3">
            Menu
          </h3>
          <nav>
            <NavItem href="/dashboard" icon={LayoutDashboard} label="Overview" />
            <NavItem href="/my-reports" icon={FileText} label="My Reports" />
            <NavItem href="/reports" icon={Map} label="Community Feed" />
            <NavItem href="/dashboard/notifications" icon={Bell} label="Notifications" badge={unreadCount} />
          </nav>
        </div>

        {/* Action CTA */}
        <div>
          <Link 
            href="/report/new" 
            onClick={onMobileClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--primary)] text-white rounded-btn font-medium transition-colors shadow-sm hover:bg-[var(--primary-hover)]"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Submit Report</span>
          </Link>
        </div>

        {/* Staff/Admin Sections */}
        {(isAdmin || isCrew) && (
          <div className="border-t border-[var(--border)] pt-6">
            <h3 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-3 px-3">
              Staff Portal
            </h3>
            <nav>
              {isAdmin && (
                <>
                  <NavItem href="/admin" icon={ShieldCheck} label="Admin Dashboard" />
                  <NavItem href="/admin/reports" icon={ClipboardList} label="Report Queue" />
                  <NavItem href="/admin/crew" icon={Truck} label="Crew Dispatch" />
                  <NavItem href="/admin/analytics" icon={BarChart2} label="Analytics" />
                </>
              )}
              {isCrew && !isAdmin && (
                <NavItem href="/crew/tickets" icon={Wrench} label="My Tickets" />
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Footer / User Profile */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] mb-4">
          <Avatar className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface)] flex items-center justify-center">
            {user.avatar ? (
              <AvatarImage src={user.avatar} className="w-full h-full object-cover" />
            ) : (
              <AvatarFallback className="text-[var(--primary)] font-bold">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.name}</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--primary)] truncate">
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/dashboard/settings" className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded transition-colors border border-[var(--border)]">
            <Settings className="w-4 h-4" /> Settings
          </Link>
          <button onClick={handleLogout} className="flex items-center justify-center px-3 py-2 text-xs font-medium text-[var(--status-critical)] hover:bg-[var(--background)] rounded transition-colors border border-transparent hover:border-[var(--status-critical)]/20" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
