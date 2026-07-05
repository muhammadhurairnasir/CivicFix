'use client';

import dynamic from 'next/dynamic';

const ReportMap = dynamic(() => import('./ReportMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-[var(--surface)] animate-pulse rounded-lg flex items-center justify-center border border-[var(--border)]">
      <span className="text-[var(--text-secondary)] text-sm font-medium tracking-wide">Loading Map Data...</span>
    </div>
  )
});

export default ReportMap;
