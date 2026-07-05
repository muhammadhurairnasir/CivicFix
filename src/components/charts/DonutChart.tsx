'use client';

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';

interface DonutDataPoint {
  name: string;
  value: number;
  color: string; // Chart segment colours are supplied by caller.
}

interface DonutChartProps {
  data: DonutDataPoint[];
  loading?: boolean;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius,
    startAngle, endAngle, fill, percent, value,
  } = props;
  return (
    <g>
      {/* Value — use CSS variable string directly in SVG fill attr */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text-primary)" fontSize={14} fontWeight={700}>
        {value.toLocaleString()}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-secondary)" fontSize={11}>
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0];
  return (
    <div
      className="border rounded px-3 py-2 text-sm"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: d.payload.color }} />
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{d.name}</span>
      </div>
      <div style={{ color: 'var(--text-secondary)' }}>
        Count: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{d.value.toLocaleString()}</span>
      </div>
      <div style={{ color: 'var(--text-secondary)' }}>
        Share: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{((d.payload.percent || 0) * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};

export function DonutChart({
  data,
  loading = false,
  height = 260,
  innerRadius = 55,
  outerRadius = 90,
}: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);

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

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const enriched = data.map(d => ({ ...d, percent: d.value / total }));

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          {React.createElement(Pie as any, {
            data: enriched,
            cx: '50%',
            cy: '50%',
            innerRadius,
            outerRadius,
            dataKey: 'value',
            activeShape: renderActiveShape,
            activeIndex,
            onMouseEnter: (_: any, index: number) => setActiveIndex(index),
            stroke: 'none',
          }, enriched.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          )))}
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-col gap-1 px-2">
        {enriched.map((entry, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between text-sm py-1 px-2 rounded cursor-pointer transition-colors ${activeIndex === idx ? 'bg-card' : 'hover:bg-card'}`}
            onMouseEnter={() => setActiveIndex(idx)}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: entry.color }} />
              <span className="capitalize text-text-secondary">{entry.name.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-text-primary">{entry.value.toLocaleString()}</span>
              <span className="text-xs w-10 text-right text-text-secondary">{(entry.percent * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
