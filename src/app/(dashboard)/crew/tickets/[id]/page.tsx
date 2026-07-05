'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  ArrowLeft, MapPin, Clock, AlertTriangle, 
  MessageSquare, UserCircle2, CheckCircle2, AlertCircle, Camera
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import { ITicket, TicketStatus } from '@/types';
import { getSlaStatus, formatSlaCountdown } from '@/lib/sla';
import { useToast } from '@/hooks/useToast';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { StatusUpdateButton } from '@/components/crew/StatusUpdateButton';
import { RepairPhotoUpload } from '@/components/crew/RepairPhotoUpload';
import { PhotoLightbox } from '@/components/ui/PhotoLightbox';

export default function CrewTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const ticketId = params.id as string;

  const [note, setNote] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialPhotoIndex, setInitialPhotoIndex] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['crew-ticket', ticketId],
    queryFn: async () => {
      const res = await axios.get(`/api/crew/tickets/${ticketId}`);
      return res.data.data as ITicket;
    },
  });

  const noteMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await axios.patch(`/api/crew/tickets/${ticketId}`, { note: body });
      return res.data;
    },
    onSuccess: () => {
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['crew-ticket', ticketId] });
      toast({ title: 'Note added', variant: 'success' });
    },
    onError: () => {
      toast({ title: 'Failed to add note', variant: 'danger' });
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full mt-4 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto p-10 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Ticket Not Found</h2>
        <p className="text-slate-500 mb-6">This ticket may not exist or is not assigned to you.</p>
        <Button onClick={() => router.push('/crew/tickets')}>Back to My Tickets</Button>
      </div>
    );
  }

  const ticket = data;
  const report = ticket.reportId as any;
  const slaStatus = getSlaStatus(ticket);

  return (
    <div className="max-w-2xl mx-auto pb-24 sm:pb-8">
      {/* Header Mobile Nav */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900 truncate">{report.ticketNumber}</h1>
        </div>
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
          ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
          ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
          ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {ticket.priority}
        </span>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Status Actions Panel */}
        {ticket.status !== TicketStatus.COMPLETED && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Current Status</h3>
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-medium capitalize border border-brand-100">
                {ticket.status.replace('_', ' ')}
              </span>
            </div>
            <StatusUpdateButton 
              ticketId={(ticket as any)._id || ticket.id} 
              currentStatus={ticket.status} 
              hasPhotos={ticket.repairPhotos && ticket.repairPhotos.length > 0}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['crew-ticket', ticketId] });
                queryClient.invalidateQueries({ queryKey: ['crew-tickets-overview'] });
                queryClient.invalidateQueries({ queryKey: ['crew-tickets-list'] });
              }}
            />
          </div>
        )}

        {/* SLA Status */}
        <div className={`p-4 rounded-xl border ${
          slaStatus === 'breached' ? 'bg-red-50 border-red-200' :
          slaStatus === 'at_risk' ? 'bg-yellow-50 border-yellow-200' :
          'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-sm font-semibold ${
              slaStatus === 'breached' ? 'text-red-900' :
              slaStatus === 'at_risk' ? 'text-yellow-900' :
              'text-green-900'
            }`}>SLA Deadline</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-md ${
              slaStatus === 'breached' ? 'bg-red-100 text-red-800' :
              slaStatus === 'at_risk' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {ticket.status === TicketStatus.COMPLETED ? 'Completed' : 
               slaStatus === 'breached' ? 'Breached' : 
               slaStatus === 'at_risk' ? 'At Risk' : 'On Track'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {slaStatus === 'breached' ? <AlertCircle className="h-5 w-5 text-red-600" /> : <Clock className="h-5 w-5 text-green-600" />}
            <span className={`font-medium ${
              slaStatus === 'breached' ? 'text-red-700' :
              slaStatus === 'at_risk' ? 'text-yellow-700' :
              'text-green-700'
            }`}>
              {ticket.status === TicketStatus.COMPLETED ? 'Resolved within SLA requirements' : formatSlaCountdown(ticket)}
            </span>
          </div>
          <div className="mt-1 text-xs opacity-80">
            Due: {format(new Date(ticket.slaDeadline), 'PPp')}
          </div>
        </div>

        {/* Report Info */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display mb-1">{report.title}</h2>
            <div className="flex flex-wrap gap-2 text-sm text-slate-600 mt-2">
              <span className="flex items-center bg-slate-100 px-2 py-1 rounded"><AlertTriangle className="h-3.5 w-3.5 mr-1 text-slate-400"/> {report.severity} Severity</span>
              <span className="flex items-center bg-slate-100 px-2 py-1 rounded capitalize">{report.type.replace('_', ' ')}</span>
            </div>
          </div>

          <a 
            href={`https://maps.google.com/?q=${report.location.coordinates[1]},${report.location.coordinates[0]}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-brand-200 transition-colors"
          >
            <div className="bg-brand-100 p-2 rounded-full text-brand-600 shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 leading-tight mb-1">{report.address}</p>
              <p className="text-xs text-brand-600 font-medium">Tap to open in Google Maps &rarr;</p>
            </div>
          </a>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Description</h4>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{report.description}</p>
          </div>

          {report.photos && report.photos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Citizen Photos</h4>
              <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                {report.photos.map((url: string, idx: number) => (
                  <button 
                    key={idx} 
                    className="relative w-32 h-32 shrink-0 rounded-lg overflow-hidden border border-slate-200 snap-start" 
                    onClick={() => { setInitialPhotoIndex(idx); setLightboxOpen(true); }}
                  >
                    <img src={url} className="w-full h-full object-cover" alt="Report photo" />
                  </button>
                ))}
              </div>
              <PhotoLightbox 
                photos={report.photos.map((url: string) => ({ url })) as any} 
                isOpen={lightboxOpen} 
                onClose={() => setLightboxOpen(false)} 
                initialIndex={initialPhotoIndex} 
              />
            </div>
          )}
        </div>

        {/* Repair Photos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 font-display flex items-center">
              <Camera className="h-5 w-5 mr-2 text-brand-600" />
              Repair Evidence
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              At least 1 photo is required to mark this ticket as completed.
            </p>
          </div>
          
          <RepairPhotoUpload 
            ticketId={(ticket as any)._id || ticket.id}
            existingPhotos={ticket.repairPhotos || []}
            onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ['crew-ticket', ticketId] })}
          />
        </div>

        {/* Notes Timeline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 font-display flex items-center mb-4">
            <MessageSquare className="h-5 w-5 mr-2 text-brand-600" />
            Internal Notes
          </h3>
          
          <div className="space-y-4 mb-5">
            {(!ticket.notes || ticket.notes.length === 0) ? (
              <p className="text-sm text-slate-500 italic text-center py-4 bg-slate-50 rounded-lg border border-slate-100">No internal notes yet.</p>
            ) : (
              ticket.notes.map((n) => (
                <div key={n.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {n.author?.avatar ? (
                        <img src={n.author.avatar} alt="" className="w-5 h-5 rounded-full" />
                      ) : (
                        <UserCircle2 className="w-5 h-5 text-slate-400" />
                      )}
                      <span className="text-sm font-medium text-slate-900">{n.author?.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap pl-6.5">{n.body}</p>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add an internal note or status update..."
              className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm resize-none"
              rows={3}
            />
            <Button 
              onClick={() => noteMutation.mutate(note)}
              disabled={!note.trim() || noteMutation.isPending}
              loading={noteMutation.isPending}
              className="self-end"
            >
              Post Note
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
