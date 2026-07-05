'use client';

import React, { ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from './Skeleton';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  selectedIds?: string[];
  onSelectIds?: (ids: string[]) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (accessor: string) => void;
  pagination?: PaginationProps;
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  keyExtractor,
  onRowClick,
  selectedIds,
  onSelectIds,
  sortBy,
  sortOrder,
  onSort,
  pagination,
  emptyMessage = 'No results found.',
}: DataTableProps<T>) {

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectIds) return;
    if (e.target.checked) {
      onSelectIds(data.map(keyExtractor));
    } else {
      onSelectIds([]);
    }
  };

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (!onSelectIds || !selectedIds) return;
    if (e.target.checked) {
      onSelectIds([...selectedIds, id]);
    } else {
      onSelectIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const allSelected = data.length > 0 && selectedIds?.length === data.length;
  const someSelected = selectedIds && selectedIds.length > 0 && selectedIds.length < data.length;

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded border border-border bg-background">
        <table className="w-full text-left text-sm text-text-secondary">
          <thead className="border-b border-border bg-surface text-text-secondary">
            <tr>
              {onSelectIds && (
                <th className="w-12 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-border accent-primary"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected || false;
                    }}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-widest ${
                    col.sortable && col.accessorKey && onSort
                      ? 'cursor-pointer select-none hover:bg-card hover:text-text-primary'
                      : ''
                  } ${col.className || ''}`}
                  onClick={() => {
                    if (col.sortable && col.accessorKey && onSort) {
                      onSort(col.accessorKey as string);
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && col.accessorKey && onSort && sortBy === col.accessorKey && (
                      sortOrder === 'asc'
                        ? <ChevronUp className="h-3.5 w-3.5" />
                        : <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse bg-background">
                  {onSelectIds && (
                    <td className="px-4 py-3 text-center">
                      <div className="h-4 w-4 rounded bg-border" />
                    </td>
                  )}
                  {columns.map((_, cIdx) => (
                    <td key={`skeleton-td-${cIdx}`} className="px-4 py-3">
                      <Skeleton className="h-5 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onSelectIds ? 1 : 0)}
                  className="px-4 py-12 text-center text-text-secondary"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const id = keyExtractor(item);
                const isSelected = selectedIds?.includes(id) || false;

                return (
                  <tr
                    key={id}
                    className={`bg-background transition-colors hover:bg-surface ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${isSelected ? 'bg-surface' : ''}`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {onSelectIds && (
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded border-border accent-primary"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(e, id)}
                        />
                      </td>
                    )}
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className={`px-4 py-3 text-text-primary ${col.className || ''}`}>
                        {col.render
                          ? col.render(item)
                          : col.accessorKey
                          ? (item[col.accessorKey] as ReactNode)
                          : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-2 py-4">
          <div className="text-sm text-text-secondary">
            Showing <span className="font-medium text-text-primary">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-medium text-text-primary">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-medium text-text-primary">{pagination.total}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className="inline-flex items-center rounded border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-card disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </button>

            <div className="hidden items-center gap-1 sm:flex">
              {Array.from({ length: pagination.totalPages }).map((_, i) => {
                const p = i + 1;
                if (
                  p === 1 ||
                  p === pagination.totalPages ||
                  (p >= pagination.page - 1 && p <= pagination.page + 1)
                ) {
                  return (
                    <button
                      key={p}
                      onClick={() => pagination.onPageChange(p)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors ${
                        p === pagination.page
                          ? 'bg-primary text-primary-fg'
                          : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                      }`}
                    >
                      {p}
                    </button>
                  );
                } else if (
                  (p === 2 && pagination.page > 3) ||
                  (p === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
                ) {
                  return <span key={p} className="px-1 text-text-secondary">…</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="inline-flex items-center rounded border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-card disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
