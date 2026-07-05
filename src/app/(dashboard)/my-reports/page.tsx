'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  FileText, Edit, Trash2, Eye, MapPin, 
  Search, SlidersHorizontal, ChevronLeft, ChevronRight,
  AlertCircle, PlusCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMyReports, useDeleteReport } from '@/hooks/useReports';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function MyReportsPage() {
  const { user } = useAuth();
  
  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Data
  const { data: reportsData, isLoading } = useMyReports({
    page,
    limit: 10,
    status: statusFilter,
    search: debouncedSearch,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const deleteMutation = useDeleteReport();

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{ id: string; ticketNumber: string } | null>(null);

  const reports = reportsData?.data || [];
  const pagination = reportsData?.pagination;

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;
    try {
      await deleteMutation.mutateAsync(reportToDelete.id);
      setDeleteModalOpen(false);
      setReportToDelete(null);
      // Refresh page if last item deleted
      if (reports.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const StatusTabs = () => {
    const tabs = [
      { label: 'All', value: '' },
      { label: 'Open', value: 'open' },
      { label: 'In Progress', value: 'in_progress' },
      { label: 'Resolved', value: 'resolved' },
      { label: 'Closed', value: 'closed' },
    ];

    return (
      <div className="flex space-x-1 p-1 bg-[var(--surface)] rounded-xl w-full max-w-full overflow-x-auto custom-scrollbar border border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              statusFilter === tab.value 
                ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">My Reports</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Manage and track the issues you&apos;ve reported.</p>
        </div>
        <Link 
          href="/report/new" 
          className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2.5 rounded-btn font-medium transition-colors text-sm shadow-sm flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" /> New Report
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <StatusTabs />
        
        <div className="relative w-full lg:w-72 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] w-4 h-4" />
          <input
            type="text"
            placeholder="Search my reports..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-btn text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none"
          />
        </div>
      </div>

      {/* Reports Content */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        
        {/* Loading State */}
        {isLoading && (
          <div className="divide-y divide-[var(--border)] animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-4 sm:p-6 flex items-center gap-4">
                <div className="w-16 h-16 bg-[var(--surface)] rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--surface)] rounded w-1/4" />
                  <div className="h-4 bg-[var(--surface)] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && reports.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border)]">
              <AlertCircle className="w-8 h-8 text-[var(--text-secondary)]" />
            </div>
            <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">No reports found</h3>
            <p className="text-[var(--text-secondary)] text-sm mt-1 mb-6 max-w-sm mx-auto">
              {search || statusFilter ? "We couldn&apos;t find any reports matching your filters." : "You haven&apos;t submitted any reports yet."}
            </p>
            {search || statusFilter ? (
              <button 
                onClick={() => { setSearch(''); setStatusFilter(''); }}
                className="text-[var(--primary)] text-sm font-medium hover:underline"
              >
                Clear all filters
              </button>
            ) : (
              <Link href="/report/new" className="text-[var(--primary)] text-sm font-medium hover:underline">
                Report your first issue
              </Link>
            )}
          </div>
        )}

        {/* Desktop Table View */}
        {!isLoading && reports.length > 0 && (
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface)] border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold">
                  <th className="p-4 pl-6">Report</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Filed</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {reports.map((report: any) => (
                  <tr key={report._id} className="hover:bg-[var(--surface)]/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[var(--surface)] overflow-hidden border border-[var(--border)] flex-shrink-0">
                          {report.photos && report.photos[0] ? (
                            <img src={report.photos[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-full h-full p-2 text-[var(--text-secondary)]" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--text-primary)] truncate max-w-xs" title={report.title}>{report.title}</div>
                          <div className="text-xs text-[var(--text-secondary)] font-mono">{report.ticketNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)] capitalize">
                      {report.type?.replace('_', ' ')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border ${getStatusColor(report.status)}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {format(new Date(report.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/reports/${report.ticketNumber}`}
                          className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface)] rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {report.status === 'open' && (
                          <>
                            {/* Wait, we don't have an edit route yet, but we'll add the link structure */}
                            <Link 
                              href={`/report/edit/${report.ticketNumber}`}
                              className="p-2 text-[var(--text-secondary)] hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Report"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button 
                              onClick={() => {
                                setReportToDelete({ id: report._id, ticketNumber: report.ticketNumber });
                                setDeleteModalOpen(true);
                              }}
                              className="p-2 text-[var(--text-secondary)] hover:text-[var(--status-critical)] hover:bg-[var(--background)] rounded transition-colors"
                              title="Delete Report"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Card View */}
        {!isLoading && reports.length > 0 && (
          <div className="lg:hidden divide-y divide-[var(--border)]">
            {reports.map((report: any) => (
              <div key={report._id} className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <span className="font-mono text-xs text-[var(--text-secondary)]">{report.ticketNumber}</span>
                    <h3 className="font-medium text-[var(--text-primary)] leading-tight mt-0.5">{report.title}</h3>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border whitespace-nowrap ${getStatusColor(report.status)}`}>
                    {report.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{report.address}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {format(new Date(report.createdAt), 'MMM d, yyyy')}
                  </span>
                  <div className="flex items-center gap-1">
                    <Link 
                      href={`/reports/${report.ticketNumber}`}
                      className="px-3 py-1.5 text-xs font-medium bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--border)] rounded border border-[var(--border)]"
                    >
                      View
                    </Link>
                    {report.status === 'open' && (
                      <button 
                        onClick={() => {
                          setReportToDelete({ id: report._id, ticketNumber: report.ticketNumber });
                          setDeleteModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-[var(--background)] text-[var(--status-critical)] hover:bg-red-100 rounded border border-red-200"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--surface)]/50">
            <span className="text-sm text-[var(--text-secondary)]">
              Showing <span className="font-medium text-[var(--text-primary)]">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-medium text-[var(--text-primary)]">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-[var(--text-primary)]">{pagination.total}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
                className="p-1.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--border)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNextPage}
                className="p-1.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--border)] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Report"
        description={`Are you sure you want to delete report ${reportToDelete?.ticketNumber}? This action cannot be undone.`}
        confirmLabel="Delete Report"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
