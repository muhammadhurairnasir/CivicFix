'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  FileText, CheckCircle, Clock, Map, 
  PlusCircle, Search, ArrowRight, Activity 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMyStats, useMyReports, usePublicStats } from '@/hooks/useReports';

export default function CitizenDashboard() {
  const { user } = useAuth();
  
  const { data: myStatsData, isLoading: isLoadingStats } = useMyStats();
  const { data: myReportsData, isLoading: isLoadingReports } = useMyReports({ limit: 5 });
  const { data: publicStatsData } = usePublicStats();

  const myStats = myStatsData?.data || { total: 0, resolved: 0, pending: 0, avgResolutionTimeHours: 0 };
  const recentReports = myReportsData?.data || [];
  const publicStats = publicStatsData?.data || null;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Section */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          {greeting()}, {user?.name.split(' ')[0]}
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Here is what&apos;s happening with your neighborhood reports today, {format(new Date(), 'MMMM d, yyyy')}.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'My Reports', value: myStats.total, icon: FileText, color: 'text-[var(--primary)]', bg: 'bg-[var(--surface)]' },
          { label: 'Resolved', value: myStats.resolved, icon: CheckCircle, color: 'text-[var(--status-resolved)]', bg: 'bg-[var(--surface)]' },
          { label: 'Pending Action', value: myStats.pending, icon: Clock, color: 'text-[var(--status-pending)]', bg: 'bg-[var(--status-pending)]' },
          { label: 'Avg. Fix Time', value: myStats.avgResolutionTimeHours > 0 ? `${Math.round(myStats.avgResolutionTimeHours)}h` : '--', icon: Activity, color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--surface)]' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.color}`}>
              {isLoadingStats ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <stat.icon className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-display font-bold text-[var(--text-primary)] mt-0.5">
                {isLoadingStats ? '-' : stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Quick Actions & Recent Activity */}
        <div className="col-span-1 lg:col-span-2 space-y-8">
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/report/new" className="group relative overflow-hidden bg-[var(--primary)] p-6 rounded-2xl text-[var(--primary-fg)] shadow-sm hover:bg-[var(--primary-hover)] transition-colors border border-[var(--border)]">
              <PlusCircle className="w-8 h-8 mb-4 text-[var(--primary-fg)] opacity-90 group-hover:opacity-100 transition-opacity" />
              <h3 className="font-display font-bold text-lg mb-1">Report a Defect</h3>
              <p className="text-sm opacity-80">Found a pothole or broken light? Report it instantly.</p>
            </Link>

            <Link href="/reports" className="group relative overflow-hidden bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] hover:bg-[var(--background)] shadow-sm transition-colors">
              <Map className="w-8 h-8 mb-4 text-[var(--primary)]" />
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-1">Explore Community</h3>
              <p className="text-sm text-[var(--text-secondary)]">See what your neighbors are reporting nearby.</p>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">Recent Activity</h2>
              <Link href="/my-reports" className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="divide-y divide-[var(--border)]">
              {isLoadingReports ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="p-6 flex items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 bg-[var(--surface)] rounded flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[var(--surface)] rounded w-1/3" />
                      <div className="h-3 bg-[var(--surface)] rounded w-1/4" />
                    </div>
                  </div>
                ))
              ) : recentReports.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-[var(--text-secondary)]" />
                  </div>
                  <h3 className="font-medium text-[var(--text-primary)]">No reports yet</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1 mb-4">You haven&apos;t submitted any reports.</p>
                  <Link href="/report/new" className="text-sm font-medium text-[var(--primary)] hover:underline">
                    Create your first report
                  </Link>
                </div>
              ) : (
                recentReports.map((report: any) => (
                  <Link key={report._id} href={`/reports/${report.ticketNumber}`} className="p-4 sm:p-6 flex items-start gap-4 hover:bg-[var(--surface)] transition-colors group">
                    <div className="w-12 h-12 bg-[var(--surface)] rounded flex-shrink-0 border border-[var(--border)] overflow-hidden">
                      {report.photos && report.photos[0] ? (
                        <img src={report.photos[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-[var(--text-secondary)]">{report.ticketNumber}</span>
                        <span className="text-xs text-[var(--text-secondary)]">• {format(new Date(report.createdAt), 'MMM d')}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                        {report.title}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] truncate mt-1">
                        {report.address}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border ${getStatusColor(report.status)}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Track & Stats */}
        <div className="space-y-6">
          
          {/* Quick Track */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h2 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">Track Ticket</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Enter a ticket number to quickly view its status.</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const val = (e.currentTarget.elements.namedItem('ticket') as HTMLInputElement).value;
              if (val) window.location.href = `/reports/${val}`;
            }} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[var(--text-secondary)]" />
              </div>
              <input 
                type="text" 
                name="ticket"
                placeholder="e.g. RPT-2026-00001" 
                className="w-full pl-9 pr-10 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-btn text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none font-mono uppercase"
              />
              <button type="submit" className="absolute inset-y-1 right-1 px-2 flex items-center justify-center bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Community Pulse */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h2 className="font-display font-bold text-lg text-[var(--text-primary)] mb-4">Community Pulse</h2>
            
            {publicStats ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Total Reports</span>
                    <span className="text-lg font-bold text-[var(--text-primary)]">{publicStats.totalReports.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--primary)] w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Resolved Issues</span>
                    <span className="text-lg font-bold text-[var(--text-primary)]">{publicStats.resolvedReports.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--status-resolved)] transition-all duration-1000" style={{ width: `${(publicStats.resolvedReports / Math.max(1, publicStats.totalReports)) * 100}%` }} />
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[var(--border)]">
                  <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold">Most Active Ward</span>
                  <p className="text-[var(--text-primary)] font-medium mt-1">{publicStats.mostActiveWard || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-[var(--surface)] rounded w-full" />
                <div className="h-10 bg-[var(--surface)] rounded w-full" />
                <div className="h-10 bg-[var(--surface)] rounded w-full" />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
