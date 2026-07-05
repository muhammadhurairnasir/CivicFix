'use client';

import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { useInView, useSLABars } from '@/hooks/useInView';

const performanceData = [
  { label: 'Critical Priority', pct: 98, statusKey: 'resolved' },
  { label: 'High Priority', pct: 94, statusKey: 'resolved' },
  { label: 'Standard Priority', pct: 82, statusKey: 'active' },
];

export function SLABlock() {
  const ref = useInView<HTMLElement>();
  const barsRef = useSLABars<HTMLDivElement>();

  return (
    <section
      ref={ref}
      className="border-b border-border bg-surface py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:flex lg:items-start lg:gap-24">

        {/* Left */}
        <div className="mb-16 lg:mb-0 lg:w-1/2">
          <p
            className="civic-animate mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary"
            data-anim="fade-in"
          >
            Accountability
          </p>
          <h2
            className="civic-animate civic-delay-1 mb-6 text-3xl font-bold tracking-tight text-text-primary md:text-4xl"
            data-anim="fade-up"
          >
            Accountability baked into the platform.
          </h2>
          <p
            className="civic-animate civic-delay-2 mb-8 text-lg text-text-secondary"
            data-anim="fade-up"
          >
            Every report is bound by strict Service Level Agreements. If a critical issue is not addressed within the mandated timeframe, it automatically escalates to senior department heads.
          </p>
          <ul className="space-y-4">
            {[
              'Priority-based automated escalation pathways.',
              'Publicly visible resolution metrics for every ward.',
              'Notifications sent before SLAs are breached.',
            ].map((item, i) => (
              <li
                key={item}
                className={`civic-animate civic-delay-${i + 3} flex items-start gap-3 text-text-secondary`}
                data-anim="slide-left"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0"
                  style={{ color: 'var(--status-resolved)' }}
                  strokeWidth={2}
                />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — SLA panel */}
        <div
          className="civic-animate civic-delay-2 lg:w-1/2"
          data-anim="slide-right"
        >
          <div
            ref={barsRef}
            className="rounded border border-border bg-card p-8 transition-shadow duration-300 hover:shadow-card"
          >
            <h3 className="mb-6 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <ShieldAlert className="h-4 w-4 text-text-secondary" strokeWidth={2} />
              SLA Performance — This Quarter
            </h3>

            <div className="space-y-6">
              {performanceData.map((row, i) => (
                <div key={row.label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-text-secondary">{row.label}</span>
                    <span
                      className="font-mono font-semibold"
                      style={{ color: `var(--status-${row.statusKey})` }}
                    >
                      {row.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className="sla-bar h-full rounded-full"
                      style={{
                        '--sla-width': `${row.pct}%`,
                        transitionDelay: `${i * 150}ms`,
                        backgroundColor: `var(--status-${row.statusKey})`,
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className="h-4 w-4"
                    style={{ color: 'var(--status-resolved)' }}
                    strokeWidth={2}
                  />
                  <span className="text-sm font-medium text-text-primary">
                    SLA Breaches — Last 7 Days
                  </span>
                </div>
                <span
                  className="text-lg font-bold"
                  style={{ color: 'var(--status-resolved)' }}
                >
                  0
                </span>
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                Escalation triggers automatically before any breach window closes.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
