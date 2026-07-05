'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

/*
  FLAG: The previous `accent` prop used Tailwind color scales (blue-50, green-50, etc.)
  which are forbidden in the locked system. The `accent` prop has been removed.
  Icon containers now use the single locked --card background with --text-secondary icon color.
  If callers need distinct icon accent colors, they must supply a `style` prop externally.
*/
interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    label?: string;
    positive?: boolean;
  };
  icon?: React.ReactNode;
  loading?: boolean;
}

export function MetricCard({
  label,
  value,
  subValue,
  trend,
  icon,
  loading = false,
}: MetricCardProps) {

  const getTrendColor = (): string => {
    if (!trend || trend.direction === 'neutral') return 'var(--text-secondary)';
    const isPositiveTrend =
      trend.positive === false
        ? trend.direction !== 'up'
        : trend.direction === 'up';
    return isPositiveTrend ? 'var(--status-resolved)' : 'var(--status-critical)';
  };

  const TrendIcon =
    trend?.direction === 'up'   ? TrendingUp :
    trend?.direction === 'down' ? TrendingDown :
    Minus;

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded p-5 space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        {icon && (
          <div className="w-9 h-9 rounded border border-border bg-card flex items-center justify-center text-text-secondary">
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="text-3xl font-bold text-text-primary tracking-tight">
          {value}
        </div>
        {subValue && (
          <div className="text-xs text-text-secondary mt-0.5">{subValue}</div>
        )}
      </div>

      {trend && (
        <div
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: getTrendColor() }}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{trend.value}</span>
          {trend.label && (
            <span className="font-normal ml-0.5 text-text-secondary">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}
