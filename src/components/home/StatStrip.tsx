'use client';

import { useStatReveal } from '@/hooks/useInView';

const stats = [
  { label: 'Reports Resolved', target: 14205, suffix: '' },
  { label: 'Avg. Resolution Time', target: 48, suffix: 'h' },
  { label: 'Participating Wards', target: 32, suffix: '' },
  { label: 'Citizen Satisfaction', target: 94, suffix: '%' },
];

export function StatStrip() {
  const ref = useStatReveal<HTMLDivElement>();

  return (
    <section className="border-b border-border bg-surface" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-0 divide-x divide-border md:grid-cols-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col gap-1 px-8 py-12">
              <span
                className="stat-value text-3xl font-bold tracking-tight text-text-primary md:text-4xl"
                style={{ transitionDelay: `${idx * 80}ms` }}
                data-target={stat.target}
                data-suffix={stat.suffix}
              >
                0{stat.suffix}
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
