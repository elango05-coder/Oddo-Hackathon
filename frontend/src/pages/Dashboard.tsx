import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import {
  TrendingUp,
  Laptop,
  AlertCircle,
  FileSpreadsheet,
  Activity,
  RefreshCw,
  Wrench,
  Database,
  Sparkles
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const userRole = typeof user?.roleId === 'object' ? user.roleId.name : '';

  useEffect(() => {
    if (userRole === 'Employee') {
      navigate('/assets', { replace: true });
    }
  }, [userRole, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardService.getStats(),
    enabled: userRole !== '' && userRole !== 'Employee',
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

  const seedDemoMutation = useMutation({
    mutationFn: () => dashboardService.seedDemo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Database successfully seeded with 20 Departments, 200 Employees, 1000 Assets, 300 Bookings, 150 Maintenance tickets, and 50 Audit cycles!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to seed demo database.');
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

  const getActionColor = (action: string) => {
    switch (action) {
      case 'REGISTER_ASSET':
      case 'CREATE_AUDIT_CYCLE':
        return 'bg-emerald-500';
      case 'UPDATE_ASSET':
      case 'RETURN_ASSET':
        return 'bg-indigo-500';
      case 'ALLOCATE_ASSET':
      case 'MAINTENANCE_REQUEST':
        return 'bg-amber-500';
      case 'RESOLVE_MAINTENANCE':
        return 'bg-green-500';
      case 'DELETE_ASSET':
      case 'DEACTIVATE_USER':
        return 'bg-rose-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <DashboardLayout>
      {/* Hackathon Control Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 dark:from-indigo-950 dark:to-slate-950 border border-indigo-500/20 text-white rounded-3xl p-6 mb-6 shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-64 w-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex-1 space-y-1.5 z-10">
          <div className="flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit border border-indigo-400/20">
            <Sparkles className="h-3 w-3" />
            Hackathon Mode Activated
          </div>
          <h3 className="text-lg font-bold">AssetFlow Sandbox Control Hub</h3>
          <p className="text-xs text-indigo-200/80 max-w-xl">
            Populate your workspace instantly with realistic, structured enterprise datasets containing 20 departments, 200 employees, 1,000 assets, 300 active bookings, and compliance cycles.
          </p>
        </div>
        <div className="z-10 flex-shrink-0">
          <button
            onClick={() => seedDemoMutation.mutate()}
            disabled={seedDemoMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-900/40 border border-indigo-400/30 transition-all active:scale-[0.98]"
          >
            <Database className={`h-4 w-4 ${seedDemoMutation.isPending ? 'animate-bounce' : ''}`} />
            {seedDemoMutation.isPending ? 'Seeding Sandbox Space...' : 'Seed Bulk Sandbox Data'}
          </button>
        </div>
      </div>

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
              ₹{stats.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <Bar dataKey="totalCost" fill="#6366f1" radius={[4, 4, 0, 0]} name="Cost (₹)" />
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
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-sm flex items-center gap-1.5 text-slate-900 dark:text-white">
            <Activity className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
            Recent Activity Timeline
          </h4>
        </div>
        <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
          {stats.recentLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No audit logs recorded yet.
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-100 dark:border-slate-800/60 ml-3 pl-6 space-y-5 py-1">
              {stats.recentLogs.map((log: any) => {
                const relativeTime = (() => {
                  const diffMs = Date.now() - new Date(log.timestamp).getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffHours = Math.floor(diffMins / 60);
                  const diffDays = Math.floor(diffHours / 24);
                  if (diffMins < 1) return 'Just now';
                  if (diffMins < 60) return `${diffMins}m ago`;
                  if (diffHours < 24) return `${diffHours}h ago`;
                  if (diffDays === 1) return 'Yesterday';
                  return new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                })();

                return (
                  <div key={log._id} className="relative group text-xs">
                    {/* Circle Bullet */}
                    <span className={`absolute -left-[33px] mt-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${getActionColor(log.action)} shadow-sm transition-transform group-hover:scale-110`} />
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 bg-slate-50/50 dark:bg-slate-850/30 p-2.5 rounded-xl border border-slate-100/40 dark:border-slate-800/10 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                          {log.action.replace(/_/g, ' ').toLowerCase()}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Actor: <strong className="text-slate-700 dark:text-slate-300">{log.userId?.name || 'System'}</strong> | Type: {log.collectionName}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md self-end sm:self-center">
                        {relativeTime}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
export default Dashboard;
