import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { departmentService } from '../services/departmentService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { User, Department } from '../types';
import { Shield, ShieldAlert, ArrowUpCircle, CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Employees: React.FC = () => {
  const queryClient = useQueryClient();
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for promotion
  const [roleName, setRoleName] = useState('Employee');
  const [departmentId, setDepartmentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch users list
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['usersList'],
    queryFn: () => authService.getUsers(),
  });

  // Fetch departments list
  const { data: deptsData } = useQuery({
    queryKey: ['departmentsHierarchy'],
    queryFn: () => departmentService.getHierarchy(),
  });

  const employees: User[] = usersData?.data || [];
  const departments: Department[] = deptsData?.data || [];

  const handleOpenPromote = (user: User) => {
    setSelectedUser(user);
    const currentRole = typeof user.roleId === 'object' ? user.roleId.name : 'Employee';
    setRoleName(currentRole);
    setDepartmentId(typeof user.departmentId === 'object' ? user.departmentId?._id || '' : user.departmentId || '');
    setPromoteModalOpen(true);
  };

  const promoteMutation = useMutation({
    mutationFn: (payload: any) => authService.promoteUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      queryClient.invalidateQueries({ queryKey: ['departmentsHierarchy'] });
      toast.success('User role and department configurations updated!');
      setPromoteModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update employee role.');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => authService.deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      toast.success('Employee account deactivated.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to deactivate account.');
    },
  });

  const handlePromoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);

    promoteMutation.mutate(
      {
        email: selectedUser.email,
        roleName,
        departmentId: departmentId || null,
      },
      { onSettled: () => setSubmitting(false) }
    );
  };

  // Filtered employees list
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Enterprise Employees</h2>
          <p className="text-xs text-slate-500">Configure roles, permissions, and active corporate listings.</p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
            placeholder="Search employee..."
          />
        </div>
      </div>

      {usersLoading ? (
        <div className="flex h-44 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/40">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name & Email</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">System Role</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Department</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">
                    No matching employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const role = typeof emp.roleId === 'object' ? emp.roleId.name : 'Employee';
                  const deptName = typeof emp.departmentId === 'object' ? emp.departmentId?.name : 'Not Assigned';
                  return (
                    <tr key={emp._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-sm text-slate-600 dark:text-slate-300">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{emp.name}</div>
                            <div className="text-xs text-slate-500">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 capitalize">
                          <Shield className="h-3 w-3" />
                          {role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{deptName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {emp.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-450">
                            <XCircle className="h-3.5 w-3.5" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleOpenPromote(emp)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                          title="Configure Role / Department"
                        >
                          <ArrowUpCircle className="h-4.5 w-4.5" />
                        </button>
                        {emp.isActive && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to deactivate ${emp.name}'s account?`)) {
                                deactivateMutation.mutate(emp._id);
                              }
                            }}
                            className="text-red-650 hover:text-red-900 dark:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                            title="Deactivate Account"
                          >
                            <ShieldAlert className="h-4.5 w-4.5" />
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

      {/* PROMOTION / ASSIGN MODAL */}
      {promoteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150 p-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Configure employee: {selectedUser.name}</h3>
            <p className="text-xs text-slate-500 mt-1">Configure role promotions and department bindings.</p>

            <form onSubmit={handlePromoteSubmit} className="mt-4 space-y-4">
              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Enterprise System Role</label>
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="Employee">Employee</option>
                  <option value="Department Head">Department Head</option>
                  <option value="Asset Manager">Asset Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Department assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Department Assignment</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">None (Unassigned)</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setPromoteModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Configurations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default Employees;
