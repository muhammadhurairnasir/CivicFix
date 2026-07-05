'use client';

import { MapPin, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useInView } from '@/hooks/useInView';

const issues = [
  {
    id: 'REP-8821',
    type: 'Pothole',
    location: '1200 Block, Main St',
    timeAgo: '2 hours ago',
    status: 'In Progress',
    statusKey: 'active',
    priority: 'High',
  },
  {
    id: 'REP-8820',
    type: 'Streetlight Outage',
    location: 'Oak Avenue & 4th St',
    timeAgo: '4 hours ago',
    status: 'Pending Assessment',
    statusKey: 'pending',
    priority: 'Medium',
  },
  {
    id: 'REP-8819',
    type: 'Illegal Dumping',
    location: 'Westside Park Entrance',
    timeAgo: '1 day ago',
    status: 'Resolved',
    statusKey: 'resolved',
    priority: 'Low',
  },
  {
    id: 'REP-8818',
    type: 'Traffic Signal Issue',
    location: 'Downtown Boulevard',
    timeAgo: '1 day ago',
    status: 'In Progress',
    statusKey: 'active',
    priority: 'Critical',
  },
];

export function IssueFeed() {
  const ref = useInView<HTMLElement>();

  return (
    <section
      id="impact"
      ref={ref}
      className="border-b border-border bg-background py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p
              className="civic-animate mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary"
              data-anim="fade-in"
            >
              Live activity
            </p>
            <h2
              className="civic-animate civic-delay-1 text-3xl font-bold tracking-tight text-text-primary md:text-4xl"
              data-anim="fade-up"
            >
              Reports filed and resolved today.
            </h2>
          </div>
          <Link
            href="/reports"
            className="civic-animate civic-delay-2 group inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
            data-anim="fade-in"
          >
            View all reports
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2} />
          </Link>
        </div>

        {/* Desktop table */}
        <div
          className="civic-animate civic-delay-2 hidden rounded border border-border md:block"
          data-anim="fade-up"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest text-text-secondary" style={{ fontSize: '0.65rem' }}>ID</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest text-text-secondary" style={{ fontSize: '0.65rem' }}>Issue</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest text-text-secondary" style={{ fontSize: '0.65rem' }}>Location</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest text-text-secondary" style={{ fontSize: '0.65rem' }}>Filed</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest text-text-secondary" style={{ fontSize: '0.65rem' }}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {issues.map((issue, idx) => (
                <tr
                  key={issue.id}
                  className="issue-row transition-colors hover:bg-surface"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{issue.id}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{issue.type}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {issue.location}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {issue.timeAgo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-semibold"
                      style={{ color: `var(--status-${issue.statusKey})` }}
                    >
                      {issue.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked list */}
        <div
          className="civic-animate civic-delay-2 space-y-0 divide-y divide-border border border-border md:hidden"
          data-anim="fade-up"
        >
          {issues.map((issue) => (
            <div key={issue.id} className="flex items-start justify-between p-4 transition-colors hover:bg-surface">
              <div className="flex flex-col gap-1">
                <p className="font-medium text-text-primary">{issue.type}</p>
                <p className="text-xs text-text-secondary">{issue.location}</p>
                <p className="text-xs text-text-secondary">{issue.timeAgo}</p>
              </div>
              <span
                className="shrink-0 text-xs font-semibold"
                style={{ color: `var(--status-${issue.statusKey})` }}
              >
                {issue.status}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
