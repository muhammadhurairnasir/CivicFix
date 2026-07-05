'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';

interface BarDataPoint {
  name: string;
  value: number;
  color: string; // Chart data colours are supplied by caller, not Tailwind classes.
}

interface HorizontalBarChartProps {
  data: BarDataPoint[];
  loading?: boolean;
  height?: number;
}

/*
  Recharts renders inside an SVG/canvas context — Tailwind classes cannot be
  applied to SVG elements. We must use inline hex/rgba values here.
  We use the locked CSS variable *values* (read at component mount) via
  getComputedStyle so these stay consistent with the active theme.
*/
function getCSSVar(name: string): string {
  if (typeof window === 'undefined') return '#9A9590';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="border rounded px-3 py-2 text-sm"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        color: 'var(--text-primary)',
      }}
    >
      <p className="font-semibold capitalize mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: payload[0].fill }} />
        <span style={{ color: 'var(--text-secondary)' }}>Reports:</span>
        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{payload[0].value.toLocaleString()}</span>
      </div>
    </div>
  );
};

export function HorizontalBarChart({ data, loading = false, height = 220 }: HorizontalBarChartProps) {
  if (loading) {
    return <Skeleton className="w-full rounded" style={{ height }} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm" style={{ height, color: 'var(--text-secondary)' }}>
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 50, left: 4, bottom: 4 }}
        barSize={22}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          width={70}
          tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface)' }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            style={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
