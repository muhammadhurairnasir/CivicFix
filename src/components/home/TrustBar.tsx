import { Building } from 'lucide-react';

export function TrustBar() {
  return (
    <section className="border-b border-border bg-background py-10 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Trusted by municipalities nationwide
        </p>
        
        {/* Simple CSS marquee effect for logos/names */}
        <div className="relative flex overflow-x-hidden">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-16 py-2">
            {[
              'City of Springfield',
              'Metro District',
              'Oakville Ward 4',
              'Riverdale Municipality',
              'Pine Valley Council',
              'City of Springfield',
              'Metro District',
              'Oakville Ward 4',
            ].map((name, i) => (
              <div key={i} className="flex items-center gap-2 opacity-50 grayscale transition-opacity hover:opacity-100 hover:grayscale-0">
                <Building className="h-5 w-5 text-text-secondary" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-text-secondary">{name}</span>
              </div>
            ))}
          </div>
          
          <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center gap-16 py-2">
            {[
              'City of Springfield',
              'Metro District',
              'Oakville Ward 4',
              'Riverdale Municipality',
              'Pine Valley Council',
              'City of Springfield',
              'Metro District',
              'Oakville Ward 4',
            ].map((name, i) => (
              <div key={`dup-${i}`} className="flex items-center gap-2 opacity-50 grayscale transition-opacity hover:opacity-100 hover:grayscale-0">
                <Building className="h-5 w-5 text-text-secondary" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-text-secondary">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
