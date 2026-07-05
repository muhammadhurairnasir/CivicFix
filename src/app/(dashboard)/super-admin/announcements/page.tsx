'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Megaphone, Send, Clock, AlertTriangle, Info, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';

export default function SuperAdminAnnouncementsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [priority, setPriority] = useState('info');
  const [result, setResult] = useState<{ success: boolean; message: string; sent?: number; pushes?: number } | null>(null);

  React.useEffect(() => {
    if (!authLoading && user && user.role !== UserRole.SUPER_ADMIN) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const { data: history, isLoading } = useQuery({
    queryKey: ['super-admin-announcements'],
    queryFn: async () => (await axios.get('/api/super-admin/announcements')).data.data,
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post('/api/super-admin/announcements', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setResult({ success: true, message: 'Announcement sent successfully!', sent: data.sent, pushes: data.pushesSent });
      setTitle('');
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['super-admin-announcements'] });
      setTimeout(() => setResult(null), 5000);
    },
    onError: (err: any) => {
      setResult({ success: false, message: err.response?.data?.error || 'Failed to send announcement' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    
    if (priority === 'critical') {
      if (!confirm('Warning: This will send an immediate Push Notification to all affected users. Are you sure?')) {
        return;
      }
    }
    
    mutation.mutate({ title, body, targetRole, priority });
  };

  if (authLoading || !user || user.role !== UserRole.SUPER_ADMIN) return null;

  const displayTitle = priority === 'critical' ? `🚨 ${title}` : title;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display flex items-center">
            <Megaphone className="w-6 h-6 mr-3 text-brand-600" />
            System Announcements
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-9">Broadcast messages to specific user roles or the entire platform</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Builder Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-4">Compose Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['all', 'citizen', 'crew', 'admin'].map(role => (
                  <label key={role} className={`cursor-pointer border rounded-lg p-3 text-center text-sm font-medium transition-colors ${targetRole === role ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <input type="radio" className="sr-only" checked={targetRole === role} onChange={() => setTargetRole(role)} />
                    <span className="capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority Level</label>
              <div className="grid grid-cols-3 gap-3">
                <label className={`cursor-pointer border rounded-lg p-3 text-center text-sm font-medium flex flex-col items-center justify-center transition-colors ${priority === 'info' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <input type="radio" className="sr-only" checked={priority === 'info'} onChange={() => setPriority('info')} />
                  <Info className="w-5 h-5 mb-1" />
                  Info
                </label>
                <label className={`cursor-pointer border rounded-lg p-3 text-center text-sm font-medium flex flex-col items-center justify-center transition-colors ${priority === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <input type="radio" className="sr-only" checked={priority === 'warning'} onChange={() => setPriority('warning')} />
                  <AlertTriangle className="w-5 h-5 mb-1" />
                  Warning
                </label>
                <label className={`cursor-pointer border rounded-lg p-3 text-center text-sm font-medium flex flex-col items-center justify-center transition-colors ${priority === 'critical' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <input type="radio" className="sr-only" checked={priority === 'critical'} onChange={() => setPriority('critical')} />
                  <Bell className="w-5 h-5 mb-1" />
                  Critical
                </label>
              </div>
              {priority === 'critical' && (
                <p className="text-xs text-red-600 mt-2">Critical priority will immediately trigger mobile Push Notifications to all target users.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message Title</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="e.g. Scheduled Maintenance Notice"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message Body</label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                placeholder="Detailed information..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              ></textarea>
            </div>

            {result && (
              <div className={`p-4 rounded-lg text-sm font-medium ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {result.message}
                {result.sent !== undefined && <div className="mt-1 font-normal opacity-80">Delivered to {result.sent} user(s). {result.pushes ? `${result.pushes} push notifications sent.` : ''}</div>}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full flex items-center justify-center"
              disabled={mutation.isPending || !title || !body}
            >
              {mutation.isPending ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Broadcast Announcement</>}
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          {/* Live Preview */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 hidden sm:block">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Preview (In-App Notification)</h2>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative max-w-sm mx-auto">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center
                    ${priority === 'critical' ? 'bg-red-100 text-red-600' :
                      priority === 'warning' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'}`}>
                    <Megaphone className="w-5 h-5" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-slate-900 line-clamp-1">{displayTitle || 'Message Title'}</p>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-3">{body || 'The detailed message content will appear here.'}</p>
                  <p className="text-xs text-slate-400 mt-2">Just now</p>
                </div>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1">
            <h2 className="text-base font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-slate-400" />
              Recent Broadcasts
            </h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
              ) : history?.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No previous broadcasts.</p>
              ) : (
                history?.map((item: any) => (
                  <div key={item._id} className="p-3 border border-slate-100 bg-slate-50 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-900 line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.body}</p>
                    <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider">
                      {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
