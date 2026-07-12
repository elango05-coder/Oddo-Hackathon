import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService } from '../services/assetService';
import { categoryService } from '../services/categoryService';
import { allocationService } from '../services/allocationService';
import { authService } from '../services/authService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { Asset, AssetCategory, User } from '../types';
import { Plus, Download, Search, Eye, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, Loader2, Laptop } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Assets: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Checkout modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assigneeId, setAssigneeId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [conditionOnAllocation, setConditionOnAllocation] = useState('New / Good');
  const [checkingOut, setCheckingOut] = useState(false);

  // Return modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [conditionOnReturn, setConditionOnReturn] = useState('Good');
  const [returning, setReturning] = useState(false);

  // Fetch filtered assets
  const { data: assetsData, isLoading, error } = useQuery({
    queryKey: ['assetsList', q, categoryId, status, page, sortBy, sortOrder],
    queryFn: () =>
      assetService.search({
        page,
        limit,
        categoryId: categoryId || undefined,
        status: status || undefined,
        q: q || undefined,
        sortBy,
        sortOrder,
      }),
  });

  // Fetch categories
  const { data: catRes } = useQuery({
    queryKey: ['categoriesList'],
    queryFn: () => categoryService.getAll(),
  });
  const categories: AssetCategory[] = catRes?.data || [];

  // Fetch employees
  const { data: employeesRes } = useQuery({
    queryKey: ['usersList'],
    queryFn: () => authService.getUsers(),
  });
  const employees: User[] = employeesRes?.data || [];

  const items: Asset[] = assetsData?.data || [];
  const meta = assetsData?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleOpenCheckout = (asset: Asset) => {
    setSelectedAsset(asset);
    setAssigneeId('');
    setExpectedReturnDate('');
    setConditionOnAllocation('Good');
    setCheckoutModalOpen(true);
  };

  const checkoutMutation = useMutation({
    mutationFn: (payload: any) => allocationService.checkout(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Asset allocated successfully!');
      setCheckoutModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to allocate asset.');
    },
  });

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setCheckingOut(true);

    checkoutMutation.mutate(
      {
        assetId: selectedAsset._id,
        assigneeId,
        expectedReturnDate,
        conditionOnAllocation,
      },
      { onSettled: () => setCheckingOut(false) }
    );
  };

  const handleOpenReturn = (asset: Asset) => {
    setSelectedAsset(asset);
    setConditionOnReturn('Good');
    setReturnModalOpen(true);
  };

  const returnMutation = useMutation({
    mutationFn: (payload: any) => allocationService.returnAsset(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Asset return recorded successfully.');
      setReturnModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to return asset.');
    },
  });

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setReturning(true);

    returnMutation.mutate(
      {
        assetId: selectedAsset._id,
        conditionOnReturn,
      },
      { onSettled: () => setReturning(false) }
    );
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Asset record deleted.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete asset.');
    },
  });

  const exportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(items, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `assetflow_inventory_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Enterprise Asset Directory</h2>
          <p className="text-xs text-slate-500">Search, checkout, return, and manage corporate resources.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4.5 w-4.5" />
            Export Data
          </button>
          <Link
            to="/assets/register"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors"
          >
            <Plus className="h-4.5 w-4.5" />
            Register Asset
          </Link>
        </div>
      </div>

      {/* FILTER SEARCH GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl mb-6 shadow-sm">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="Search name, tag, serial..."
          />
        </div>

        {/* Category */}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="block w-full px-3 py-1.5 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="block w-full px-3 py-1.5 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Allocated">Allocated</option>
          <option value="UnderMaintenance">Under Maintenance</option>
          <option value="Lost">Lost</option>
        </select>
      </div>

      {/* TABLE DIRECTORY */}
      {isLoading ? (
        <div className="flex h-44 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 bg-white border rounded-2xl">
          Failed to fetch asset directory. Ensure backend is running.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Asset</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tag / Code</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 cursor-pointer" onClick={() => handleSort('purchaseCost')}>
                    <div className="flex items-center gap-1">
                      Purchase Cost ($)
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">
                      No assets found matching filters.
                    </td>
                  </tr>
                ) : (
                  items.map((asset) => {
                    const categoryName = typeof asset.categoryId === 'object' ? asset.categoryId.name : '';
                    return (
                      <tr key={asset._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {asset.imageUrl ? (
                              <img src={asset.imageUrl} className="h-9 w-9 rounded-lg object-cover bg-slate-50" alt="" />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Laptop className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{asset.name}</div>
                              <div className="text-xs text-slate-500">{asset.serialNumber || 'No Serial'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <span className="font-mono text-xs font-bold tracking-wider">{asset.tag}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{categoryName}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                          ${asset.purchaseCost.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1.5">
                          <Link
                            to={`/assets/${asset._id}`}
                            className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg inline-flex"
                            title="View Asset Details"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </Link>
                          {asset.status === 'Available' && (
                            <button
                              onClick={() => handleOpenCheckout(asset)}
                              className="text-xs bg-indigo-650 hover:bg-indigo-700 text-white font-semibold px-2.5 py-1 rounded-lg"
                            >
                              Checkout
                            </button>
                          )}
                          {asset.status === 'Allocated' && (
                            <button
                              onClick={() => handleOpenReturn(asset)}
                              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-lg"
                            >
                              Return
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this asset?')) {
                                deleteMutation.mutate(asset._id);
                              }
                            }}
                            className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg inline-flex"
                            title="Delete Asset"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500">
                Page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong> ({meta.total} assets)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1 border border-slate-200 dark:border-slate-800 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page === meta.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1 border border-slate-200 dark:border-slate-800 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHECKOUT ALLOCATION MODAL */}
      {checkoutModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-lg">Checkout Asset: {selectedAsset.name}</h3>
            <p className="text-xs text-slate-500 mt-1">Allocate this available asset to an active employee.</p>

            <form onSubmit={handleCheckoutSubmit} className="mt-4 space-y-4">
              {/* Assignee */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee Employee</label>
                <select
                  required
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Return Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected Return Date</label>
                <input
                  type="date"
                  required
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                />
              </div>

              {/* Handover condition */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Handover Condition</label>
                <input
                  type="text"
                  required
                  value={conditionOnAllocation}
                  onChange={(e) => setConditionOnAllocation(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                  placeholder="Brand new in box"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkingOut}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
                >
                  {checkingOut && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN ASSET MODAL */}
      {returnModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-lg">Return Asset: {selectedAsset.name}</h3>
            <p className="text-xs text-slate-500 mt-1">Confirm that this asset is returned to organizational inventory.</p>

            <form onSubmit={handleReturnSubmit} className="mt-4 space-y-4">
              {/* Return Condition */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Return Condition Details</label>
                <input
                  type="text"
                  required
                  value={conditionOnReturn}
                  onChange={(e) => setConditionOnReturn(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                  placeholder="Excellent, no damage"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returning}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
                >
                  {returning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default Assets;
