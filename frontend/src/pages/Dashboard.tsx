import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import {
  TrendingUp,
  Laptop,
  AlertCircle,
  FileSpreadsheet,
  Activity,
  Clock,
  RefreshCw,
  Wrench
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardService.getStats(),
  });

  const rebuildCacheMutation = useMutation({
    mutationFn: () => dashboardService.rebuildCache(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Dashboard statistics cache re-built.');
    },
    onError: () => {
      toast.error('Failed to rebuild statistics cache.');
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load dashboard statistics. Please retry.</span>
        </div>
      </DashboardLayout>
    );
  }

  const stats = data?.data || {
    totalAssets: 0,
    totalValue: 0,
    activeAllocations: 0,
    openMaintenance: 0,
    recentLogs: [],
    categoryDistribution: [],
    maintenanceCosts: []
  };

  return (
    <DashboardLayout>
      {/* Dashboard Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">System Status Overview</h2>
          <p className="text-xs text-slate-500">Live operational data from the ERP databases.</p>
        </div>
        <button
          onClick={() => rebuildCacheMutation.mutate()}
          disabled={rebuildCacheMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${rebuildCacheMutation.isPending ? 'animate-spin' : ''}`} />
          Rebuild Cache
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Assets */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Registered Assets</span>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{stats.totalAssets}</h3>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Laptop className="h-6 w-6" />
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Inventory Cost</span>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
              ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Checked Out */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Active Allocations</span>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{stats.activeAllocations}</h3>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
        </div>

        {/* Maintenance requests */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Under Repair tickets</span>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{stats.openMaintenance}</h3>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
            <Wrench className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Cost / Maintenance Cost Trend Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
          <h4 className="font-bold text-sm mb-4">Maintenance Spendings Trend</h4>
          <div className="h-64">
            {stats.maintenanceCosts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No maintenance records found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.maintenanceCosts}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203,213,225,0.2)" />
                  <XAxis dataKey="_id" stroke="rgba(148,163,184,0.7)" fontSize={11} />
                  <YAxis stroke="rgba(148,163,184,0.7)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar dataKey="totalCost" fill="#6366f1" radius={[4, 4, 0, 0]} name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h4 className="font-bold text-sm mb-4">Assets by Category</h4>
          <div className="h-64 flex flex-col justify-center">
            {stats.categoryDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No category data available.
              </div>
            ) : (
              <div className="h-44 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="categoryName"
                    >
                      {stats.categoryDistribution.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 overflow-y-auto max-h-20 custom-scrollbar text-xs space-y-1.5">
              {stats.categoryDistribution.map((entry: any, index: number) => (
                <div key={entry.categoryName} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-40">{entry.categoryName}</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feeds */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-sm flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Recent Activity Logs
          </h4>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto custom-scrollbar">
          {stats.recentLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No audit logs recorded yet.
            </div>
          ) : (
            stats.recentLogs.map((log: any) => (
              <div key={log._id} className="py-3 flex justify-between items-start gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 capitalize">
                    {log.action.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    User: {log.userId?.name || 'System'} | Collection: {log.collectionName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
export default Dashboard;
