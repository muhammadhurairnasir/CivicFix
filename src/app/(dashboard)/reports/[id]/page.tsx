'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  ArrowLeft, MapPin, Calendar, User, Eye, 
  MessageSquare, ThumbsUp, ShieldAlert,
  Clock, CheckCircle, Navigation, Copy
} from 'lucide-react';
import { useReport, useUpvote, useComments, useCreateComment } from '@/hooks/useReports';
import { useAuth } from '@/context/AuthContext';
import { PhotoLightbox } from '@/components/ui/PhotoLightbox';
import { Stepper } from '@/components/ui/Stepper';

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const ticketNumber = params.id;
  const { user } = useAuth();
  
  const { data: reportData, isLoading, isError } = useReport(ticketNumber);
  const upvoteMutation = useUpvote(reportData?.data?._id || '');
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto flex gap-6 flex-col md:flex-row animate-pulse">
        <div className="flex-grow space-y-6">
          <div className="h-8 bg-[var(--surface)] rounded w-1/3" />
          <div className="h-64 bg-[var(--surface)] rounded-xl" />
          <div className="h-4 bg-[var(--surface)] rounded w-full" />
          <div className="h-4 bg-[var(--surface)] rounded w-5/6" />
        </div>
        <div className="w-full md:w-[35%] space-y-6">
          <div className="h-64 bg-[var(--surface)] rounded-xl" />
          <div className="h-48 bg-[var(--surface)] rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !reportData?.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <ShieldAlert className="w-16 h-16 text-[var(--status-critical)] mb-4" />
        <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-2">Report Not Found</h1>
        <p className="text-[var(--text-secondary)] mb-6">The report you are looking for does not exist or has been removed.</p>
        <Link href="/reports" className="bg-[var(--primary)] text-white px-6 py-2 rounded-btn font-medium">
          Back to Reports
        </Link>
      </div>
    );
  }

  const report = reportData.data;
  const ticket = report.ticket;
  const photos = report.photos || [];

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(report.ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Status mapping for the Stepper
  const statusToStepMap: Record<string, number> = {
    open: 0,
    assigned: 1,
    in_progress: 2,
    resolved: 3,
    closed: 3,
  };
  const currentStep = statusToStepMap[report.status] ?? 0;

  const isCrewOrAdmin = user && ['crew', 'admin', 'super_admin'].includes(user.role);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 h-full">
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <button 
          onClick={() => router.back()} 
          className="flex items-center text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-sm text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--surface)] px-2 py-0.5 rounded">
                {report.ticketNumber}
              </span>
              <span className={`px-2 py-0.5 rounded-badge text-xs font-medium capitalize border border-[var(--border)]
                ${report.severity === 'critical' ? 'text-[var(--status-critical)] bg-[var(--background)] border-[var(--status-critical)]' : 
                  report.severity === 'high' ? 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' :
                  report.severity === 'medium' ? 'text-[var(--status-pending)] bg-[var(--status-pending)] border-[var(--status-pending)]' :
                  'text-[var(--status-resolved)] bg-[var(--surface)] border-[var(--status-resolved)]'}`}
              >
                {report.severity} Severity
              </span>
              <span className="px-2 py-0.5 rounded-badge text-xs font-medium capitalize bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                {report.type?.replace('_', ' ')}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-primary)]">
              {report.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => upvoteMutation.mutate()}
              disabled={upvoteMutation.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-btn border font-medium transition-all shadow-sm ${upvoteMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--surface)]'} bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Upvote ({report.upvoteCount})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main Content Column (65%) */}
        <div className="flex-grow lg:w-[65%] space-y-8">
          
          {/* Photo Gallery */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((photo: any, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => openLightbox(idx)}
                  className={`relative rounded-xl overflow-hidden cursor-pointer group bg-[var(--surface)] ${idx === 0 ? 'col-span-2 row-span-2 aspect-video' : 'aspect-square'}`}
                >
                  <img src={photo.url} alt={`Report photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full aspect-video bg-[var(--surface)] rounded-xl border border-[var(--border)] flex flex-col items-center justify-center text-[var(--text-secondary)]">
              <Eye className="w-12 h-12 mb-2 opacity-50" />
              <p>No photos provided</p>
            </div>
          )}

          {/* Description */}
          <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border)] shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Description</h2>
            <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
              {report.description || 'No description provided.'}
            </p>
            
            {report.tags && report.tags.length > 0 && (
              <div className="mt-6 flex gap-2 flex-wrap">
                {report.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-[var(--surface)] text-[var(--text-secondary)] text-sm rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section (Placeholder for the hook data) */}
          <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border)] shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-[var(--text-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Discussion</h2>
            </div>
            
            <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-lg">
              <p className="text-[var(--text-secondary)] mb-2">No comments yet.</p>
              {user ? (
                <button className="text-sm font-medium text-[var(--primary)] hover:underline">Add a comment</button>
              ) : (
                <Link href="/login" className="text-sm font-medium text-[var(--primary)] hover:underline">Log in to comment</Link>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Column (35%) */}
        <div className="w-full lg:w-[35%] space-y-6">
          
          {/* Location Card */}
          <div className="bg-[var(--surface)] rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
            <div className="h-40 bg-[var(--surface)] relative">
              {/* Static map placeholder - in a real app, use a non-interactive react-leaflet map here */}
              <img 
                src={`https://static-maps.yandex.ru/1.x/?ll=${report.location.coordinates[0]},${report.location.coordinates[1]}&z=15&l=map&pt=${report.location.coordinates[0]},${report.location.coordinates[1]},pm2rdl`} 
                alt="Map location" 
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md animate-pulse" />
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-[var(--text-primary)]">{report.address}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">Ward: {report.ward || 'Unknown'}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
                    {report.location.coordinates[1].toFixed(5)}, {report.location.coordinates[0].toFixed(5)}
                  </p>
                </div>
              </div>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${report.location.coordinates[1]},${report.location.coordinates[0]}`}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text-secondary)] text-sm font-medium rounded-btn transition-colors"
              >
                <Navigation className="w-4 h-4" /> Get Directions
              </a>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] shadow-sm">
            <h3 className="font-medium text-[var(--text-primary)] mb-4">Report Details</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)] flex items-center gap-2"><Clock className="w-4 h-4" /> Filed</span>
                <span className="text-[var(--text-secondary)] font-medium">{format(new Date(report.createdAt), 'MMM d, yyyy')}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)] flex items-center gap-2"><User className="w-4 h-4" /> Reporter</span>
                <span className="text-[var(--text-secondary)] font-medium">Citizen</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)] flex items-center gap-2"><Eye className="w-4 h-4" /> Views</span>
                <span className="text-[var(--text-secondary)] font-medium">{report.viewCount || 1}</span>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border)] flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Ticket ID</span>
                <button 
                  onClick={handleCopyTicket}
                  className="flex items-center gap-1.5 text-[var(--text-primary)] font-mono bg-[var(--surface)] hover:bg-[var(--border)] px-2 py-1 rounded transition-colors"
                >
                  {report.ticketNumber}
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-[var(--status-resolved)]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border)] shadow-sm">
            <h3 className="font-medium text-[var(--text-primary)] mb-6">Resolution Status</h3>
            <Stepper 
              currentStep={currentStep} 
              steps={[
                { id: 0, label: 'Submitted' },
                { id: 1, label: 'Assigned' },
                { id: 2, label: 'In Progress' },
                { id: 3, label: 'Resolved' }
              ]} 
            />
            <div className="mt-8 space-y-4 border-t border-[var(--border)] pt-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] font-medium">Submitted</span>
                <span className="text-[var(--text-secondary)]">{format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}</span>
              </div>
              {currentStep >= 1 && (
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] font-medium">Assigned</span>
                  <span className="text-[var(--text-secondary)]">{ticket?.status === 'assigned' ? 'Crew dispatched' : 'Pending'}</span>
                </div>
              )}
              {currentStep >= 2 && ticket?.startedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] font-medium">Started</span>
                  <span className="text-[var(--text-secondary)]">{format(new Date(ticket.startedAt), 'MMM d, yyyy')}</span>
                </div>
              )}
              {currentStep >= 3 && ticket?.completedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-[var(--status-resolved)] font-medium">Resolved</span>
                  <span className="text-[var(--text-secondary)]">{format(new Date(ticket.completedAt), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin / Crew Actions */}
          {isCrewOrAdmin && (
            <div className="bg-[var(--surface)]/30 rounded-xl p-5 border border-[var(--surface)] shadow-sm">
              <h3 className="font-medium text-[var(--primary-hover)] mb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Staff Actions
              </h3>
              <p className="text-sm text-[var(--brand-muted)] mb-4">You have staff privileges to manage this report.</p>
              <button className="w-full py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium rounded-btn transition-colors shadow-sm">
                Update Ticket Status
              </button>
            </div>
          )}

        </div>
      </div>

      <PhotoLightbox 
        photos={photos} 
        isOpen={lightboxOpen} 
        initialIndex={lightboxIndex} 
        onClose={() => setLightboxOpen(false)} 
      />
    </div>
  );
}
