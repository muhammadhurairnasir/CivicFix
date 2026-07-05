'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ListTodo,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ITicket, TicketStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { formatSlaCountdown, getSlaStatus } from '@/lib/sla';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CrewDashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['crew-tickets-overview'],
    queryFn: async () => {
      const res = await axios.get('/api/crew/tickets');
      return res.data.data as (ITicket & { slaStatus: string, hoursRemaining: number, hoursOverdue: number })[];
    },
  });

  const tickets = data || [];
  
  // Calculate Stats
  const activeTickets = tickets.filter(t => 
    ([TicketStatus.ASSIGNED, TicketStatus.DISPATCHED, TicketStatus.EN_ROUTE, TicketStatus.ACTIVE] as TicketStatus[]).includes(t.status)
  );
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const completedThisMonth = tickets.filter(t => {
    if (t.status !== TicketStatus.COMPLETED || !t.completedAt) return false;
    const d = new Date(t.completedAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalCompleted = tickets.filter(t => t.status === TicketStatus.COMPLETED);
  const completedOnTime = totalCompleted.filter(t => !t.slaBreached);
  const slaComplianceRate = totalCompleted.length > 0 
    ? Math.round((completedOnTime.length / totalCompleted.length) * 100) 
    : 100;

  const overdueTickets = tickets.filter(t => t.slaStatus === 'breached' && t.status !== TicketStatus.COMPLETED);

  // Priority Queue: Active tickets sorted by SLA
  const priorityQueue = activeTickets
    .sort((a, b) => new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            My Work Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, {user?.name}. Here is your current workload.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-4 text-sm text-slate-500">
          <span className="flex items-center"><MapPin className="h-4 w-4 mr-1"/> Ward: {user?.ward || 'All'}</span>
          <span className="flex items-center"><Calendar className="h-4 w-4 mr-1"/> {format(new Date(), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Breach Warning Banner */}
      {overdueTickets.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                You have {overdueTickets.length} overdue ticket{overdueTickets.length > 1 ? 's' : ''}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Please address overdue repairs immediately to restore SLA compliance.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center text-brand-600 mb-2">
            <ListTodo className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium text-slate-500">Active Tickets</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-display">
            {isLoading ? <Skeleton className="h-8 w-16" /> : activeTickets.length}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center text-green-600 mb-2">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium text-slate-500">Completed (Month)</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-display">
            {isLoading ? <Skeleton className="h-8 w-16" /> : completedThisMonth.length}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center text-blue-600 mb-2">
            <Clock className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium text-slate-500">SLA Compliance</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-display flex items-baseline">
            {isLoading ? <Skeleton className="h-8 w-16" /> : slaComplianceRate}
            <span className="text-lg ml-1 text-slate-500">%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center text-red-600 mb-2">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium text-slate-500">Overdue</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-display">
            {isLoading ? <Skeleton className="h-8 w-16" /> : overdueTickets.length}
          </div>
        </div>
      </div>

      {/* Priority Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 font-display">Priority Queue</h2>
          <Link href="/crew/tickets" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View All &rarr;
          </Link>
        </div>
        
        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6 flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : priorityQueue.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="h-10 w-10 mx-auto text-green-400 mb-3" />
            <p className="font-medium text-slate-900">You're all caught up!</p>
            <p className="text-sm mt-1">No active tickets in your queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {priorityQueue.map(ticket => {
              const r = ticket.reportId as any;
              return (
                <div key={(ticket as any)._id || ticket.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.priority}
                      </span>
                      <h3 className="font-semibold text-slate-900">{r?.title}</h3>
                    </div>
                    
                    <div className="text-sm text-slate-500 flex items-center gap-3 mt-2">
                      <span className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1"/> {r?.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <div className={`text-sm font-medium flex items-center px-2.5 py-1 rounded-md ${
                      ticket.slaStatus === 'breached' ? 'bg-red-50 text-red-700 border border-red-200' :
                      ticket.slaStatus === 'at_risk' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                      'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      <Clock className="h-4 w-4 mr-1.5" />
                      {formatSlaCountdown(ticket)}
                    </div>

                    <Link
                      href={`/crew/tickets/${(ticket as any)._id || ticket.id}`}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50 bg-brand-600 text-white hover:bg-brand-700 h-9 px-4 py-2"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
