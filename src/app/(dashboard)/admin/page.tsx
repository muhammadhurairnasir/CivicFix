'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText,
  MapPin,
  TrendingUp,
  X
} from 'lucide-react';
import { format } from 'date-fns';

import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

// -- Mock data for recent reports since we don't have a specific recent-reports API,
// but we can just use the reports queue API `GET /api/admin/reports?limit=10`.
const fetchSummary = async () => (await axios.get('/api/analytics/summary')).data;
const fetchRecentReports = async () => (await axios.get('/api/admin/reports?limit=10')).data.data;
const fetchWardStats = async () => (await axios.get('/api/analytics/by-ward')).data;

export default function AdminOverviewPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [showSlaAlert, setShowSlaAlert] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Role Guard
  useEffect(() => {
    if (!authLoading && user && ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role as any)) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: fetchSummary,
    refetchInterval: 60000,
  });

  const { data: recentReports, isLoading: loadingRecent } = useQuery({
    queryKey: ['admin-reports', 'recent'],
    queryFn: fetchRecentReports,
    refetchInterval: 60000,
  });

  const { data: wardStats, isLoading: loadingWards } = useQuery({
    queryKey: ['analytics-ward'],
    queryFn: fetchWardStats,
    refetchInterval: 60000,
  });

  if (authLoading || (!user && !authLoading)) return null;
  if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user?.role as any)) return null;

  const chartData = summary ? Object.entries(summary.statusDistribution).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value
  })) : [];

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Operations Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time overview of civic repair network</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
          <Clock className="w-4 h-4 mr-2 text-slate-400" />
          {format(currentTime, 'EEEE, MMM d — h:mm a')}
        </div>
      </div>

      {/* SLA Breach Alert */}
      {summary?.slaBreaches > 0 && showSlaAlert && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start justify-between">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">SLA Breaches Detected</h3>
              <p className="mt-1 text-sm text-red-700">
                There are {summary.slaBreaches} active tickets that have breached their SLA deadlines. Action required immediately.
              </p>
            </div>
          </div>
          <button onClick={() => setShowSlaAlert(false)} className="text-red-500 hover:text-red-700">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* KPIs Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard 
          title="Total Reports" 
          value={summary?.totalReports} 
          icon={<FileText className="text-blue-600" />} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="Open Reports" 
          value={summary?.statusDistribution?.open || 0} 
          icon={<Activity className="text-orange-600" />} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="SLA Breaches" 
          value={summary?.slaBreaches} 
          icon={<AlertTriangle className={summary?.slaBreaches > 0 ? "text-red-600" : "text-green-600"} />} 
          loading={loadingSummary}
          valueClassName={summary?.slaBreaches > 0 ? "text-red-600" : "text-slate-900"}
        />
        <StatCard 
          title="Resolved (Month)" 
          value={summary?.thisMonthReports} 
          icon={<CheckCircle2 className="text-green-600" />} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="Avg Resolution Time" 
          value={summary?.avgResolutionTimeHours ? `${summary.avgResolutionTimeHours.toFixed(1)}h` : '0h'} 
          icon={<TrendingUp className="text-purple-600" />} 
          loading={loadingSummary} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - 65% on Desktop */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-semibold text-slate-900 font-display">Recent Reports</h2>
              <Button variant="link" onClick={() => router.push('/admin/reports')}>View All</Button>
            </div>
            <div className="overflow-x-auto p-0">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Ticket #</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Severity</th>
                    <th className="px-6 py-3 font-medium">Ward</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingRecent ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="px-6 py-4"><Skeleton className="h-5 w-full" /></td></tr>
                    ))
                  ) : recentReports?.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No reports found.</td></tr>
                  ) : (
                    recentReports?.map((r: any) => (
                      <tr key={r._id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 font-medium text-brand-600">{r.ticketNumber}</td>
                        <td className="px-6 py-3 capitalize">{r.type.replace('_', ' ')}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            r.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            r.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            r.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {r.severity}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-500">{r.ward}</td>
                        <td className="px-6 py-3 capitalize">{r.status.replace('_', ' ')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - 35% on Desktop */}
        <div className="space-y-6">
          
          {/* Chart */}
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 font-display mb-6">Reports by Status</h2>
            <div className="h-64 w-full">
              {loadingSummary ? (
                <Skeleton className="h-full w-full" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.name === 'OPEN' ? '#f97316' : 
                          entry.name === 'RESOLVED' ? '#22c55e' : 
                          entry.name === 'IN PROGRESS' ? '#3b82f6' : 
                          '#cbd5e1'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">No data available</div>
              )}
            </div>
          </div>

          {/* Hotspots */}
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 font-display mb-4 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-brand-500" />
              Top Hotspots
            </h2>
            <div className="space-y-4">
              {loadingWards ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              ) : wardStats && wardStats.length > 0 ? (
                wardStats.slice(0, 3).map((w: any, idx: number) => (
                  <div key={w.ward} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm mr-3">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-900">{w.ward}</div>
                        <div className="text-xs text-slate-500">{w.open} open, {w.resolved} resolved</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">{w.total}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Reports</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500 py-4 text-center">No ward data available.</div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

function StatCard({ title, value, icon, loading, valueClassName = "text-slate-900" }: any) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      <div className="mt-4">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className={`text-3xl font-bold font-display tracking-tight ${valueClassName}`}>
            {value !== undefined ? value : '--'}
          </p>
        )}
      </div>
    </div>
  );
}
