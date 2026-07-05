'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/Skeleton';

interface TrendDataPoint {
  date: string;
  submitted: number;
  resolved: number;
}

interface AreaTrendChartProps {
  data: TrendDataPoint[];
  loading?: boolean;
  height?: number;
}

/*
  Chart line colours map directly to locked status tokens:
  - submitted → --primary (the single accent)
  - resolved  → --status-resolved
  These are the only two colours in this chart. No palette classes used.
*/
const SUBMITTED_COLOR = 'var(--primary)';
const RESOLVED_COLOR  = 'var(--status-resolved)';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  let displayLabel = label;
  try { displayLabel = format(parseISO(label), 'MMM d, yyyy'); } catch {}

  return (
    <div
      className="border rounded px-4 py-3 text-sm"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{displayLabel}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }: any) => (
  <div className="flex justify-center gap-6 mt-2">
    {payload?.map((entry: any) => (
      <div key={entry.value} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: entry.color }} />
        {entry.value}
      </div>
    ))}
  </div>
);

export function AreaTrendChart({ data, loading = false, height = 280 }: AreaTrendChartProps) {
  if (loading) {
    return <Skeleton className="w-full rounded" style={{ height }} />;
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm"
        style={{ height, color: 'var(--text-secondary)' }}
      >
        No data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
        {/* Gradients removed per civic design guidelines. Using solid colors with opacity in Area components instead. */}

        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

        <XAxis
          dataKey="date"
          tickFormatter={(val) => {
            try { return format(parseISO(val), 'MMM d'); }
            catch { return val; }
          }}
          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
        />

        <YAxis
          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />

        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />

        <Area
          type="monotone"
          dataKey="submitted"
          name="Submitted"
          stroke={SUBMITTED_COLOR}
          strokeWidth={2}
          fill={SUBMITTED_COLOR}
          fillOpacity={0.1}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="resolved"
          name="Resolved"
          stroke={RESOLVED_COLOR}
          strokeWidth={2}
          fill={RESOLVED_COLOR}
          fillOpacity={0.1}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
