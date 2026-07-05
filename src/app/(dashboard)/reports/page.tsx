'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, List, Map as MapIcon, Inbox } from 'lucide-react';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportCard, ReportCardSkeleton } from '@/components/reports/ReportCard';
import ReportMapWrapper from '@/components/map/ReportMapWrapper';
import { useReports } from '@/hooks/useReports';

function ReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // View mode
  const viewMode = searchParams.get('view') === 'map' ? 'map' : 'list';
  
  // Extract filters
  const page = parseInt(searchParams.get('page') || '1', 10);
  const filters = {
    page,
    limit: 12,
    status: searchParams.get('status') || undefined,
    severity: searchParams.get('severity') || undefined,
    type: searchParams.get('type') || undefined,
    ward: searchParams.get('ward') || undefined,
    search: searchParams.get('search') || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
  };

  const { data, isLoading, isError } = useReports(filters);

  const setViewMode = (mode: 'list' | 'map') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', mode);
    router.replace(`?${params.toString()}`);
  };

  const loadMore = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', (page + 1).toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const reports = data?.data || [];
  const hasNextPage = data?.pagination?.hasNextPage;

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-6 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--background)]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Community Reports</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Browse and support infrastructure reports in your area.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* View Toggle */}
          <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-btn p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'}`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'map' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'}`}
              title="Map View"
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>

          <Link
            href="/report/new"
            className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2 rounded-btn font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Report</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex flex-col ${viewMode === 'map' ? 'flex-grow relative overflow-hidden' : 'px-4 sm:px-6 lg:px-8 pb-12'}`}>
        
        {/* Filters - Sticky in List mode, Overlay in Map mode */}
        <div className={`${viewMode === 'map' ? 'absolute top-4 left-4 right-4 sm:right-auto sm:w-[400px] z-10 bg-[var(--background)]/95 backdrop-blur rounded-xl shadow-md border border-[var(--border)] p-4 max-h-[40vh] overflow-y-auto custom-scrollbar' : ''}`}>
          <ReportFilters />
        </div>

        {viewMode === 'list' ? (
          <div className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => <ReportCardSkeleton key={i} />)}
              </div>
            ) : isError ? (
              <div className="py-12 text-center text-[var(--status-critical)]">Failed to load reports. Please try again.</div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)] mt-4">
                <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mb-4">
                  <Inbox className="w-8 h-8 text-[var(--text-secondary)]" />
                </div>
                <h3 className="font-display font-semibold text-lg text-[var(--text-primary)] mb-1">No reports found</h3>
                <p className="text-[var(--text-secondary)] text-sm max-w-sm mb-6">
                  We couldn&apos;t find any reports matching your current filters. Be the first to report an issue in this area.
                </p>
                <Link href="/report/new" className="text-sm font-medium text-[var(--primary)] hover:underline">
                  Submit a new report &rarr;
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reports.map((report: any) => (
                    <ReportCard key={report._id} report={report} />
                  ))}
                </div>
                
                {hasNextPage && (
                  <div className="mt-8 flex justify-center">
                    <button 
                      onClick={loadMore}
                      className="px-6 py-2 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-[var(--text-secondary)] rounded-full font-medium transition-colors shadow-sm"
                    >
                      Load More Reports
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex-grow flex h-full relative">
            <ReportMapWrapper />
            
            {/* Desktop Map Side Panel */}
            <div className="hidden sm:flex absolute top-4 bottom-4 left-4 w-[400px] flex-col z-10 pt-[160px] pointer-events-none">
              <div className="bg-[var(--background)]/95 backdrop-blur rounded-xl shadow-md border border-[var(--border)] flex-grow overflow-y-auto pointer-events-auto custom-scrollbar p-3 flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] px-1 sticky top-0 bg-[var(--background)]/95 backdrop-blur py-2 z-10">
                  {reports.length} Reports in view
                </h3>
                {isLoading ? (
                  [1, 2, 3].map(i => <ReportCardSkeleton key={i} isListMode={false} />)
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-secondary)] text-sm">No reports match your filters.</div>
                ) : (
                  reports.map((report: any) => (
                    <ReportCard key={report._id} report={report} isListMode={false} />
                  ))
                )}
                {hasNextPage && (
                  <button onClick={loadMore} className="w-full py-2 text-sm text-[var(--primary)] font-medium hover:bg-[var(--surface)] rounded transition-colors">
                    Load More
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--surface)] border-t-[var(--primary)] rounded-full animate-spin"></div>
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}
