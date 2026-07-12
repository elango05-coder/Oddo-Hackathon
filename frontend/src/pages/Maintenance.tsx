import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceService } from '../services/maintenanceService';
import { assetService } from '../services/assetService';
import { authService } from '../services/authService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { Asset, User } from '../types';
import { Plus, Play, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Maintenance: React.FC = () => {
  const queryClient = useQueryClient();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // Raise Request States
  const [assetId, setAssetId] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Approve Ticket States
  const [assignedTechnicianId, setAssignedTechnicianId] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [approving, setApproving] = useState(false);

  // Resolve Ticket States
  const [actualCost, setActualCost] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [resolving, setResolving] = useState(false);

  // Fetch pending tickets
  const { data: pendingRes, isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingMaintenanceList'],
    queryFn: () => maintenanceService.getPending(),
  });

  // Fetch all assets (to choose which asset needs repair)
  const { data: assetsRes } = useQuery({
    queryKey: ['allAssetsList'],
    queryFn: () => assetService.search({ limit: 100 }),
  });

  // Fetch technicians (employees list)
  const { data: usersRes } = useQuery({
    queryKey: ['usersList'],
    queryFn: () => authService.getUsers(),
  });

  const pendingRequests = pendingRes?.data || [];
  const assets: Asset[] = assetsRes?.data || [];
  const technicians: User[] = usersRes?.data || [];

  const handleOpenRequest = () => {
    setAssetId('');
    setDescription('');
    setPriority('Medium');
    setImageFile(null);
    setRequestModalOpen(true);
  };

  const handleOpenApprove = (ticket: any) => {
    setSelectedTicket(ticket);
    setAssignedTechnicianId('');
    setEstimatedCost(0);
    setApproveModalOpen(true);
  };

  const handleOpenResolve = (ticket: any) => {
    setSelectedTicket(ticket);
    setActualCost(0);
    setRemarks('');
    setResolveModalOpen(true);
  };

  const requestMutation = useMutation({
    mutationFn: (formData: FormData) => maintenanceService.request(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingMaintenanceList'] });
      toast.success('Maintenance ticket raised successfully!');
      setRequestModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit maintenance request.');
    },
  });

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('assetId', assetId);
    formData.append('description', description);
    formData.append('priority', priority);
    if (imageFile) {
      formData.append('images', imageFile);
    }

    requestMutation.mutate(formData, { onSettled: () => setSubmitting(false) });
  };

  const approveMutation = useMutation({
    mutationFn: (payload: { id: string; data: any }) => maintenanceService.approve(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingMaintenanceList'] });
      queryClient.invalidateQueries({ queryKey: ['assetsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Maintenance request approved and technician assigned.');
      setApproveModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve request.');
    },
  });

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setApproving(true);

    approveMutation.mutate(
      {
        id: selectedTicket._id,
        data: {
          assignedTechnicianId,
          estimatedCost,
          priority: selectedTicket.priority,
        },
      },
      { onSettled: () => setApproving(false) }
    );
  };

  const resolveMutation = useMutation({
    mutationFn: (payload: { id: string; data: any }) => maintenanceService.resolve(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingMaintenanceList'] });
      queryClient.invalidateQueries({ queryKey: ['assetsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Maintenance ticket marked resolved.');
      setResolveModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to resolve request.');
    },
  });

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setResolving(true);

    resolveMutation.mutate(
      {
        id: selectedTicket._id,
        data: {
          actualCost,
          remarks,
        },
      },
      { onSettled: () => setResolving(false) }
    );
  };

  const startWorkMutation = useMutation({
    mutationFn: (id: string) => maintenanceService.startWork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingMaintenanceList'] });
      toast.success('Repair work marked in progress!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to start maintenance work.');
    },
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Maintenance Manager</h2>
          <p className="text-xs text-slate-500">Coordinate repairs, service requests, and hardware logs.</p>
        </div>
        <button
          onClick={handleOpenRequest}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors"
        >
          <Plus className="h-4 w-4" />
          Request Repair
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
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Asset</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Reported By</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    No pending approval tickets found.
                  </td>
                </tr>
              ) : (
                pendingRequests.map((ticket: any) => {
                  const assetName = ticket.assetId?.name || 'Deleted Asset';
                  const assetTag = ticket.assetId?.tag || '';
                  const reporterName = ticket.reportedById?.name || 'Deleted User';

                  return (
                    <tr key={ticket._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{assetName}</div>
                        <div className="text-xs text-slate-500 font-mono">{assetTag}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs max-w-[200px] truncate">
                        {ticket.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                          ticket.priority === 'Critical' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-650 dark:text-slate-350">
                        {reporterName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {ticket.status === 'PendingApproval' && (
                          <button
                            onClick={() => handleOpenApprove(ticket)}
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg"
                          >
                            Approve
                          </button>
                        )}
                        {ticket.status === 'Approved' && (
                          <button
                            onClick={() => {
                              if (window.confirm('Commence repair work on this asset?')) {
                                startWorkMutation.mutate(ticket._id);
                              }
                            }}
                            className="text-slate-500 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg inline-flex"
                            title="Start Work"
                          >
                            <Play className="h-4.5 w-4.5" />
                          </button>
                        )}
                        {ticket.status === 'InProgress' && (
                          <button
                            onClick={() => handleOpenResolve(ticket)}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* REQUEST MAINTENANCE TICKET MODAL */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Request Asset Repair</h3>
            <p className="text-xs text-slate-500 mt-1">Raise a maintenance ticket for equipment issues.</p>

            <form onSubmit={handleRequestSubmit} className="mt-4 space-y-4">
              {/* Asset list */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Affected Asset</label>
                <select
                  required
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">Select Asset</option>
                  {assets.map((asset) => (
                    <option key={asset._id} value={asset._id}>
                      {asset.name} ({asset.tag}) - {asset.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 rounded-xl text-sm focus:outline-none h-20 resize-none"
                  placeholder="Describe the display issues, physical damage, software crashes..."
                />
              </div>

              {/* Upload image */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Attach Photos (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="mt-1.5 block w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
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

      {/* APPROVE TICKET MODAL */}
      {approveModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Approve Ticket & Assign Repair</h3>
            <p className="text-xs text-slate-500 mt-1">Assign a technician and record cost parameters.</p>

            <form onSubmit={handleApproveSubmit} className="mt-4 space-y-4">
              {/* Technician */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Technician</label>
                <select
                  required
                  value={assignedTechnicianId}
                  onChange={(e) => setAssignedTechnicianId(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">Select Technician</option>
                  {technicians.map((tech) => (
                    <option key={tech._id} value={tech._id}>
                      {tech.name} ({tech.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cost */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Repair Cost ($)</label>
                <input
                  type="number"
                  required
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setApproveModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
                >
                  {approving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Assign Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE TICKET MODAL */}
      {resolveModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Record Repair Resolution</h3>
            <p className="text-xs text-slate-500 mt-1">Conclude repairs and restore asset availability.</p>

            <form onSubmit={handleResolveSubmit} className="mt-4 space-y-4">
              {/* Actual Cost */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Actual Cost ($)</label>
                <input
                  type="number"
                  required
                  value={actualCost}
                  onChange={(e) => setActualCost(Number(e.target.value))}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 rounded-xl text-sm focus:outline-none"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolution Remarks</label>
                <textarea
                  required
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 rounded-xl text-sm focus:outline-none h-20 resize-none"
                  placeholder="Replaced displaying flex cables, screen functions cleanly..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
                >
                  {resolving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Complete Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default Maintenance;
