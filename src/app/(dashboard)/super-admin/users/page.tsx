'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Search, Download, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';

export default function SuperAdminUsersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Role Guard
  React.useEffect(() => {
    if (!authLoading && user && user.role !== UserRole.SUPER_ADMIN) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const fetchUsers = async () => {
    const res = await axios.get('/api/super-admin/users', {
      params: { page, limit: 20, search, role: roleFilter, sortBy: 'createdAt', sortOrder: 'desc' }
    });
    return res.data;
  };

  const { data, isLoading, isError } = useQuery<{data: any[], pagination: any}>({
    queryKey: ['super-admin-users', page, search, roleFilter],
    queryFn: fetchUsers,
    placeholderData: (prev: any) => prev,
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      await axios.patch(`/api/super-admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/super-admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
    }
  });

  const handleRoleChange = (id: string, newRole: string) => {
    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      patchMutation.mutate({ id, data: { role: newRole } });
    }
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      patchMutation.mutate({ id, data: { isActive: !currentStatus } });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('CRITICAL WARNING: This will permanently delete the user and soft-delete all their reports. This cannot be undone. Proceed?')) {
      deleteMutation.mutate(id);
    }
  };

  if (authLoading || !user || user.role !== UserRole.SUPER_ADMIN) return null;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all platform users, roles, and access</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Button variant="secondary" className="flex items-center" onClick={() => alert('CSV Export coming soon!')}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 w-full sm:w-auto overflow-x-auto">
            {['all', 'citizen', 'crew', 'admin', 'super_admin'].map((role) => (
              <button
                key={role}
                onClick={() => { setRoleFilter(role); setPage(1); }}
                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize whitespace-nowrap transition-colors ${
                  roleFilter === role 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {role.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Reports</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-6 py-4"><Skeleton className="h-8 w-full" /></td></tr>
                ))
              ) : isError ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-red-500">Failed to load users</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No users found matching criteria</td></tr>
              ) : (
                data?.data?.map((u: any) => (
                  <tr key={u._id} className={`hover:bg-slate-50 ${!u.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs mr-3">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 flex items-center">
                            {u.name}
                            {u.role === 'super_admin' && <ShieldAlert className="w-3 h-3 text-purple-600 ml-1" />}
                          </div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <select 
                        disabled={u._id === user.id || patchMutation.isPending}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-xs font-medium bg-slate-100 border-none rounded py-1 pl-2 pr-6 capitalize focus:ring-2 focus:ring-brand-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="citizen">Citizen</option>
                        <option value="crew">Crew</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          disabled={u._id === user.id || patchMutation.isPending}
                          onClick={() => handleToggleActive(u._id, u.isActive)}
                          className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                            u.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                          } disabled:opacity-50`}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </button>
                        {u.isVerified && <span className="text-xs text-blue-600">✓ Verified</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        {u.reportsCount}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button 
                        disabled={u._id === user.id || deleteMutation.isPending}
                        onClick={() => handleDelete(u._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <div className="space-x-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
