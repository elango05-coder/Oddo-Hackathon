import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { assetService } from '../services/assetService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, ShieldCheck, Wrench, FileText, History, Printer, Loader2 } from 'lucide-react';

export const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'specs' | 'history' | 'maintenance' | 'qr'>('specs');

  // Fetch asset details
  const { data: assetRes, isLoading: detailsLoading } = useQuery({
    queryKey: ['assetDetails', id],
    queryFn: () => assetService.getById(id!),
    enabled: !!id,
  });

  // Fetch asset allocation and maintenance history
  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ['assetHistory', id],
    queryFn: () => assetService.getHistory(id!),
    enabled: !!id,
  });

  const asset = assetRes?.data;
  const history = historyRes?.data || { allocations: [], maintenance: [] };

  if (detailsLoading || historyLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-44 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!asset) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 p-4 border rounded-xl text-red-700">Asset record not found.</div>
      </DashboardLayout>
    );
  }

  const category = typeof asset.categoryId === 'object' ? asset.categoryId : null;
  const department = typeof asset.departmentId === 'object' ? asset.departmentId : null;
  const holder = typeof asset.currentHolderId === 'object' ? asset.currentHolderId : null;

  const handlePrintQR = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <Link
            to="/assets"
            className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{asset.name}</h2>
            <p className="text-xs text-slate-500">Asset Tag: <span className="font-mono font-bold">{asset.tag}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              asset.status === 'Available'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : asset.status === 'Allocated'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : asset.status === 'UnderMaintenance'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {asset.status}
          </span>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 print:hidden">
        {(
          [
            { id: 'specs', label: 'Specifications', icon: FileText },
            { id: 'history', label: 'Allocations History', icon: History },
            { id: 'maintenance', label: 'Maintenance Log', icon: Wrench },
            { id: 'qr', label: 'Print QR Tag', icon: Printer },
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

      {/* TAB CONTENT PANELS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        
        {/* Tab 1: specifications */}
        {activeTab === 'specs' && (
          <div className="space-y-6">
            {/* Upper Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {asset.imageUrl && (
                <div className="border border-slate-100 rounded-xl overflow-hidden max-h-48 flex items-center justify-center bg-slate-50">
                  <img src={asset.imageUrl} className="max-h-full object-contain" alt="" />
                </div>
              )}
              <div className="space-y-3.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Inventory Params</h4>
                <div className="text-xs space-y-1.5">
                  <p className="text-slate-500">Category: <strong className="text-slate-800 dark:text-slate-200">{category?.name || 'Uncategorized'}</strong></p>
                  <p className="text-slate-500">Department: <strong className="text-slate-800 dark:text-slate-200">{department?.name || 'Stock'}</strong></p>
                  <p className="text-slate-500">Serial Number: <strong className="text-slate-800 dark:text-slate-200 font-mono">{asset.serialNumber || 'N/A'}</strong></p>
                </div>
              </div>
              <div className="space-y-3.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Financial Params</h4>
                <div className="text-xs space-y-1.5">
                  <p className="text-slate-500">Purchase Date: <strong className="text-slate-800 dark:text-slate-200">{new Date(asset.purchaseDate).toLocaleDateString()}</strong></p>
                  <p className="text-slate-500">Purchase Cost: <strong className="text-slate-800 dark:text-slate-200 font-mono">${asset.purchaseCost.toFixed(2)}</strong></p>
                  <p className="text-slate-500">Lifecycle Stage: <strong className="text-slate-800 dark:text-slate-200">{asset.lifecycleStage}</strong></p>
                </div>
              </div>
            </div>

            {/* Current holder details */}
            {holder && (
              <div className="bg-indigo-50/20 border border-indigo-100/50 p-4 rounded-xl flex items-center gap-3.5 text-xs">
                <ShieldCheck className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="text-slate-500">Currently allocated to: <strong className="text-slate-800 dark:text-slate-200">{holder.name}</strong> ({holder.email})</p>
                </div>
              </div>
            )}

            {/* Dynamic Metadata category variables */}
            {category && Object.keys(asset.metadata).length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Custom Specifications Parameters</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.entries(asset.metadata).map(([key, val]) => {
                    const fieldDef = category.fields.find((f: any) => f.name === key);
                    const labelName = fieldDef ? fieldDef.label : key.replace('_', ' ');
                    return (
                      <div key={key} className="bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/40 p-3.5 rounded-xl">
                        <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{labelName}</span>
                        <strong className="text-sm mt-1 block text-slate-800 dark:text-slate-200 capitalize">
                          {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Allocations History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Allocations Register</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/20">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Employee</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Allocated By</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Return Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Checkout Condition</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {history.allocations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No allocations history logs.</td>
                    </tr>
                  ) : (
                    history.allocations.map((alloc: any) => (
                      <tr key={alloc._id}>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">{alloc.assigneeId?.name || 'Deleted'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">{alloc.allocatedById?.name || 'System'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                          {alloc.actualReturnDate ? new Date(alloc.actualReturnDate).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">{alloc.conditionOnAllocation}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            alloc.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {alloc.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Maintenance Logs */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Repair tickets register</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/20">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Description</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Technician</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Cost ($)</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Date Raised</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {history.maintenance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No maintenance tickets recorded.</td>
                    </tr>
                  ) : (
                    history.maintenance.map((ticket: any) => (
                      <tr key={ticket._id}>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{ticket.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">{ticket.assignedTechnicianId?.name || 'Unassigned'}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-500">${ticket.actualCost || ticket.estimatedCost || 0}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ticket.status === 'Resolved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: QR Code render */}
        {activeTab === 'qr' && (
          <div className="flex flex-col items-center justify-center py-10 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col items-center shadow-md print:shadow-none print:border-none" id="qr-code-print">
              <QRCodeSVG value={asset.tag} size={150} level="H" />
              <span className="font-mono font-bold mt-4 tracking-widest text-slate-900">{asset.tag}</span>
              <span className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">AssetFlow System Barcode</span>
            </div>

            <button
              onClick={handlePrintQR}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none print:hidden transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print QR Label
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};
export default AssetDetails;
