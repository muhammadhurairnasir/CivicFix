'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, FilterX } from 'lucide-react';
import { ReportStatus, ReportType, Severity } from '@/types';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function ReportFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for instant UI updates
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 300);

  const currentStatus = searchParams.get('status') || '';
  const currentType = searchParams.get('type') || '';
  const currentSeverity = searchParams.get('severity') || '';
  const currentWard = searchParams.get('ward') || '';
  const currentSortBy = searchParams.get('sortBy') || 'createdAt';
  const currentSortOrder = searchParams.get('sortOrder') || 'desc';

  // Count active filters (excluding default sort and pagination)
  let activeFilterCount = 0;
  if (currentStatus) activeFilterCount++;
  if (currentType) activeFilterCount++;
  if (currentSeverity) activeFilterCount++;
  if (currentWard) activeFilterCount++;
  if (debouncedSearch) activeFilterCount++;

  // Sync state to URL
  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    // Always reset to page 1 when changing filters
    params.delete('page');

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  // Sync debounced search
  useEffect(() => {
    if (debouncedSearch !== (searchParams.get('search') || '')) {
      updateFilters({ search: debouncedSearch || null });
    }
  }, [debouncedSearch, searchParams, updateFilters]);

  const clearAll = () => {
    setSearch('');
    router.replace(pathname);
  };

  const statusOptions = [
    { label: 'All', value: '' },
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Resolved', value: 'resolved' },
  ];

  return (
    <div className="flex flex-col gap-4 w-full bg-[var(--background)] pb-2 z-10 sticky top-0 border-b border-[var(--border)] pt-4">
      {/* Top Row: Search and Quick Status Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[var(--text-secondary)]" />
          </div>
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-input text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--primary)] focus:ring-[var(--shadow-focus)] outline-none transition-all"
          />
        </div>

        {/* Status Button Group */}
        <div className="flex overflow-x-auto no-scrollbar w-full sm:w-auto bg-[var(--surface)] border border-[var(--border)] rounded-btn p-1">
          {statusOptions.map((opt) => {
            const isActive = currentStatus === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateFilters({ status: opt.value })}
                className={`flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                  isActive 
                    ? 'bg-[var(--primary)] text-white shadow-sm' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Dropdowns */}
      <div className="flex flex-wrap gap-3 items-center w-full">
        <select
          value={currentType}
          onChange={(e) => updateFilters({ type: e.target.value })}
          className="appearance-none bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-sm rounded-btn px-3 py-2 pr-8 focus:outline-none focus:border-[var(--primary)] cursor-pointer"
        >
          <option value="">All Types</option>
          {Object.values(ReportType).map(type => (
            <option key={type} value={type}>{type.replace('_', ' ')}</option>
          ))}
        </select>

        <select
          value={currentSeverity}
          onChange={(e) => updateFilters({ severity: e.target.value })}
          className="appearance-none bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-sm rounded-btn px-3 py-2 pr-8 focus:outline-none focus:border-[var(--primary)] cursor-pointer"
        >
          <option value="">All Severities</option>
          {Object.values(Severity).map(sev => (
            <option key={sev} value={sev} className="capitalize">{sev}</option>
          ))}
        </select>

        <div className="relative">
          <input
            type="text"
            placeholder="Filter by Ward..."
            value={currentWard}
            onChange={(e) => updateFilters({ ward: e.target.value })}
            className="w-32 sm:w-40 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-btn text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--primary)] outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-sm font-medium text-[var(--status-critical)] hover:text-[var(--status-critical)] transition-colors"
            >
              <FilterX className="w-4 h-4" />
              <span className="hidden sm:inline">Clear filters</span>
              <span className="flex items-center justify-center w-5 h-5 bg-[var(--background)] text-[var(--status-critical)] rounded-full text-[10px]">
                {activeFilterCount}
              </span>
            </button>
          )}

          <select
            value={`${currentSortBy}|${currentSortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('|');
              updateFilters({ sortBy, sortOrder });
            }}
            className="appearance-none bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] font-medium text-sm rounded-btn px-3 py-2 pr-8 focus:outline-none focus:border-[var(--primary)] cursor-pointer"
          >
            <option value="createdAt|desc">Newest First</option>
            <option value="createdAt|asc">Oldest First</option>
            <option value="upvoteCount|desc">Most Upvoted</option>
            <option value="viewCount|desc">Most Viewed</option>
          </select>
        </div>
      </div>
    </div>
  );
}
