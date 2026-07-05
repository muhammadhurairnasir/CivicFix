import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IReportDocument } from '@/models/Report';
import { PaginatedResponse, ApiResponse } from '@/types';

// Fetch helper
const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to fetch');
  }
  return json;
};

// ─── HOOKS ───────────────────────────────────────────────────────────────────

export interface ReportFilters {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  type?: string;
  ward?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export function useReports(filters: ReportFilters = {}) {
  // Clean up undefined filters and construct query string
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.append(key, value.toString());
    }
  });

  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => fetcher(`/api/reports?${queryParams.toString()}`) as Promise<PaginatedResponse<any>>,
    staleTime: 30 * 1000, // cache for 30s as requested
  });
}

export function useMyReports(filters: ReportFilters = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.append(key, value.toString());
    }
  });

  return useQuery({
    queryKey: ['my-reports', filters],
    queryFn: () => fetcher(`/api/reports/my?${queryParams.toString()}`) as Promise<PaginatedResponse<any>>,
    staleTime: 30 * 1000,
  });
}

export function useMyStats() {
  return useQuery({
    queryKey: ['my-stats'],
    queryFn: () => fetcher(`/api/reports/my/stats`) as Promise<ApiResponse<any>>,
    staleTime: 60 * 1000,
  });
}

export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: () => fetcher(`/api/public/stats`) as Promise<ApiResponse<any>>,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useReport(ticketNumber: string) {
  return useQuery({
    queryKey: ['report', ticketNumber],
    queryFn: () => fetcher(`/api/public/reports/${ticketNumber}`) as Promise<ApiResponse<any>>,
    enabled: !!ticketNumber,
  });
}

export function useUpvote(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reports/${reportId}/upvote`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to upvote');
      return json;
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['reports'] });
      // We don't have access to the exact feed cache keys easily without knowing all filters,
      // but if we were storing it, we would update it here.
      // Usually, we invalidate to trigger refetch, or update the specific single report cache.
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
    },
  });
}

export function useCreateComment(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to comment');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', reportId] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
    },
  });
}

export function useComments(reportId: string) {
  return useQuery({
    queryKey: ['comments', reportId],
    queryFn: () => fetcher(`/api/reports/${reportId}/comments`) as Promise<ApiResponse<any>>,
    enabled: !!reportId,
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete report');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      queryClient.invalidateQueries({ queryKey: ['my-stats'] });
      queryClient.invalidateQueries({ queryKey: ['public-stats'] });
    },
  });
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export function useNotifications(unreadOnly = false, page = 1) {
  return useQuery({
    queryKey: ['notifications', unreadOnly, page],
    queryFn: () => fetcher(`/api/notifications?unreadOnly=${unreadOnly}&page=${page}`) as Promise<PaginatedResponse<any> & { unreadCount: number }>,
    staleTime: 60 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to mark read');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/notifications/read-all`, { method: 'PATCH' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to mark all read');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
