'use client';

import { Users, Building2, HardHat } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const roles = [
  {
    icon: Users,
    title: 'For Citizens',
    description:
      "See a problem? Snap a photo and send it straight to the city. We'll keep you updated every step of the way until it's fixed.",
    features: ['No account needed', 'Live progress updates', 'See what neighbors reported'],
  },
  {
    icon: Building2,
    title: 'For Governments',
    description:
      'Stop dealing with messy spreadsheets and phone calls. We automatically organize all citizen reports and send them to the right department.',
    features: ['Smart sorting', 'Deadlines & alerts', 'City-wide health map'],
  },
  {
    icon: HardHat,
    title: 'For Field Crews',
    description:
      'Get exactly where you need to go with photos and map directions. Update the job status on your phone as soon as you finish the work.',
    features: ['Works great on mobile', 'Before & after photos', 'Clear daily task list'],
  },
];

export function RoleShowcase() {
  const ref = useInView<HTMLElement>();

  return (
    <section
      ref={ref}
      className="border-b border-border bg-surface py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-16 max-w-2xl">
          <p
            className="civic-animate mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary"
            data-anim="fade-in"
          >
            Built for everyone
          </p>
          <h2
            className="civic-animate civic-delay-1 text-3xl font-bold tracking-tight text-text-primary md:text-4xl"
            data-anim="fade-up"
          >
            A platform that serves the entire civic ecosystem.
          </h2>
          <p
            className="civic-animate civic-delay-2 mt-4 text-lg text-text-secondary"
            data-anim="fade-up"
          >
            One platform connecting the people who spot the problem with the people who fix it.
          </p>
        </div>

        <div className="grid gap-px border border-border bg-border md:grid-cols-3">
          {roles.map((role, i) => (
            <div
              key={role.title}
              className={`civic-animate civic-delay-${i + 1} group flex flex-col gap-6 bg-surface p-8 transition-all duration-300 hover:bg-background hover:shadow-md hover:-translate-y-1`}
              data-anim="scale-in"
            >
              <role.icon
                className="h-6 w-6 text-text-secondary transition-all duration-300 group-hover:text-primary group-hover:scale-110"
                strokeWidth={2}
              />
              <div>
                <h3 className="mb-2 text-lg font-semibold text-text-primary">{role.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{role.description}</p>
              </div>
              <ul className="mt-auto space-y-2 border-t border-border pt-6">
                {role.features.map((f, fi) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-sm text-text-secondary"
                    style={{ transitionDelay: `${fi * 40}ms` }}
                  >
                    <span className="h-1 w-4 shrink-0 border-t border-text-secondary transition-all duration-300 group-hover:w-5 group-hover:border-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
