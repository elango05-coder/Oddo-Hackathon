import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { assetService } from '../services/assetService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, ShieldCheck, Wrench, FileText, History, Printer, Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';

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

  const downloadQRCode = () => {
    const svg = document.querySelector('#qr-code-print svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `qrcode_${asset.tag}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success('QR Code SVG downloaded successfully.');
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
                  <p className="text-slate-500">Purchase Cost: <strong className="text-slate-800 dark:text-slate-200 font-mono">₹{asset.purchaseCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
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

        {/* Tab 4: QR Code render & Print Asset Card */}
        {activeTab === 'qr' && (
          <div className="py-2">
            {/* The actual printable corporate asset badge (hidden on screen, visible only when printing!) */}
            <div className="hidden print:block fixed inset-0 bg-white z-[999] flex items-center justify-center p-8">
              <div className="w-[3.5in] h-[2.2in] border-2 border-slate-950 rounded-2xl p-4 flex flex-col justify-between bg-white text-black font-sans shadow-sm">
                <div className="flex justify-between items-start border-b-2 border-slate-950 pb-1.5 mb-2">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight uppercase">Corporate Property Badge</h3>
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5 font-sans">AssetFlow ERP Registry</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold">{asset.tag}</span>
                </div>
                <div className="flex gap-4 flex-1 items-center">
                  <div className="flex-1 space-y-1 text-[10px] font-sans">
                    <p><strong className="text-slate-500 uppercase text-[8px] tracking-wide block font-sans">Name</strong> {asset.name}</p>
                    <p><strong className="text-slate-500 uppercase text-[8px] tracking-wide block font-sans">Category</strong> {category?.name || 'N/A'}</p>
                    <p><strong className="text-slate-500 uppercase text-[8px] tracking-wide block font-sans">Department</strong> {department?.name || 'Stock'}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <QRCodeSVG value={asset.tag} size={65} level="H" />
                    <span className="text-[8px] font-mono font-bold uppercase">Scan to Verify</span>
                  </div>
                </div>
                <div className="border-t-2 border-slate-950 pt-1.5 mt-2 flex justify-between items-center text-[7px] text-slate-500 uppercase font-semibold font-sans">
                  <span>Registered: {new Date(asset.purchaseDate).toLocaleDateString()}</span>
                  <span>If found, return to IT Helpdesk</span>
                </div>
              </div>
            </div>

            {/* Screen layout mockup */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-12 py-6 print:hidden">
              {/* Left Column: QR Code Box */}
              <div className="bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center shadow-md dark:shadow-none" id="qr-code-print">
                <QRCodeSVG value={asset.tag} size={150} level="H" />
                <span className="font-mono font-bold mt-4 tracking-widest text-slate-900 dark:text-slate-100">{asset.tag}</span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">AssetFlow System Barcode</span>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={downloadQRCode}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    SVG Tag
                  </button>
                  <button
                    onClick={handlePrintQR}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    <Printer className="h-3 w-3" />
                    Print Label
                  </button>
                </div>
              </div>

              {/* Right Column: Premium Asset Badge Card Mockup */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-450 dark:text-slate-400">Corporate Property Asset Card</h4>
                <div className="w-[3.5in] h-[2.2in] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between bg-gradient-to-br from-white to-slate-550/20 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-white shadow-lg relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 h-24 w-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wide">Corporate Property</h3>
                      <p className="text-[8px] text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-bold mt-0.5">Asset Registry Badge</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-wider">{asset.tag}</span>
                  </div>
                  <div className="flex gap-4 flex-1 items-center">
                    <div className="flex-1 space-y-1.5 text-[9px] min-w-0">
                      <p className="truncate"><span className="text-slate-400 uppercase text-[7px] tracking-wide block">Name</span> <strong className="text-slate-850 dark:text-slate-200">{asset.name}</strong></p>
                      <p className="truncate"><span className="text-slate-400 uppercase text-[7px] tracking-wide block">Category</span> <strong className="text-slate-850 dark:text-slate-200">{category?.name || 'N/A'}</strong></p>
                      <p className="truncate"><span className="text-slate-400 uppercase text-[7px] tracking-wide block">Department</span> <strong className="text-slate-850 dark:text-slate-200">{department?.name || 'Stock'}</strong></p>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-center gap-1.5 p-1 bg-white rounded-lg border border-slate-200">
                      <QRCodeSVG value={asset.tag} size={60} level="H" />
                      <span className="text-[7px] font-mono text-slate-500 font-bold uppercase tracking-wider">Property QR</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2 mt-2 flex justify-between items-center text-[7px] text-slate-400 uppercase font-semibold">
                    <span>Registered: {new Date(asset.purchaseDate).toLocaleDateString()}</span>
                    <span>IT Department Property</span>
                  </div>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 border border-indigo-200 dark:border-indigo-800/40 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-550/20 rounded-xl text-xs font-bold transition-all cursor-pointer w-full justify-center"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Physical ID Badge Card
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};
export default AssetDetails;
