'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Shield, Clock, CheckCircle2, AlertCircle, MapPin, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

type StepStatus = 'complete' | 'current' | 'upcoming';

interface TimelineStep {
  name:        string;
  description: string;
  status:      StepStatus;
  date?:       string;
}

function TimelineStep({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
  const icons: Record<StepStatus, React.ReactNode> = {
    complete: <CheckCircle2 className="h-4 w-4 text-white" />,
    current:  <Clock className="h-4 w-4 text-white animate-pulse" />,
    upcoming: <div className="h-2 w-2 rounded-full bg-[var(--border)]" />,
  };
  const dotBg: Record<StepStatus, string> = {
    complete: 'bg-[var(--status-resolved)]',
    current:  'bg-[var(--primary)]',
    upcoming: 'bg-[var(--surface)] border border-[var(--border)]',
  };

  return (
    <div className="relative flex gap-5">
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-[18px] top-9 bottom-0 w-px bg-[var(--border)]" />
      )}

      {/* Dot */}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${dotBg[step.status]}`}>
        {icons[step.status]}
      </div>

      {/* Content */}
      <div className="pb-8 pt-1 min-w-0">
        <p className={`text-sm font-semibold ${
          step.status === 'current'  ? 'text-[var(--primary)]' :
          step.status === 'complete' ? 'text-[var(--text-primary)]'  :
          'text-[var(--text-secondary)]'
        }`}>
          {step.name}
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{step.description}</p>
        {step.date && (
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">{step.date}</p>
        )}
      </div>
    </div>
  );
}

export default function TrackReportPage() {
  const params       = useParams();
  const ticketNumber = params.ticketNumber as string;
  const [data, setData]       = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState('');

  React.useEffect(() => {
    if (!ticketNumber) return;
    fetch(`/api/public/reports/${ticketNumber}`)
      .then(r => r.json())
      .then(j => { if (j.success) setData(j.data); else setError(j.message || 'Report not found'); })
      .catch(() => setError('An error occurred while looking up this report.'))
      .finally(() => setLoading(false));
  }, [ticketNumber]);

  /* ── Loading ── */
  if (loading) return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Skeleton className="h-8 w-1/3 mb-2" />
      <Skeleton className="h-5 w-1/4 mb-10" />
      <Skeleton className="h-40 w-full mb-4 rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );

  /* ── Not found ── */
  if (error || !data) return (
    <div className="mx-auto max-w-md px-4 py-28 sm:px-6 text-center">
      <XCircle className="mx-auto h-12 w-12 text-[var(--text-secondary)] mb-5" />
      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
        Report not found
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        {error || 'We couldn\'t find a report with that ticket number. Please double-check and try again.'}
      </p>
      <Link href="/#track">
        <Button variant="secondary">Try another ticket</Button>
      </Link>
    </div>
  );

  const { title, description, address, type, status, createdAt, ticket } = data;

  /* Build timeline steps */
  const steps: TimelineStep[] = [
    {
      name: 'Report Submitted',
      description: 'Your report was received and assigned a ticket number.',
      status: 'complete',
      date: format(new Date(createdAt), 'PPp'),
    },
    {
      name: 'Under Review',
      description: 'City officials are reviewing the report details.',
      status: (status === 'open' || status === 'under_review') ? 'current' : 'complete',
    },
    {
      name: 'Crew Assigned',
      description: 'A repair crew has been dispatched to the site.',
      status: ticket ? (ticket.status === 'in_progress' ? 'current' : 'complete') : 'upcoming',
      date: ticket?.startedAt ? format(new Date(ticket.startedAt), 'PPp') : undefined,
    },
    {
      name: 'Resolved',
      description: 'The issue has been fixed and documented.',
      status: (status === 'resolved') ? 'complete' : 'upcoming',
      date: ticket?.completedAt ? format(new Date(ticket.completedAt), 'PPp') : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] py-14">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-[var(--border)] shadow-[var(--shadow-md)] bg-[var(--surface)]"
        >
          {/* Header band */}
          <div className="bg-[var(--surface)] px-6 py-8 sm:px-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-white/10">
                <Shield className="h-3.5 w-3.5 text-white/70" />
              </div>
              <span className="text-xs font-semibold tracking-widest text-white/50 uppercase">
                Ticket #{ticketNumber}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2 leading-snug">{title}</h1>
            <p className="text-sm text-white/55 leading-relaxed">{description}</p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Meta */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10 pb-8 border-b border-[var(--border)]">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[var(--text-secondary)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-0.5">Location</p>
                  <p className="text-sm text-[var(--text-primary)]">{address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-[var(--text-secondary)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-0.5">Date Filed</p>
                  <p className="text-sm text-[var(--text-primary)]">{format(new Date(createdAt), 'PPP')}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h2 className="font-display text-base font-bold text-[var(--text-primary)] mb-6">
                Status Timeline
              </h2>
              <div>
                {steps.map((step, i) => (
                  <TimelineStep key={step.name} step={step} isLast={i === steps.length - 1} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
