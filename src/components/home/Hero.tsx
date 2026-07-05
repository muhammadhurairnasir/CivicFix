'use client';

import { ArrowRight, Activity, MapPin, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useInView } from '@/hooks/useInView';
import { useEffect, useState } from 'react';

/* ── Status helpers ─────────────────────────────────────────── */
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open:         { label: 'Open',        color: 'var(--status-pending)'  },
  under_review: { label: 'Reviewing',   color: 'var(--status-pending)'  },
  in_progress:  { label: 'In Progress', color: 'var(--status-active)'   },
  resolved:     { label: 'Resolved',    color: 'var(--status-resolved)' },
  closed:       { label: 'Closed',      color: 'var(--status-resolved)' },
};

const TYPE_LABELS: Record<string, string> = {
  pothole:          'Pothole',
  crack:            'Road Crack',
  road_collapse:    'Road Collapse',
  broken_signage:   'Broken Sign',
  flooding:         'Flooding',
  debris:           'Debris',
  faded_markings:   'Faded Markings',
  broken_guardrail: 'Broken Guardrail',
  other:            'Infrastructure Issue',
};

interface LiveReport {
  id:        string;
  type:      string;
  location:  string;
  status:    string;
  severity:  string;
  createdAt: string;
}

/* ── Fallback shown before first fetch completes ─────────────── */
const FALLBACK: LiveReport[] = [
  { id: '1', type: 'pothole',        location: 'Main St & 4th Ave', status: 'in_progress', severity: 'high',   createdAt: '' },
  { id: '2', type: 'broken_signage', location: 'Elmwood District',  status: 'resolved',    severity: 'medium', createdAt: '' },
  { id: '3', type: 'flooding',       location: 'Westside Highway',  status: 'open',        severity: 'critical', createdAt: '' },
];

export function Hero() {
  const ref = useInView<HTMLElement>();
  const [reports, setReports]   = useState<LiveReport[]>(FALLBACK);
  const [loading, setLoading]   = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [pulse, setPulse]       = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/public/reports', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      if (json.success && json.data?.length) {
        setReports(json.data);
        setLiveCount(c => c + 1);
        setPulse(true);
        setTimeout(() => setPulse(false), 800);
      }
    } catch {
      // silently keep fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const id = setInterval(fetchReports, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-b border-border bg-background pt-24 pb-16 md:pt-32 md:pb-24"
    >
      {/* ── Background visual weight ───────────────────────────── */}
      {/* Radial ambient glow from top-left */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
      />
      {/* Dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.6,
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
        }}
      />
      {/* Subtle green accent line at very top */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, var(--primary) 40%, transparent)' }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:flex lg:items-center lg:gap-16">

        {/* Left Column — 55% */}
        <div className="lg:w-[55%]">
          <div
            className="civic-animate civic-delay-1 mb-8 inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary"
            data-anim="fade-in"
          >
            <Activity className="h-4 w-4" strokeWidth={2} />
            Active Incident Reporting
          </div>

          <h1
            className="civic-animate civic-delay-2 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]"
            data-anim="fade-up"
          >
            Report infrastructure issues{' '}
            <span
              className="relative inline-block"
              style={{ color: 'var(--primary)' }}
            >
              directly
              <span
                className="absolute bottom-1 left-0 right-0 h-px opacity-40"
                style={{ background: 'var(--primary)' }}
              />
            </span>{' '}
            to local authorities.
          </h1>

          <p
            className="civic-animate civic-delay-3 mt-6 max-w-xl text-lg text-text-secondary"
            data-anim="fade-up"
          >
            A reliable system for citizens to document potholes, broken streetlights,
            and sanitation hazards. Every report routes to the appropriate municipal
            department for resolution.
          </p>

          <div
            className="civic-animate civic-delay-4 mt-10 flex flex-col gap-4 sm:flex-row"
            data-anim="fade-up"
          >
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-fg transition-all hover:bg-primary-hover hover:shadow-md hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Report an Issue
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-primary transition-all hover:bg-card hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Track a Report
            </Link>
          </div>
        </div>

        {/* Right Column — 45% LIVE feed ─────────────────────── */}
        <div
          className="civic-animate civic-delay-3 mt-16 lg:mt-0 lg:w-[45%]"
          data-anim="slide-right"
        >
          <div className="rounded-lg border border-border bg-surface shadow-card transition-shadow duration-300 hover:shadow-md">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-text-primary">Recent Submissions</h3>
              <div className="flex items-center gap-3">
                {/* Refresh indicator */}
                <button
                  onClick={fetchReports}
                  disabled={loading}
                  className="text-text-secondary transition-colors hover:text-text-primary disabled:opacity-40"
                  title="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
                </button>
                {/* Live badge */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-xs font-semibold uppercase tracking-widest transition-all duration-300 ${
                    pulse
                      ? 'border-status-resolved bg-status-resolved/10'
                      : 'border-status-resolved'
                  }`}
                  style={{ color: 'var(--status-resolved)' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                  Live
                </span>
              </div>
            </div>

            {/* Feed rows */}
            <div className="divide-y divide-border">
              {reports.map((item, idx) => {
                const statusInfo = STATUS_MAP[item.status] ?? { label: item.status, color: 'var(--text-secondary)' };
                const typeLabel  = TYPE_LABELS[item.type] ?? item.type;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-5 py-3.5 transition-colors duration-150 hover:bg-background"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MapPin className="h-4 w-4 shrink-0 text-text-secondary" strokeWidth={2} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{typeLabel}</p>
                        <p className="text-xs text-text-secondary truncate">{item.location}</p>
                      </div>
                    </div>
                    <span
                      className="ml-4 shrink-0 text-xs font-semibold"
                      style={{ color: statusInfo.color }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                Auto-refreshes every 10s
              </span>
              <Link
                href="/reports"
                className="text-xs font-semibold text-primary transition-colors hover:text-primary-hover inline-flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
