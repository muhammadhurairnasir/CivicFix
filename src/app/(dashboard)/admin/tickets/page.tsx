'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Download, Search, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

import { TicketStatus, TicketPriority } from '@/types';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { TicketDetailSlideOver } from '@/components/admin/TicketDetailSlideOver';
import { getSlaStatus, formatSlaCountdown } from '@/lib/sla';

export default function AdminTicketsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [slaBreachedFilter, setSlaBreachedFilter] = useState('');
  const [search, setSearch] = useState('');
  
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);

  const fetchTickets = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
    });
    if (statusFilter) params.append('status', statusFilter);
    if (priorityFilter) params.append('priority', priorityFilter);
    if (slaBreachedFilter) params.append('slaBreached', slaBreachedFilter);
    
    // search could be handled via an API filter or client side for basic things.
    // Assuming backend might not have 'search' on tickets directly, but has it on reports. We'll pass ward as well if needed.

    const res = await axios.get(`/api/admin/tickets?${params.toString()}`);
    return res.data;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-tickets', { page, statusFilter, priorityFilter, slaBreachedFilter }],
    queryFn: fetchTickets,
    placeholderData: (prev) => prev,
  });

  const columns: ColumnDef<any>[] = [
    {
      header: 'Report',
      render: (t) => (
        <div>
          <div className="font-medium text-slate-900">{t.reportId?.title}</div>
          <div className="text-xs text-brand-600">{t.reportId?.ticketNumber}</div>
        </div>
      )
    },
    {
      header: 'Crew Member',
      render: (t) => (
        <div className="flex items-center gap-2">
          {t.assignedTo?.avatar ? (
            <img src={t.assignedTo.avatar} className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-200" />
          )}
          <span className="truncate max-w-[120px]">{t.assignedTo?.name || 'Unassigned'}</span>
        </div>
      )
    },
    {
      header: 'Priority',
      render: (t) => (
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${
          t.priority === 'urgent' ? 'bg-red-100 text-red-800' :
          t.priority === 'high' ? 'bg-orange-100 text-orange-800' :
          t.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {t.priority}
        </span>
      )
    },
    {
      header: 'SLA Deadline',
      render: (t) => {
        if (t.status === TicketStatus.COMPLETED) {
          return <span className="text-xs font-medium text-green-600 flex items-center"><Clock className="w-3.5 h-3.5 mr-1" />Completed</span>;
        }
        const status = getSlaStatus(t);
        const countdown = formatSlaCountdown(t);
        
        let colorClass = 'text-green-600 bg-green-50';
        if (status === 'at_risk') colorClass = 'text-yellow-700 bg-yellow-50 border border-yellow-200';
        if (status === 'breached') colorClass = 'text-red-700 bg-red-50 border border-red-200 font-bold';

        return (
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${colorClass}`}>
            {status === 'breached' && <AlertCircle className="w-3 h-3 mr-1" />}
            {countdown}
          </span>
        );
      }
    },
    {
      header: 'Status',
      render: (t) => (
        <span className="capitalize text-slate-500 bg-slate-100 px-2 py-1 rounded text-xs font-medium">
          {t.status.replace('_', ' ')}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (t) => (
        <Button 
          size="sm" 
          variant="secondary"
          onClick={() => {
            setDetailTicketId(t._id);
            setDetailOpen(true);
          }}
        >
          Manage
        </Button>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Ticket Manager</h1>
          <p className="text-sm text-slate-500 mt-1">Track SLA compliance and manage active repairs.</p>
        </div>
        
        {/* Quick SLA Toggle */}
        <div className="mt-4 sm:mt-0 flex gap-2 p-1 bg-slate-100 rounded-lg">
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${slaBreachedFilter === '' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => { setSlaBreachedFilter(''); setPage(1); }}
          >
            All Tickets
          </button>
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${slaBreachedFilter === 'true' ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' : 'text-slate-500 hover:text-red-600'}`}
            onClick={() => { setSlaBreachedFilter('true'); setPage(1); }}
          >
            SLA Breaches
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="w-48">
          <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
          <select 
            className="h-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border capitalize"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="w-40">
          <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
          <select 
            className="h-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border capitalize"
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Priorities</option>
            {Object.values(TicketPriority).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading || isFetching}
        keyExtractor={(item) => item._id}
        pagination={data?.pagination ? {
          ...data.pagination,
          onPageChange: setPage,
        } : undefined}
      />

      <TicketDetailSlideOver
        open={detailOpen}
        onOpenChange={setDetailOpen}
        ticketId={detailTicketId}
      />
    </div>
  );
}
