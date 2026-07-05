'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  TrendingUp,
  Users,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Medal,
} from 'lucide-react';

import { MetricCard } from '@/components/charts/MetricCard';
import { AreaTrendChart } from '@/components/charts/AreaTrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { HorizontalBarChart } from '@/components/charts/HorizontalBarChart';
import { Skeleton } from '@/components/ui/Skeleton';

// Leaflet map loaded client-side only
const HotspotMap = dynamic(() => import('@/components/analytics/HotspotMap'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px] rounded-xl" />,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d';
type WardSortKey = 'ward' | 'total' | 'open' | 'resolved' | 'avgResolutionTimeHours' | 'resolutionRate';

const REPORT_TYPE_COLORS: Record<string, string> = {
  pothole:          '#2563EB',
  crack:            '#7c3aed',
  road_collapse:    '#dc2626',
  broken_signage:   '#d97706',
  flooding:         '#0891b2',
  debris:           '#65a30d',
  faded_markings:   '#9333ea',
  broken_guardrail: '#e11d48',
  other:            '#94a3b8',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high:     '#ea580c',
  medium:   '#d97706',
  low:      '#16a34a',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolutionRateColor(rate: number) {
  if (rate >= 80) return { bar: 'bg-green-500', text: 'text-green-700' };
  if (rate >= 50) return { bar: 'bg-yellow-500', text: 'text-yellow-700' };
  return { bar: 'bg-red-500', text: 'text-red-700' };
}

function SortIcon({ column, sortKey, dir }: { column: WardSortKey; sortKey: WardSortKey; dir: 'asc' | 'desc' }) {
  if (column !== sortKey) return <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />;
  return dir === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-brand-600" /> : <ChevronDown className="h-3.5 w-3.5 text-brand-600" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [wardSort, setWardSort] = useState<WardSortKey>('total');
  const [wardDir, setWardDir] = useState<'asc' | 'desc'>('desc');

  // ── Data Fetching ─────────────────────────────────────────────────────────
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics-summary', period],
    queryFn: () => axios.get(`/api/analytics/summary?period=${period}`).then(r => r.data),
  });

  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ['analytics-trends', period],
    queryFn: () => axios.get(`/api/analytics/trends?period=${period}&groupBy=day`).then(r => r.data),
  });

  const { data: byWard, isLoading: loadingWard } = useQuery({
    queryKey: ['analytics-by-ward'],
    queryFn: () => axios.get('/api/analytics/by-ward').then(r => r.data),
  });

  const { data: hotspots, isLoading: loadingHotspots } = useQuery({
    queryKey: ['analytics-hotspots'],
    queryFn: () => axios.get('/api/analytics/hotspots').then(r => r.data),
  });

  const { data: crewPerf, isLoading: loadingCrew } = useQuery({
    queryKey: ['analytics-crew-performance'],
    queryFn: () => axios.get('/api/analytics/crew-performance').then(r => r.data?.data),
  });

  // ── Derived Data ──────────────────────────────────────────────────────────

  const typeData = useMemo(() => {
    if (!summary?.statusDistribution) return [];
    // We need type breakdown — from statusDistribution the summary doesn't include type.
    // We'll return an empty array here; summary only has statusDistribution & severityDistribution.
    // The type breakdown would need a dedicated endpoint. For now use statusDistribution.
    return [];
  }, [summary]);

  const severityData = useMemo(() => {
    if (!summary?.severityDistribution) return [];
    const order = ['critical', 'high', 'medium', 'low'];
    return order
      .filter(s => summary.severityDistribution[s] !== undefined)
      .map(s => ({
        name: s.charAt(0).toUpperCase() + s.slice(1),
        value: summary.severityDistribution[s] || 0,
        color: SEVERITY_COLORS[s],
      }));
  }, [summary]);

  // Ward table with computed resolution rate + sorting
  const wardRows = useMemo(() => {
    if (!byWard) return [];
    const rows = (byWard as any[]).map(w => ({
      ...w,
      resolutionRate: w.total > 0 ? Math.round((w.resolved / w.total) * 100) : 0,
    }));
    return [...rows].sort((a, b) => {
      const av = a[wardSort] ?? 0;
      const bv = b[wardSort] ?? 0;
      if (typeof av === 'string') return wardDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return wardDir === 'asc' ? av - bv : bv - av;
    });
  }, [byWard, wardSort, wardDir]);

  const handleWardSort = (col: WardSortKey) => {
    if (wardSort === col) setWardDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setWardSort(col); setWardDir('desc'); }
  };

  // KPI computed values
  const totalReports = summary?.totalReports ?? 0;
  const resolved = summary?.statusDistribution?.resolved ?? 0;
  const avgResolution = summary?.avgResolutionTimeHours
    ? parseFloat(summary.avgResolutionTimeHours.toFixed(1))
    : 0;
  const slaBreaches = summary?.slaBreaches ?? 0;
  const totalTickets = resolved + slaBreaches;
  const slaCompliance = totalTickets > 0 ? Math.round(((totalTickets - slaBreaches) / totalTickets) * 100) : 100;
  const activeWards = byWard ? byWard.length : 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            Analytics & Insights
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Operational intelligence across reports, wards, and crew.
          </p>
        </div>
        {/* Period Selector */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          {(['7d', '30d', '90d'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === p
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 1: KPI Row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard
          label="Total Reports"
          value={totalReports.toLocaleString()}
          icon={<FileText className="h-4 w-4" />}
          loading={loadingSummary}
        />
        <MetricCard
          label="Resolved"
          value={resolved.toLocaleString()}
          icon={<CheckCircle2 className="h-4 w-4" />}
          loading={loadingSummary}
        />
        <MetricCard
          label="Avg Resolution"
          value={avgResolution > 0 ? `${avgResolution}h` : '—'}
          subValue="hours per report"
          icon={<Clock className="h-4 w-4" />}
          loading={loadingSummary}
        />
        <MetricCard
          label="SLA Compliance"
          value={`${slaCompliance}%`}
          subValue={`${slaBreaches} breach${slaBreaches !== 1 ? 'es' : ''}`}
          icon={<ShieldCheck className="h-4 w-4" />}
          loading={loadingSummary}
        />
        <MetricCard
          label="Active Wards"
          value={activeWards}
          subValue="with report activity"
          icon={<MapPin className="h-4 w-4" />}
          loading={loadingWard}
        />
      </div>

      {/* ── Section 2: Trend Chart ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-900 font-display">Report Trends</h2>
          <span className="ml-auto text-xs font-medium text-slate-400">
            Submitted vs Resolved over time
          </span>
        </div>
        <AreaTrendChart data={trends || []} loading={loadingTrends} height={280} />
      </div>

      {/* ── Section 3: Type + Severity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 font-display mb-6">Reports by Severity</h2>
          <HorizontalBarChart data={severityData} loading={loadingSummary} height={200} />
        </div>

        {/* Type (from trends - we'll show status breakdown instead since type needs a new endpoint) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 font-display mb-6">Reports by Status</h2>
          {loadingSummary ? (
            <Skeleton className="w-full h-64 rounded-xl" />
          ) : (
            <DonutChart
              data={
                summary?.statusDistribution
                  ? Object.entries(summary.statusDistribution)
                      .filter(([, v]) => (v as number) > 0)
                      .map(([k, v]) => ({
                        name: k.replace(/_/g, ' '),
                        value: v as number,
                        color: k === 'resolved' ? '#16a34a' :
                               k === 'open' ? '#2563EB' :
                               k === 'in_progress' ? '#d97706' :
                               k === 'under_review' ? '#7c3aed' :
                               k === 'rejected' ? '#dc2626' :
                               '#94a3b8',
                      }))
                  : []
              }
              height={200}
            />
          )}
        </div>
      </div>

      {/* ── Section 4: Ward Performance Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-600" />
            Ward Performance
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {(
                  [
                    { key: 'ward', label: 'Ward' },
                    { key: 'total', label: 'Total' },
                    { key: 'open', label: 'Open' },
                    { key: 'resolved', label: 'Resolved' },
                    { key: 'avgResolutionTimeHours', label: 'Avg Resolution' },
                    { key: 'resolutionRate', label: 'Resolution Rate' },
                  ] as { key: WardSortKey; label: string }[]
                ).map(col => (
                  <th
                    key={col.key}
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 transition-colors"
                    onClick={() => handleWardSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon column={col.key} sortKey={wardSort} dir={wardDir} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {loadingWard
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-3">
                          <Skeleton className="h-4 w-16" />
                        </td>
                      ))}
                    </tr>
                  ))
                : wardRows.map((row, i) => {
                    const rr = resolutionRateColor(row.resolutionRate);
                    return (
                      <tr key={row.ward} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 text-sm font-semibold text-slate-900">{row.ward}</td>
                        <td className="px-6 py-3 text-sm text-slate-700">{row.total}</td>
                        <td className="px-6 py-3 text-sm text-slate-700">{row.open}</td>
                        <td className="px-6 py-3 text-sm text-slate-700">{row.resolved}</td>
                        <td className="px-6 py-3 text-sm text-slate-700">
                          {row.avgResolutionTimeHours > 0
                            ? `${row.avgResolutionTimeHours.toFixed(1)}h`
                            : '—'}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 min-w-[60px]">
                              <div
                                className={`h-2 rounded-full ${rr.bar} transition-all`}
                                style={{ width: `${row.resolutionRate}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${rr.text} w-9 text-right`}>
                              {row.resolutionRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              {!loadingWard && wardRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">
                    No ward data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 5: Hotspot Map ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-500" />
            Hotspot Intelligence Map
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500 opacity-80 inline-block" /> Critical
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-orange-500 opacity-80 inline-block" /> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-400 opacity-80 inline-block" /> Medium/Low
            </span>
          </div>
        </div>
        <HotspotMap hotspots={hotspots || []} loading={loadingHotspots} />
      </div>

      {/* ── Section 6: Crew Performance Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-600" />
            Crew Performance
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Crew Member</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SLA Compliance</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Completion</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {loadingCrew
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-6 py-3">
                          <Skeleton className="h-4 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : (crewPerf as any[] || []).map((member, idx) => {
                    const isTopPerformer = idx === 0 && member.slaComplianceRate !== null;
                    const cr = resolutionRateColor(member.slaComplianceRate ?? 0);
                    return (
                      <tr
                        key={member.crewMemberId}
                        className={`transition-colors ${isTopPerformer ? 'bg-green-50 hover:bg-green-50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            {member.avatar ? (
                              <img src={member.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                                {member.name?.[0] || '?'}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-sm text-slate-900">{member.name}</span>
                                {isTopPerformer && (
                                  <span title="Top Performer">
                                    <Medal className="h-4 w-4 text-amber-500" />
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-700">{member.totalAssigned}</td>
                        <td className="px-6 py-3 text-sm text-slate-700">{member.completedCount}</td>
                        <td className="px-6 py-3">
                          {member.slaComplianceRate !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-2 min-w-[50px]">
                                <div
                                  className={`h-2 rounded-full ${cr.bar} transition-all`}
                                  style={{ width: `${member.slaComplianceRate}%` }}
                                />
                              </div>
                              <span className={`text-xs font-semibold ${cr.text} w-10 text-right`}>
                                {member.slaComplianceRate.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No completions</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-700">
                          {member.avgCompletionHours !== null
                            ? `${member.avgCompletionHours.toFixed(1)}h`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
              {!loadingCrew && (!crewPerf || crewPerf.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">
                    No crew performance data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
