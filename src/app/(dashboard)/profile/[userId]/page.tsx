'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { MapPin, Calendar, FileText, CheckCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';

const SEVERITY_COLOR: Record<string, string> = {
  low:      'bg-blue-100 text-blue-700',
  medium:   'bg-yellow-100 text-yellow-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const STATUS_COLOR: Record<string, string> = {
  open:         'bg-slate-100 text-slate-700',
  under_review: 'bg-purple-100 text-purple-700',
  in_progress:  'bg-blue-100 text-blue-700',
  resolved:     'bg-emerald-100 text-emerald-700',
};

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();

  const { data: profile, isLoading, isError } = useQuery<any>({
    queryKey: ['public-profile', userId],
    queryFn: () => axios.get(`/api/users/${userId}/public`).then(r => r.data.data),
    retry: 1,
  });

  if (isLoading) return <PublicProfileSkeleton />;

  if (isError || !profile) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Profile Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">This user doesn't exist or their account is inactive.</p>
        <Link href="/reports" className="mt-6 text-sm text-brand-600 hover:underline">
          Browse community reports →
        </Link>
      </div>
    );
  }

  const initial = profile.name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* ─── Profile Header ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-700" />

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-14">
            {/* Avatar */}
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                {initial}
              </div>
            )}

            {/* Info */}
            <div className="mt-4 sm:mt-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 font-display">{profile.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 capitalize">
                      {profile.role?.replace('_', ' ')}
                    </span>
                    {profile.ward && (
                      <span className="flex items-center text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {profile.ward}
                      </span>
                    )}
                    <span className="flex items-center text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      Member since {format(new Date(profile.joinedDate), 'MMM yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <FileText className="w-5 h-5 text-brand-500 mr-2" />
                <span className="text-2xl font-bold text-slate-900">{profile.stats.totalReports}</span>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Reports Submitted</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle className="w-5 h-5 text-emerald-500 mr-2" />
                <span className="text-2xl font-bold text-slate-900">{profile.stats.resolvedReports}</span>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Issues Resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Recent Reports ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Recent Reports</h2>
          <p className="text-sm text-slate-500 mt-0.5">Latest civic issues submitted by {profile.name}</p>
        </div>

        {profile.recentReports?.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No reports yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {profile.recentReports?.map((r: any) => (
              <li key={r._id}>
                <Link
                  href={`/reports/${r._id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${SEVERITY_COLOR[r.severity] ?? 'bg-slate-100 text-slate-600'}`}>
                        {r.severity}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${STATUS_COLOR[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {r.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate">{r.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {r.address} · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 flex-shrink-0">
                    {r.upvoteCount > 0 && (
                      <span className="text-xs font-medium">▲ {r.upvoteCount}</span>
                    )}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PublicProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-28 bg-slate-200 animate-pulse" />
        <div className="px-6 pb-6 -mt-12 space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
        {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    </div>
  );
}
