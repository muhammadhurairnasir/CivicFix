'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { MapPin, Clock, AlertCircle } from 'lucide-react';
import { ITicket, TicketStatus } from '@/types';
import { formatSlaCountdown } from '@/lib/sla';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CrewTicketsPage() {
  const [tab, setTab] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['crew-tickets-list'],
    queryFn: async () => {
      const res = await axios.get('/api/crew/tickets');
      return res.data.data as (ITicket & { slaStatus: string })[];
    },
  });

  const tickets = data || [];

  const filteredTickets = tickets.filter(t => {
    if (tab === 'active') return ([TicketStatus.ASSIGNED, TicketStatus.DISPATCHED, TicketStatus.EN_ROUTE, TicketStatus.ACTIVE] as TicketStatus[]).includes(t.status);
    if (tab === 'completed') return t.status === TicketStatus.COMPLETED;
    if (tab === 'overdue') return t.slaStatus === 'breached' && t.status !== TicketStatus.COMPLETED;
    return true; // 'all'
  });

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'overdue', label: 'Overdue' },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
          My Tickets
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your assigned repairs and track SLA deadlines.
        </p>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-0">
        <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 w-full max-w-md">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full rounded-lg py-2 text-sm font-medium leading-5 transition-colors focus:outline-none ${
                tab === t.id
                  ? 'bg-white shadow text-brand-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <div className="px-4 sm:px-0 space-y-4">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
              <Skeleton className="h-5 w-2/3 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
            <p>No tickets found for this category.</p>
          </div>
        ) : (
          filteredTickets.map(ticket => {
            const r = ticket.reportId as any;
            return (
              <div key={(ticket as any)._id || ticket.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 sm:p-5 flex-1">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ticket.priority}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{r?.title}</h3>
                      <p className="text-xs font-medium text-brand-600 mt-0.5">#{r?.ticketNumber}</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-start text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mr-2 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{r?.address}</span>
                    </div>
                    
                    {ticket.status !== TicketStatus.COMPLETED && (
                      <div className={`flex items-center text-sm font-medium ${
                        ticket.slaStatus === 'breached' ? 'text-red-600' :
                        ticket.slaStatus === 'at_risk' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {ticket.slaStatus === 'breached' ? (
                          <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                        ) : (
                          <Clock className="h-4 w-4 mr-2 shrink-0" />
                        )}
                        {formatSlaCountdown(ticket)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border-t border-slate-100 p-3 sm:px-5 flex justify-end">
                  <Link
                    href={`/crew/tickets/${(ticket as any)._id || ticket.id}`}
                    className="w-full sm:w-auto text-center inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 bg-brand-600 text-white hover:bg-brand-700 h-10 px-6"
                  >
                    View & Update
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
