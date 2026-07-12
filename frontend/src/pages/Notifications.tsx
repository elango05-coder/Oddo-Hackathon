import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { AppNotification } from '../types';
import { Bell, CheckSquare, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Notifications: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifRes, isLoading, error } = useQuery({
    queryKey: ['notificationsAllList'],
    queryFn: () => notificationService.getAll(),
  });

  const notifications: AppNotification[] = notifRes?.data || [];

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationsAllList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('All notifications marked as read.');
    },
    onError: () => {
      toast.error('Failed to update notifications.');
    },
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Notification Alerts</h2>
          <p className="text-xs text-slate-500">Track allocations, approvals, and system notifications.</p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-205 dark:border-slate-800 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
          >
            <CheckSquare className="h-4.5 w-4.5 text-indigo-600" />
            Mark All Read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-44 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 border rounded-xl text-red-750">Failed to load alerts.</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-40 text-slate-400" />
              No notifications recorded yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                  !notif.isRead ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl mt-0.5 ${
                      !notif.isRead ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Bell className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {notif.title}
                        {!notif.isRead && (
                          <span className="h-2 w-2 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </DashboardLayout>
  );
};
export default Notifications;
