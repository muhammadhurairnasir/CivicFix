'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { 
  Users, FileText, CheckCircle, Radio, Database, HardDrive, 
  Server, ShieldCheck, Activity, UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

const fetchStats = async () => (await axios.get('/api/super-admin/stats')).data.data;
const fetchRecentUsers = async () => (await axios.get('/api/super-admin/users?limit=10&sortBy=createdAt&sortOrder=desc')).data.data;

export default function SuperAdminOverviewPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && user.role !== UserRole.SUPER_ADMIN) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: fetchStats,
    refetchInterval: 30000,
  });

  const { data: recentUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['super-admin-users-recent'],
    queryFn: fetchRecentUsers,
  });

  if (authLoading || (!user && !authLoading) || user?.role !== UserRole.SUPER_ADMIN) return null;

  const totalUsersSum = stats?.totalUsers 
    ? Object.values(stats.totalUsers).reduce((a: any, b: any) => a + b, 0) as number 
    : 0;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display flex items-center">
            <ShieldCheck className="w-7 h-7 mr-3 text-brand-600" />
            Super Admin — Platform Control
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-10">Global overview of system performance and usage</p>
        </div>
      </div>

      {/* System Health Row */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-slate-500" /> System Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HealthCard 
            title="Database (MongoDB)" 
            icon={<Database className="text-blue-500" />} 
            health={stats?.systemHealth?.db} 
            loading={loadingStats} 
          />
          <HealthCard 
            title="Cache (Redis)" 
            icon={<Server className="text-red-500" />} 
            health={stats?.systemHealth?.redis} 
            loading={loadingStats} 
          />
          <HealthCard 
            title="Storage (Cloudinary)" 
            icon={<HardDrive className="text-purple-500" />} 
            health={stats?.systemHealth?.storage} 
            loading={loadingStats} 
            extra={`${((stats?.storageUsed || 0) / (1024 * 1024)).toFixed(2)} MB`}
          />
        </div>
      </div>

      {/* Platform Stats Row */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 mt-6">Platform Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={totalUsersSum} icon={<Users className="text-indigo-600" />} loading={loadingStats} />
          <StatCard title="Total Reports" value={stats?.totalReports} icon={<FileText className="text-orange-600" />} loading={loadingStats} />
          <StatCard title="Resolved Issues" value={stats?.totalResolved} icon={<CheckCircle className="text-emerald-600" />} loading={loadingStats} />
          <StatCard title="Active Sessions" value={stats?.activeSessionsCount} icon={<Radio className="text-pink-600" />} loading={loadingStats} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Roles Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-6 font-display">Users by Role</h3>
          {loadingStats ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            <div className="space-y-5">
              <RoleBar label="Citizens" count={stats?.totalUsers?.citizen || 0} total={totalUsersSum} color="bg-blue-500" />
              <RoleBar label="Crew Members" count={stats?.totalUsers?.crew || 0} total={totalUsersSum} color="bg-orange-500" />
              <RoleBar label="Administrators" count={stats?.totalUsers?.admin || 0} total={totalUsersSum} color="bg-emerald-500" />
              <RoleBar label="Super Admins" count={stats?.totalUsers?.super_admin || 0} total={totalUsersSum} color="bg-purple-600" />
            </div>
          )}
        </div>

        {/* Recent Registrations */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="text-base font-semibold text-slate-900 font-display flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-slate-500" />
              Recent Registrations
            </h3>
            <Button variant="secondary" size="sm" onClick={() => router.push('/super-admin/users')}>View All</Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loadingUsers ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={4} className="px-6 py-4"><Skeleton className="h-5 w-full" /></td></tr>
                  ))
                ) : recentUsers?.map((u: any) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs mr-3">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{u.name}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                        ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'admin' ? 'bg-emerald-100 text-emerald-800' :
                          u.role === 'crew' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center space-x-2">
                        {u.isActive ? (
                          <span className="w-2 h-2 rounded-full bg-green-500" title="Active"></span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-red-500" title="Inactive"></span>
                        )}
                        {u.isVerified && <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Verified</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function HealthCard({ title, icon, health, loading, extra }: any) {
  if (loading || !health) return <Skeleton className="h-24 w-full rounded-xl" />;
  
  const isHealthy = health.status === 'healthy';

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div className="flex items-center">
        <div className="p-3 bg-slate-50 rounded-lg mr-4">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <div className="flex items-center mt-1">
            <span className={`w-2.5 h-2.5 rounded-full mr-2 ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            <span className={`text-sm font-semibold ${isHealthy ? 'text-emerald-700' : 'text-red-700'} capitalize`}>
              {health.status}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right">
        {health.ms > 0 && <div className="text-xs text-slate-400 font-mono">{health.ms}ms</div>}
        {extra && <div className="text-xs text-slate-500 mt-1">{extra}</div>}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, loading }: any) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <p className="text-3xl font-bold font-display tracking-tight text-slate-900">
          {value !== undefined ? value.toLocaleString() : '--'}
        </p>
      )}
    </div>
  );
}

function RoleBar({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{count} ({percentage}%)</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
