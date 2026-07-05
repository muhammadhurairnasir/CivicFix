'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Download, SlidersHorizontal, Search } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { UserRole, ReportStatus, Severity, ReportType } from '@/types';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AssignTicketModal } from '@/components/admin/AssignTicketModal';
import { TicketDetailSlideOver } from '@/components/admin/TicketDetailSlideOver';
import { useToast } from '@/hooks/useToast';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filters State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [hasTicketFilter, setHasTicketFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  // Ticket Detail SlideOver State
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);

  // Fetch Data
  const fetchReports = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
    });
    if (search) params.append('search', search);
    if (statusFilter) params.append('status', statusFilter);
    if (severityFilter) params.append('severity', severityFilter);
    if (hasTicketFilter) params.append('hasTicket', hasTicketFilter);

    const res = await axios.get(`/api/admin/reports?${params.toString()}`);
    return res.data;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-reports', { page, search, statusFilter, severityFilter, hasTicketFilter }],
    queryFn: fetchReports,
    placeholderData: (prev) => prev,
  });

  // Bulk Verify Mutation
  const bulkVerifyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Execute sequentially to avoid overloading the API
      for (const id of ids) {
        await axios.patch(`/api/admin/reports/${id}/verify`, { isVerified: true });
      }
    },
    onSuccess: () => {
      toast({ title: 'Success', description: `${selectedIds.length} reports verified.` });
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    }
  });

  const columns: ColumnDef<any>[] = [
    {
      header: 'Ticket #',
      accessorKey: 'ticketNumber',
      className: 'font-medium text-brand-600',
    },
    {
      header: 'Reporter',
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.reporterId?.avatar ? (
            <img src={r.reporterId.avatar} className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-200" />
          )}
          <span className="truncate max-w-[120px]">{r.reporterId?.name || 'Anonymous'}</span>
        </div>
      )
    },
    {
      header: 'Type',
      render: (r) => <span className="capitalize">{r.type.replace('_', ' ')}</span>
    },
    {
      header: 'Severity',
      render: (r) => (
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${
          r.severity === 'critical' ? 'bg-red-100 text-red-800' :
          r.severity === 'high' ? 'bg-orange-100 text-orange-800' :
          r.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {r.severity}
        </span>
      )
    },
    {
      header: 'Status',
      render: (r) => <span className="capitalize text-slate-500">{r.status.replace('_', ' ')}</span>
    },
    {
      header: 'Assigned Ticket',
      render: (r) => r.ticket ? (
        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
          {r.ticket.assignedTo?.name || 'Unassigned Crew'}
        </span>
      ) : (
        <span className="text-xs text-slate-400">None</span>
      )
    },
    {
      header: 'Filed',
      render: (r) => <span className="text-slate-500 whitespace-nowrap">{format(new Date(r.createdAt), 'MMM d, yyyy')}</span>
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {!r.ticket ? (
            <Button 
              size="sm" 
              variant="primary" 
              onClick={() => {
                setSelectedReport({
                  id: r._id,
                  title: r.title,
                  severity: r.severity,
                  address: r.address,
                  ticketNumber: r.ticketNumber
                });
                setAssignModalOpen(true);
              }}
            >
              Assign
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => {
                setDetailTicketId(r.ticket._id);
                setDetailOpen(true);
              }}
            >
              View Ticket
            </Button>
          )}
        </div>
      )
    }
  ];

  const handleExport = () => {
    if (!data?.data) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Ticket Number,Title,Type,Severity,Status,Ward,Filed\n"
      + data.data.map((r: any) => 
          `${r.ticketNumber},"${r.title}",${r.type},${r.severity},${r.status},"${r.ward}",${r.createdAt}`
        ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `civicfix_reports_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Report Queue</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and assign incoming citizen reports.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          {selectedIds.length > 0 && (
            <Button 
              variant="secondary" 
              onClick={() => bulkVerifyMutation.mutate(selectedIds)}
              loading={bulkVerifyMutation.isPending}
            >
              Verify Selected ({selectedIds.length})
            </Button>
          )}
          <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ticket # or title..."
              className="pl-9 h-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="w-40">
          <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
          <select 
            className="h-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border capitalize"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            {Object.values(ReportStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="w-32">
          <label className="block text-xs font-medium text-slate-500 mb-1">Severity</label>
          <select 
            className="h-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border capitalize"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">All</option>
            {Object.values(Severity).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="w-40">
          <label className="block text-xs font-medium text-slate-500 mb-1">Assignment</label>
          <select 
            className="h-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border"
            value={hasTicketFilter}
            onChange={(e) => setHasTicketFilter(e.target.value)}
          >
            <option value="">All Reports</option>
            <option value="false">Unassigned Only</option>
            <option value="true">Assigned Only</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading || isFetching}
        keyExtractor={(item) => item._id}
        selectedIds={selectedIds}
        onSelectIds={setSelectedIds}
        pagination={data?.pagination ? {
          ...data.pagination,
          onPageChange: setPage,
        } : undefined}
      />

      <AssignTicketModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        report={selectedReport}
      />

      <TicketDetailSlideOver
        open={detailOpen}
        onOpenChange={setDetailOpen}
        ticketId={detailTicketId}
      />
    </div>
  );
}
