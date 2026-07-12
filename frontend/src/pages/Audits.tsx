import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditService } from '../services/auditService';
import { assetService } from '../services/assetService';
import { authService } from '../services/authService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { AuditCycle, User } from '../types';
import { Plus, Play, Power, Lock, BarChart3, ScanLine, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Audits: React.FC = () => {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Form states (Create Cycle)
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignedAuditors, setAssignedAuditors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Auditor Verify States
  const [targetCycleId, setTargetCycleId] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<'Verified' | 'Damaged' | 'Missing'>('Verified');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Report State
  const [reportItems, setReportItems] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Fetch cycles
  const { data: cyclesRes, isLoading: cyclesLoading } = useQuery({
    queryKey: ['auditCyclesList'],
    queryFn: () => auditService.getCycles(),
  });

  // Fetch employees to assign as auditors
  const { data: usersRes } = useQuery({
    queryKey: ['usersList'],
    queryFn: () => authService.getUsers(),
  });

  const cycles: AuditCycle[] = cyclesRes?.data || [];
  const employees: User[] = usersRes?.data || [];

  const handleOpenCreate = () => {
    setName('');
    setStartDate('');
    setEndDate('');
    setAssignedAuditors([]);
    setCreateModalOpen(true);
  };

  const handleOpenVerify = (cycleId: string) => {
    setTargetCycleId(cycleId);
    setAssetTag('');
    setVerifyStatus('Verified');
    setVerifyNotes('');
    setVerifyModalOpen(true);
  };

  const handleOpenReport = async (cycleId: string) => {
    setLoadingReport(true);
    setReportModalOpen(true);
    try {
      const res = await auditService.getDiscrepancyReport(cycleId);
      const reportData = res.data || {};
      const items: any[] = [];
      
      if (reportData.discrepancies?.missing) {
        items.push(...reportData.discrepancies.missing.map((item: any) => ({ ...item, status: 'Missing' })));
      }
      if (reportData.discrepancies?.damaged) {
        items.push(...reportData.discrepancies.damaged.map((item: any) => ({ ...item, status: 'Damaged' })));
      }
      if (reportData.discrepancies?.unverified) {
        reportData.discrepancies.unverified.forEach((asset: any) => {
          items.push({
            _id: `unverified-${asset._id}`,
            assetId: asset,
            expectedHolderId: asset.allocatedTo,
            status: 'Unverified',
            notes: 'Asset not scanned during this cycle.'
          });
        });
      }
      setReportItems(items);
    } catch (e: any) {
      toast.error('Failed to load discrepancy report.');
      setReportModalOpen(false);
    } finally {
      setLoadingReport(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => auditService.createCycle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditCyclesList'] });
      toast.success('Audit Cycle created successfully.');
      setCreateModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create audit cycle.');
    },
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => auditService.startCycle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditCyclesList'] });
      toast.success('Audit Cycle started.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to start audit cycle.');
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => auditService.closeCycle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditCyclesList'] });
      toast.success('Audit Cycle closed.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to close audit cycle.');
    },
  });

  const lockMutation = useMutation({
    mutationFn: (id: string) => auditService.lockCycle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditCyclesList'] });
      toast.success('Audit Cycle locked. All records finalized.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to lock audit cycle.');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (payload: any) => auditService.verifyAsset(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditCyclesList'] });
      toast.success('Asset verification logged successfully.');
      setVerifyModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Verification failed. Please check asset tag.');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assignedAuditors.length === 0) {
      toast.error('Please assign at least one auditor.');
      return;
    }
    setSubmitting(true);
    createMutation.mutate(
      {
        name,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        assignedAuditors,
      },
      { onSettled: () => setSubmitting(false) }
    );
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);

    try {
      // Find asset by tag first to get asset ID
      const searchRes = await assetService.search({ q: assetTag });
      const asset = searchRes.data?.[0];
      if (!asset) {
        toast.error('No asset found matching this tag/serial.');
        setVerifying(false);
        return;
      }

      verifyMutation.mutate({
        cycleId: targetCycleId,
        assetId: asset._id,
        status: verifyStatus,
        notes: verifyNotes,
      });
    } catch (err) {
      toast.error('Failed to locate asset details.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Audit Operations</h2>
          <p className="text-xs text-slate-500">Run audit cycles, verify asset statuses, and reconcile inventory discrepancies.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Cycle
        </button>
      </div>

      {cyclesLoading ? (
        <div className="flex h-44 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cycles.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-400">
              No audit cycles defined. Click "Create Cycle" to start.
            </div>
          ) : (
            cycles.map((cycle) => (
              <div key={cycle._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                      cycle.status === 'InProgress' ? 'bg-indigo-50 text-indigo-700' : cycle.status === 'Scheduled' ? 'bg-slate-100 text-slate-600' : 'bg-red-55/15 text-red-650'
                    }`}>
                      {cycle.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-base mt-3 text-slate-900 dark:text-white">{cycle.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Start: {new Date(cycle.startDate).toLocaleDateString()} | End: {new Date(cycle.endDate).toLocaleDateString()}</p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 mt-4 pt-4 flex flex-wrap gap-2">
                  {cycle.status === 'Scheduled' && (
                    <button
                      onClick={() => startMutation.mutate(cycle._id)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-indigo-55/10 text-indigo-600 hover:bg-indigo-50 text-xs font-semibold rounded-lg"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Start
                    </button>
                  )}
                  {cycle.status === 'InProgress' && (
                    <>
                      <button
                        onClick={() => handleOpenVerify(cycle._id)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-green-55/10 text-green-600 hover:bg-green-50 text-xs font-semibold rounded-lg"
                      >
                        <ScanLine className="h-3.5 w-3.5" />
                        Scan/Verify
                      </button>
                      <button
                        onClick={() => closeMutation.mutate(cycle._id)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-red-55/10 text-red-600 hover:bg-red-55/15 text-xs font-semibold rounded-lg"
                      >
                        <Power className="h-3.5 w-3.5" />
                        Close
                      </button>
                    </>
                  )}
                  {cycle.status === 'Completed' && (
                    <>
                      <button
                        onClick={() => handleOpenReport(cycle._id)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold rounded-lg"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Report
                      </button>
                      <button
                        onClick={() => lockMutation.mutate(cycle._id)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-lg"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Lock
                      </button>
                    </>
                  )}
                  {cycle.status === 'Locked' && (
                    <button
                      onClick={() => handleOpenReport(cycle._id)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      Final Report
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CREATE CYCLE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Create Audit Cycle</h3>
            <p className="text-xs text-slate-500 mt-1">Specify timeline and select assigned auditors.</p>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Cycle Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 rounded-xl text-sm focus:outline-none"
                  placeholder="Q3 Hardware Verification"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Auditors selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Assign Auditors</label>
                <select
                  multiple
                  value={assignedAuditors}
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions, (o) => o.value);
                    setAssignedAuditors(opts);
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 rounded-xl text-sm focus:outline-none h-24"
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1">Hold Ctrl/Cmd key to choose multiple auditors.</span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Register Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCAN / VERIFY ASSET MODAL */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-1.5">
              <ScanLine className="h-5 w-5 text-indigo-600 animate-pulse" />
              Auditor Verification Scan
            </h3>
            <p className="text-xs text-slate-500 mt-1">Enter target barcode / asset tag to record verify status.</p>

            <form onSubmit={handleVerifySubmit} className="mt-4 space-y-4">
              {/* Tag search */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset Barcode / Tag ID</label>
                <input
                  type="text"
                  required
                  value={assetTag}
                  onChange={(e) => setAssetTag(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 rounded-xl text-sm focus:outline-none font-mono"
                  placeholder="AST-2026-0001"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Verify Condition Status</label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value as any)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 rounded-xl text-sm focus:outline-none"
                >
                  <option value="Verified">Verified (Healthy)</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Missing">Missing</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Auditor Notes</label>
                <textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 rounded-xl text-sm focus:outline-none h-16 resize-none"
                  placeholder="Visual casing is slightly worn but screen and CPU function cleanly..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-855 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
                >
                  {verifying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Record Scan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCREPANCY REPORT MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Audit Discrepancy Report</h3>
            <p className="text-xs text-slate-500 mt-1">Summary of missing, damaged, or unverified items in this cycle.</p>

            {loadingReport ? (
              <div className="flex h-44 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/40">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Asset</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Expected Holder</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Audit Status</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {reportItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                            No discrepancies or issues logged. All items successfully verified!
                          </td>
                        </tr>
                      ) : (
                        reportItems.map((item: any) => {
                          const assetName = item.assetId?.name || 'Deleted';
                          const assetTag = item.assetId?.tag || '';
                          const expectedHolderName = item.expectedHolderId?.name || 'In Stock';
                          return (
                            <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">{assetName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{assetTag}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-slate-650 dark:text-slate-350">
                                {expectedHolderName}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                                  item.status === 'Missing'
                                    ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                                    : item.status === 'Damaged'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                                    : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                                {item.notes || '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-850 text-white rounded-xl text-sm font-semibold shadow-md"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default Audits;
