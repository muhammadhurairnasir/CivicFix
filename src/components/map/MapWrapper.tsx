'use client';

import dynamic from 'next/dynamic';

const GPSPicker = dynamic(() => import('./GPSPicker'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] md:h-[400px] bg-bg-subtle animate-pulse rounded-xl flex items-center justify-center border border-border">
      <span className="text-text-tertiary text-sm font-medium">Loading Map...</span>
    </div>
  )
});

export default GPSPicker;
