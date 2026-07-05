'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  UserCircle2, 
  Clock, 
  MapPin, 
  AlertTriangle,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { SlideOver } from '@/components/ui/SlideOver';
import { Button } from '@/components/ui/Button';
import { Stepper, Step } from '@/components/ui/Stepper';
import { ITicket, TicketStatus } from '@/types';
import { getSlaStatus, formatSlaCountdown } from '@/lib/sla';
import { useToast } from '@/hooks/useToast';
import { PhotoLightbox } from '@/components/ui/PhotoLightbox';

interface TicketDetailSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string | null;
}

const TICKET_STEPS: Step[] = [
  { id: 1, label: 'Dispatched' },
  { id: 2, label: 'En Route' },
  { id: 3, label: 'Active' },
  { id: 4, label: 'Completed' },
];

function getStepForStatus(status: TicketStatus): number {
  switch (status) {
    case TicketStatus.PENDING:
    case TicketStatus.ASSIGNED:
      return 1;
    case TicketStatus.DISPATCHED:
      return 1;
    case TicketStatus.EN_ROUTE:
      return 2;
    case TicketStatus.ACTIVE:
      return 3;
    case TicketStatus.BLOCKED:
      return 3;
    case TicketStatus.COMPLETED:
      return 4;
    default:
      return 1;
  }
}

export function TicketDetailSlideOver({
  open,
  onOpenChange,
  ticketId,
}: TicketDetailSlideOverProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialPhotoIndex, setInitialPhotoIndex] = useState(0);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['admin-ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const res = await axios.get(`/api/admin/tickets/${ticketId}`);
      return res.data.data as ITicket;
    },
    enabled: !!ticketId && open,
  });

  const noteMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await axios.post(`/api/admin/tickets/${ticketId}/notes`, { body });
      return res.data;
    },
    onSuccess: () => {
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
      toast({ title: 'Note added', variant: 'success' });
    },
    onError: () => {
      toast({ title: 'Failed to add note', variant: 'danger' });
    }
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.patch(`/api/admin/tickets/${ticketId}/status`, { status: TicketStatus.COMPLETED });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      toast({ title: 'Ticket marked complete', variant: 'success' });
    },
  });

  if (!ticketId) {
    return <SlideOver open={open} onOpenChange={onOpenChange} title="Ticket Details"><div/></SlideOver>;
  }

  return (
    <SlideOver 
      open={open} 
      onOpenChange={onOpenChange} 
      title={ticket?.report?.ticketNumber || 'Ticket Details'}
      width="md"
    >
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
        </div>
      ) : ticket ? (
        <div className="space-y-8 pb-10">
          
          {/* Report Summary */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 font-display">
                  {ticket.report?.title}
                </h3>
                <p className="mt-1 flex items-center text-sm text-slate-500">
                  <AlertTriangle className="mr-1.5 h-4 w-4" />
                  {ticket.report?.severity} Priority Report
                </p>
              </div>
              <Link 
                href={`/dashboard/reports/${ticket.reportId}`} 
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                View Report &rarr;
              </Link>
            </div>
          </div>

          {/* SLA Status Bar */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">SLA Status</h4>
            <div className={`rounded-lg p-4 border ${
              getSlaStatus(ticket) === 'breached' 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : getSlaStatus(ticket) === 'at_risk'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              <div className="flex items-center">
                {getSlaStatus(ticket) === 'breached' ? (
                  <AlertCircle className="h-5 w-5 mr-2" />
                ) : (
                  <Clock className="h-5 w-5 mr-2" />
                )}
                <span className="font-medium">
                  {ticket.status === TicketStatus.COMPLETED 
                    ? 'Completed within SLA' 
                    : formatSlaCountdown(ticket)}
                </span>
              </div>
            </div>
          </div>

          {/* Stepper */}
          <div className="pt-4">
            <Stepper steps={TICKET_STEPS} currentStep={getStepForStatus(ticket.status)} />
          </div>

          {/* Assignment */}
          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Assigned Crew</h4>
            <div className="flex items-center gap-3">
              {ticket.assignedCrew?.avatar ? (
                <img src={ticket.assignedCrew.avatar} alt="" className="h-10 w-10 rounded-full" />
              ) : (
                <UserCircle2 className="h-10 w-10 text-slate-400" />
              )}
              <div>
                <div className="font-medium text-slate-900">{ticket.assignedCrew?.name || 'Unassigned'}</div>
                <div className="text-xs text-slate-500">Crew Member</div>
              </div>
            </div>
          </div>

          {/* Repair Photos */}
          {ticket.repairPhotos && ticket.repairPhotos.length > 0 && (
            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                <ImageIcon className="h-4 w-4 mr-1.5" /> Repair Evidence
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {ticket.repairPhotos.map((photo: any, idx: number) => (
                  <button 
                    key={idx} 
                    className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-slate-200 snap-start" 
                    onClick={() => { setInitialPhotoIndex(idx); setLightboxOpen(true); }}
                  >
                    <img src={photo.url || photo} className="w-full h-full object-cover" alt="Repair photo" />
                  </button>
                ))}
              </div>
              <PhotoLightbox 
                photos={ticket.repairPhotos.map((photo: any) => ({ url: photo.url || photo })) as any} 
                isOpen={lightboxOpen} 
                onClose={() => setLightboxOpen(false)} 
                initialIndex={initialPhotoIndex} 
              />
            </div>
          )}

          {/* Notes Timeline */}
          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
              <MessageSquare className="h-4 w-4 mr-1.5" /> Internal Notes
            </h4>
            
            <div className="space-y-4 mb-4">
              {ticket.notes?.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No notes yet.</p>
              ) : (
                ticket.notes?.map((n) => (
                  <div key={n.id} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-medium text-slate-900">{n.author?.name}</span>
                      <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.body}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-start gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add an internal note..."
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm resize-none"
                rows={2}
              />
              <Button 
                onClick={() => noteMutation.mutate(note)}
                disabled={!note.trim() || noteMutation.isPending}
                loading={noteMutation.isPending}
              >
                Post
              </Button>
            </div>
          </div>

          {/* Actions */}
          {ticket.status !== TicketStatus.COMPLETED && (
            <div className="fixed bottom-0 right-0 w-full md:w-[32rem] bg-white border-t border-slate-200 p-4 flex justify-end gap-3 px-6">
              <Button variant="secondary" onClick={() => {/* Handle Reassign */}}>
                Reassign
              </Button>
              <Button 
                variant="primary" 
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                onClick={() => completeMutation.mutate()}
                loading={completeMutation.isPending}
              >
                Mark Complete
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500">Ticket not found.</div>
      )}
    </SlideOver>
  );
}
