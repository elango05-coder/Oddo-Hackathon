import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { allocationService } from '../services/allocationService';
import { authService } from '../services/authService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { TransferRequest, User } from '../types';
import { Plus, Check, X, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Transfers: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [assetId, setAssetId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch pending transfers
  const { data: pendingRes, isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingTransfersList'],
    queryFn: () => allocationService.getPendingTransfers(),
  });

  // Fetch active allocations (to select what to transfer)
  const { data: activeRes } = useQuery({
    queryKey: ['activeAllocationsList'],
    queryFn: () => allocationService.getActive(),
  });

  // Fetch employees list
  const { data: usersRes } = useQuery({
    queryKey: ['usersList'],
    queryFn: () => authService.getUsers(),
  });

  const pendingRequests: TransferRequest[] = pendingRes?.data || [];
  const activeAllocations: any[] = activeRes?.data || [];
  const employees: User[] = usersRes?.data || [];

  const handleOpenRequest = () => {
    setAssetId('');
    setToUserId('');
    setReason('');
    setModalOpen(true);
  };

  const requestMutation = useMutation({
    mutationFn: (payload: any) => allocationService.requestTransfer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingTransfersList'] });
      toast.success('Transfer request submitted successfully!');
      setModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit transfer request.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => allocationService.approveTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingTransfersList'] });
      queryClient.invalidateQueries({ queryKey: ['activeAllocationsList'] });
      queryClient.invalidateQueries({ queryKey: ['assetsList'] });
      toast.success('Transfer request approved. Asset holder updated.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve transfer.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => allocationService.rejectTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingTransfersList'] });
      toast.success('Transfer request rejected.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reject transfer.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    requestMutation.mutate(
      {
        assetId,
        toUserId,
        reason,
      },
      { onSettled: () => setSubmitting(false) }
    );
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Asset Transfers</h2>
          <p className="text-xs text-slate-500">Coordinate custody transfers and asset relocations.</p>
        </div>
        <button
          onClick={handleOpenRequest}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors"
        >
          <Plus className="h-4 w-4" />
          Request Transfer
        </button>
      </div>

      {pendingLoading ? (
        <div className="flex h-44 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/40">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Asset Details</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Source Holder</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Target Recipient</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Reason</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    No pending transfer requests found.
                  </td>
                </tr>
              ) : (
                pendingRequests.map((req) => {
                  const assetName = typeof req.assetId === 'object' ? req.assetId.name : 'Unknown';
                  const assetTag = typeof req.assetId === 'object' ? req.assetId.tag : '';
                  const fromName = typeof req.fromUserId === 'object' ? req.fromUserId.name : 'Deleted';
                  const toName = typeof req.toUserId === 'object' ? req.toUserId.name : 'Deleted';

                  return (
                    <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{assetName}</div>
                        <div className="text-xs text-slate-500 font-mono">{assetTag}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-650 dark:text-slate-350">
                        {fromName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-650 dark:text-slate-350">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{toName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs truncate max-w-[200px]">
                        {req.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            if (window.confirm('Approve asset transfer? This will immediately re-assign asset ownership.')) {
                              approveMutation.mutate(req._id);
                            }
                          }}
                          className="text-green-600 hover:text-green-950 p-1.5 hover:bg-green-50 rounded-lg inline-flex"
                          title="Approve Transfer"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Reject transfer request?')) {
                              rejectMutation.mutate(req._id);
                            }
                          }}
                          className="text-red-650 hover:text-red-950 p-1.5 hover:bg-red-50 rounded-lg inline-flex"
                          title="Reject Transfer"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* REQUEST TRANSFER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Request Asset Transfer</h3>
            <p className="text-xs text-slate-500 mt-1">Initiate custody transfer of an allocated asset to a peer.</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Asset list */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Your Asset</label>
                <select
                  required
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">Select Asset</option>
                  {activeAllocations.map((alloc) => {
                    const assetObj = typeof alloc.assetId === 'object' ? alloc.assetId : null;
                    if (!assetObj) return null;
                    return (
                      <option key={assetObj._id} value={assetObj._id}>
                        {assetObj.name} ({assetObj.tag})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipient Employee</label>
                <select
                  required
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">Select Recipient</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason for Transfer</label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none h-20 resize-none"
                  placeholder="Relocating to visual department, peer needs display access..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default Transfers;
