import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/reportService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Download, BarChart3, TrendingUp, AlertTriangle, Star, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import toast from 'react-hot-toast';

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'utilization' | 'maintenance' | 'idle' | 'popular'>('utilization');

  // Fetch reports data queries
  const { data: utilRes, isLoading: utilLoading } = useQuery({
    queryKey: ['reportUtilization'],
    queryFn: () => reportService.getUtilization(),
  });

  const { data: maintRes, isLoading: maintLoading } = useQuery({
    queryKey: ['reportMaintenance'],
    queryFn: () => reportService.getMaintenanceStats(),
  });

  const { data: idleRes, isLoading: idleLoading } = useQuery({
    queryKey: ['reportIdle'],
    queryFn: () => reportService.getIdleAssets(),
  });

  const { data: popularRes, isLoading: popularLoading } = useQuery({
    queryKey: ['reportPopular'],
    queryFn: () => reportService.getPopularAssets(),
  });

  const utilizationData = utilRes?.data || [];
  const maintenanceData = maintRes?.data || [];
  const idleAssets = idleRes?.data || [];
  const popularAssets = popularRes?.data || [];

  const handleExportCSV = async () => {
    try {
      const blob = await reportService.exportCSV();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assetflow_inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Inventory CSV report exported successfully.');
    } catch (e: any) {
      toast.error('Failed to export inventory CSV.');
    }
  };

  const isTabLoading =
    (activeTab === 'utilization' && utilLoading) ||
    (activeTab === 'maintenance' && maintLoading) ||
    (activeTab === 'idle' && idleLoading) ||
    (activeTab === 'popular' && popularLoading);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Analytics & Reports</h2>
          <p className="text-xs text-slate-500">Generate compliance metrics, utilization rates, and financial reports.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors"
        >
          <Download className="h-4.5 w-4.5" />
          Export Inventory CSV
        </button>
      </div>

      {/* Tabs navigation list */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        {(
          [
            { id: 'utilization', label: 'Utilization Rates', icon: TrendingUp },
            { id: 'maintenance', label: 'Maintenance Cost', icon: BarChart3 },
            { id: 'idle', label: 'Idle Inventory', icon: AlertTriangle },
            { id: 'popular', label: 'Popular Assets', icon: Star },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 border-b-2 font-medium text-xs transition-colors -mb-px ${
                isActive
                  ? 'border-indigo-650 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm min-h-[300px] relative">
        {isTabLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div>
            {/* Tab 1: Utilization Chart */}
            {activeTab === 'utilization' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Utilization Rate by Category</h3>
                  <p className="text-xs text-slate-500 mt-1">Percentage of category assets checked out or allocated.</p>
                </div>
                <div className="h-72">
                  {utilizationData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-450 text-xs italic">
                      No category allocations logged yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={utilizationData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203,213,225,0.2)" />
                        <XAxis dataKey="category" stroke="rgba(148,163,184,0.7)" fontSize={11} />
                        <YAxis stroke="rgba(148,163,184,0.7)" fontSize={11} unit="%" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            color: '#f8fafc',
                          }}
                        />
                        <Bar dataKey="utilizationRate" fill="#10b981" radius={[4, 4, 0, 0]} name="Utilization Rate (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Maintenance costs breakdown */}
            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Maintenance Cost Breakdown by Category</h3>
                  <p className="text-xs text-slate-500 mt-1">Sum of repair fees incurred per asset classification.</p>
                </div>
                <div className="h-72">
                  {maintenanceData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-450 text-xs italic">
                      No maintenance costs incurred yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={maintenanceData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203,213,225,0.2)" />
                        <XAxis dataKey="category" stroke="rgba(148,163,184,0.7)" fontSize={11} />
                        <YAxis stroke="rgba(148,163,184,0.7)" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            color: '#f8fafc',
                          }}
                        />
                        <Bar dataKey="totalCost" fill="#ef4444" radius={[4, 4, 0, 0]} name="Cost (₹)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Idle Inventory list */}
            {activeTab === 'idle' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Idle Corporate Inventory</h3>
                  <p className="text-xs text-slate-500 mt-1">Available assets that have not been checked out or reserved.</p>
                </div>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/40">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Asset</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Tag / Code</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Purchase Cost (₹)</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Purchase Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-650 dark:text-slate-350">
                      {idleAssets.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-405">No idle inventory found. All items checked out!</td>
                        </tr>
                      ) : (
                        idleAssets.map((asset: any) => (
                          <tr key={asset._id}>
                            <td className="px-4 py-3 font-semibold text-slate-900">{asset.name}</td>
                            <td className="px-4 py-3 font-mono font-bold">{asset.tag}</td>
                            <td className="px-4 py-3 font-mono">₹{asset.purchaseCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3">{new Date(asset.purchaseDate).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4: Popular resources */}
            {activeTab === 'popular' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Highest Utilization Assets</h3>
                  <p className="text-xs text-slate-500 mt-1">Assets with the highest booking or checkout counts.</p>
                </div>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/40">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Asset</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Tag / Code</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Category</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Total Allocations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-650 dark:text-slate-350">
                      {popularAssets.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-405">No transaction allocation data available.</td>
                        </tr>
                      ) : (
                        popularAssets.map((asset: any) => (
                          <tr key={asset._id}>
                            <td className="px-4 py-3 font-semibold text-slate-900">{asset.name}</td>
                            <td className="px-4 py-3 font-mono font-bold">{asset.tag}</td>
                            <td className="px-4 py-3">{asset.categoryId?.name || 'Category'}</td>
                            <td className="px-4 py-3 font-semibold text-indigo-600">{asset.allocationCount || 0}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
export default Reports;
