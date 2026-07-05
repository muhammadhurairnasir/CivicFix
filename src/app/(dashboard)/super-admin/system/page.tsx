'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Server, Cpu, Activity, Database, CheckCircle, XCircle, 
  Play, RefreshCw, Layers, HardDrive
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';

export default function SuperAdminSystemPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [jobResult, setJobResult] = useState<{ type: string; message: string; data?: any } | null>(null);

  React.useEffect(() => {
    if (!authLoading && user && user.role !== UserRole.SUPER_ADMIN) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const { data: sysInfo, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['super-admin-system'],
    queryFn: async () => (await axios.get('/api/super-admin/system')).data.data,
    refetchInterval: 30000, // Refresh every 30s
  });

  const jobMutation = useMutation({
    mutationFn: async (job: string) => {
      const res = await axios.post('/api/super-admin/system', { job });
      return { type: job, ...res.data };
    },
    onSuccess: (data) => {
      setJobResult({ type: data.type, message: data.message, data: data.data });
      setTimeout(() => setJobResult(null), 10000);
    },
    onError: (err: any) => {
      alert(`Job failed: ${err.response?.data?.error || err.message}`);
    }
  });

  if (authLoading || !user || user.role !== UserRole.SUPER_ADMIN) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
  };

  const heapUsed = sysInfo?.memoryUsage?.heapUsed || 0;
  const heapTotal = sysInfo?.memoryUsage?.heapTotal || 1; // Prevent div by zero
  const memPercent = Math.round((heapUsed / heapTotal) * 100);
  
  let memColor = 'bg-emerald-500';
  if (memPercent > 70) memColor = 'bg-yellow-500';
  if (memPercent > 85) memColor = 'bg-red-500';

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display flex items-center">
            <Server className="w-6 h-6 mr-3 text-brand-600" />
            System Internals
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-9">Server metrics, memory usage, and background jobs</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3 items-center">
          <div className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
            sysInfo?.environment === 'production' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            {sysInfo?.environment || '...'}
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Memory Box */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center">
              <Cpu className="w-4 h-4 mr-2 text-slate-400" /> Memory Usage (Heap)
            </h3>
            {isLoading ? <Skeleton className="h-4 w-12" /> : <span className="text-sm font-medium text-slate-600">{memPercent}%</span>}
          </div>
          {isLoading ? (
            <Skeleton className="h-2 w-full mt-4" />
          ) : (
            <>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mt-4">
                <div className={`${memColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${memPercent}%` }}></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{formatBytes(heapUsed)} Used</span>
                <span>{formatBytes(heapTotal)} Total</span>
              </div>
            </>
          )}
        </div>

        <InfoCard title="Server Uptime" value={isLoading ? null : formatUptime(sysInfo?.uptime)} icon={<Activity className="text-blue-500" />} />
        <InfoCard title="Node Version" value={isLoading ? null : sysInfo?.nodeVersion} icon={<Layers className="text-purple-500" />} />
        <InfoCard title="Next.js" value={isLoading ? null : `v${sysInfo?.nextVersion}`} icon={<Layers className="text-slate-500" />} />
        <InfoCard title="Mongoose" value={isLoading ? null : `v${sysInfo?.mongooseVersion}`} icon={<Database className="text-emerald-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Connections */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-4">Infrastructure Connections</h2>
          
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-emerald-600 mr-4" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">MongoDB Cluster</h4>
                {isLoading ? <Skeleton className="h-4 w-32 mt-1" /> : (
                  <p className="text-xs text-slate-500 mt-1">DB: {sysInfo?.mongodb?.dbName} • {sysInfo?.mongodb?.collectionsCount} Collections</p>
                )}
              </div>
            </div>
            {isLoading ? <Skeleton className="h-6 w-6 rounded-full" /> : (
              sysInfo?.mongodb?.connected ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-red-500" />
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center">
              <HardDrive className="w-8 h-8 text-red-600 mr-4" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Redis Cache</h4>
                {isLoading ? <Skeleton className="h-4 w-32 mt-1" /> : (
                  <p className="text-xs text-slate-500 mt-1">{sysInfo?.redis?.keyCount} Active Keys</p>
                )}
              </div>
            </div>
            {isLoading ? <Skeleton className="h-6 w-6 rounded-full" /> : (
              sysInfo?.redis?.connected ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-red-500" />
            )}
          </div>
        </div>

        {/* Manual Jobs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-4">Manual Job Triggers</h2>
          <p className="text-sm text-slate-500 mt-4 mb-6">
            These jobs typically run automatically in the background via Cron. You can trigger them manually here for debugging or immediate updates.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-brand-300 transition-colors">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">SLA Watcher Check</h4>
                <p className="text-xs text-slate-500 mt-1">Scans all open tickets for SLA breaches and warnings.</p>
              </div>
              <Button 
                size="sm" 
                onClick={() => jobMutation.mutate('sla-check')}
                disabled={jobMutation.isPending}
              >
                {jobMutation.isPending && jobMutation.variables === 'sla-check' ? 'Running...' : <><Play className="w-4 h-4 mr-1" /> Run</>}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-brand-300 transition-colors">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Aggregate Analytics</h4>
                <p className="text-xs text-slate-500 mt-1">Re-compiles summary metrics and ward statistics.</p>
              </div>
              <Button 
                size="sm" 
                onClick={() => jobMutation.mutate('stats-aggregate')}
                disabled={jobMutation.isPending}
              >
                {jobMutation.isPending && jobMutation.variables === 'stats-aggregate' ? 'Running...' : <><Play className="w-4 h-4 mr-1" /> Run</>}
              </Button>
            </div>
          </div>

          {jobResult && (
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center">
                <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                {jobResult.message}
              </h4>
              {jobResult.data && (
                <pre className="mt-3 text-xs text-slate-600 bg-white p-3 rounded border border-slate-100 overflow-x-auto">
                  {JSON.stringify(jobResult.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function InfoCard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      {value === null ? (
        <Skeleton className="h-6 w-20" />
      ) : (
        <p className="text-lg font-bold text-slate-900 font-mono tracking-tight">{value}</p>
      )}
    </div>
  );
}
