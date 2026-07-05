import React from 'react';
import Link from 'next/link';
import { MapPin, MessageSquare, ThumbsUp, Eye, CameraOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUpvote } from '@/hooks/useReports';
import { IReportDocument } from '@/models/Report';

/*
  STATUS COLOR RULES (per locked system):
  - Status colors appear ONLY as text and a left border dot.
  - No filled badge backgrounds.
  - Use CSS variable directly on style prop.
*/
const getStatusToken = (status: string): string => {
  switch (status) {
    case 'open':        return 'var(--status-pending)';
    case 'assigned':    return 'var(--status-active)';
    case 'in_progress': return 'var(--status-active)';
    case 'resolved':    return 'var(--status-resolved)';
    case 'closed':      return 'var(--status-resolved)';
    case 'rejected':    return 'var(--status-critical)';
    default:            return 'var(--text-secondary)';
  }
};

const getSeverityToken = (severity: string): string => {
  switch (severity) {
    case 'low':      return 'var(--status-resolved)';
    case 'medium':   return 'var(--status-pending)';
    case 'high':     return 'var(--status-pending)';
    case 'critical': return 'var(--status-critical)';
    default:         return 'var(--text-secondary)';
  }
};

interface ReportCardProps {
  report: Partial<IReportDocument> & { _id: string };
  isListMode?: boolean;
}

export function ReportCard({ report, isListMode = true }: ReportCardProps) {
  const upvoteMutation = useUpvote(report._id);
  const photoUrl = report.photos && report.photos.length > 0 ? report.photos[0].url : null;
  const timeAgo = report.createdAt ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true }) : 'Recently';

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    upvoteMutation.mutate();
  };

  return (
    <Link href={`/reports/${report.ticketNumber}`} className="block group">
      <div className={`flex ${isListMode ? 'flex-row' : 'flex-col'} bg-surface border border-border rounded overflow-hidden hover:border-text-secondary transition-colors`}>

        {/* Thumbnail */}
        <div className={`${isListMode ? 'w-32 sm:w-48 flex-shrink-0' : 'w-full h-48'} relative bg-card flex items-center justify-center overflow-hidden border-r border-border`}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={report.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <CameraOff className="w-8 h-8 text-text-secondary" />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow p-4 sm:p-5">
          <div className="flex justify-between items-start mb-1">
            <span className="font-mono text-[10px] sm:text-xs text-text-secondary uppercase tracking-wider">
              {report.ticketNumber}
            </span>
            <span className="text-xs text-text-secondary">{timeAgo}</span>
          </div>

          <h3 className="font-semibold text-text-primary text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {report.title}
          </h3>

          <div className="flex items-center text-xs text-text-secondary mb-4">
            <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">{report.address}</span>
          </div>

          {/* Badges — text-only status colors per system rules */}
          <div className="flex flex-wrap gap-3 mb-4 mt-auto">
            <span className="px-2 py-0.5 rounded border border-border bg-card text-[10px] sm:text-xs font-medium text-text-secondary capitalize">
              {report.type?.replace('_', ' ')}
            </span>
            <span
              className="text-[10px] sm:text-xs font-semibold capitalize"
              style={{ color: getSeverityToken(report.severity || 'low') }}
            >
              {report.severity}
            </span>
            <span
              className="text-[10px] sm:text-xs font-semibold capitalize"
              style={{ color: getStatusToken(report.status || 'open') }}
            >
              {report.status?.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4 text-text-secondary border-t border-border pt-3 mt-1 text-xs">
            <button
              onClick={handleUpvote}
              disabled={upvoteMutation.isPending}
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
              title="Upvote this report"
            >
              <ThumbsUp className={`w-4 h-4 ${upvoteMutation.isPending ? 'opacity-40' : ''}`} />
              <span className="font-medium">{report.upvoteCount || 0}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">0</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <Eye className="w-4 h-4" />
              <span className="font-medium">{report.viewCount || 0}</span>
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
}

export function ReportCardSkeleton({ isListMode = true }: { isListMode?: boolean }) {
  return (
    <div className={`flex ${isListMode ? 'flex-row' : 'flex-col'} bg-surface border border-border rounded overflow-hidden`}>
      <div className={`${isListMode ? 'w-32 sm:w-48 flex-shrink-0' : 'w-full h-48'} bg-card skeleton`} />
      <div className="flex flex-col flex-grow p-4 sm:p-5 gap-3">
        <div className="h-3 w-20 bg-card rounded skeleton" />
        <div className="h-5 w-3/4 bg-card rounded skeleton" />
        <div className="h-5 w-1/2 bg-card rounded skeleton" />
        <div className="h-4 w-40 bg-card rounded skeleton" />
        <div className="flex gap-2 mt-auto">
          <div className="h-6 w-16 bg-card rounded skeleton" />
          <div className="h-6 w-16 bg-card rounded skeleton" />
        </div>
        <div className="h-4 w-full bg-card rounded skeleton mt-2" />
      </div>
    </div>
  );
}
