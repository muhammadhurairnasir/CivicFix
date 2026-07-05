'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, CheckCircle, Info, AlertTriangle, 
  Settings, Loader2, CheckCheck
} from 'lucide-react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useReports';
import Link from 'next/link';

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  
  const { data: notifData, isLoading } = useNotifications(unreadOnly, 1);
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  const notifications = notifData?.data || [];
  const unreadCount = notifData?.unreadCount || 0;

  const handleMarkRead = (id: string, isRead: boolean) => {
    if (isRead || markReadMutation.isPending) return;
    markReadMutation.mutate(id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'status_update': return <CheckCircle className="w-5 h-5 text-[var(--status-resolved)]" />;
      case 'comment_added': return <Info className="w-5 h-5 text-[var(--primary)]" />;
      case 'sla_breach': return <AlertTriangle className="w-5 h-5 text-[var(--status-critical)]" />;
      case 'system': return <Settings className="w-5 h-5 text-[var(--text-secondary)]" />;
      default: return <Bell className="w-5 h-5 text-[var(--primary)]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            You have <span className="font-bold text-[var(--text-primary)]">{unreadCount}</span> unread notifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={unreadCount === 0 || markAllMutation.isPending}
            className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] disabled:opacity-50 flex items-center gap-2"
          >
            {markAllMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setUnreadOnly(false)}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
            !unreadOnly 
              ? 'bg-[var(--text-primary)] text-white' 
              : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
          }`}
        >
          All Notifications
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
            unreadOnly 
              ? 'bg-[var(--primary)] text-white' 
              : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
          }`}
        >
          Unread Only
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        
        {isLoading && (
          <div className="divide-y divide-[var(--border)] animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 bg-[var(--surface)] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--surface)] rounded w-1/3" />
                  <div className="h-4 bg-[var(--surface)] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-[var(--text-secondary)]" />
            </div>
            <h3 className="font-medium text-[var(--text-primary)]">You&apos;re all caught up!</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {unreadOnly ? 'No unread notifications right now.' : 'You have no notifications.'}
            </p>
          </div>
        )}

        {!isLoading && notifications.length > 0 && (
          <div className="divide-y divide-[var(--border)]">
            {notifications.map((notif: any) => {
              const ContentWrapper = notif.reportId ? Link : 'div';
              const wrapperProps = notif.reportId ? { href: `/reports/${notif.reportId}` } : {};

              return (
                <div 
                  key={notif._id} 
                  onClick={() => handleMarkRead(notif._id, notif.isRead)}
                  className={`p-4 sm:p-6 flex items-start gap-4 transition-colors ${
                    !notif.isRead ? 'bg-[var(--surface)] hover:bg-[var(--surface)]/80' : 'hover:bg-[var(--surface)]'
                  } ${notif.reportId ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center shadow-sm">
                      {getIcon(notif.type)}
                    </div>
                  </div>
                  
                  <ContentWrapper {...wrapperProps as any} className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={`text-sm ${!notif.isRead ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {notif.body}
                    </p>
                  </ContentWrapper>
                  
                  {!notif.isRead && (
                    <div className="flex-shrink-0 flex items-center justify-center pt-2">
                      <div className="w-2.5 h-2.5 bg-[var(--primary)] rounded-full shadow-sm" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
