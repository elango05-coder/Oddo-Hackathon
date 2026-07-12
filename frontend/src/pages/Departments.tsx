import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '../services/departmentService';
import { authService } from '../services/authService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { Department, User } from '../types';
import { Plus, Edit2, ShieldAlert, Folder, Shield, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Departments: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [parentId, setParentId] = useState('');
  const [headId, setHeadId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch departments hierarchy
  const { data: deptData, isLoading: deptsLoading } = useQuery({
    queryKey: ['departmentsHierarchy'],
    queryFn: () => departmentService.getHierarchy(),
  });

  // Fetch employees list to assign as head of department
  const { data: usersData } = useQuery({
    queryKey: ['usersList'],
    queryFn: () => authService.getUsers(),
  });

  const departments: Department[] = deptData?.data || [];
  const employees: User[] = usersData?.data || [];

  const handleOpenCreate = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setParentId('');
    setHeadId('');
    setModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setParentId(typeof dept.parentId === 'object' ? dept.parentId?._id || '' : dept.parentId || '');
    setHeadId(typeof dept.headId === 'object' ? dept.headId?._id || '' : dept.headId || '');
    setModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => departmentService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departmentsHierarchy'] });
      toast.success('Department created successfully!');
      setModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create department.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: any }) => departmentService.update(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departmentsHierarchy'] });
      toast.success('Department details updated.');
      setModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update department.');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => departmentService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departmentsHierarchy'] });
      toast.success('Department deactivated.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to deactivate department.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name,
      parentId: parentId || null,
      headId: headId || null,
    };

    if (editingDept) {
      updateMutation.mutate(
        { id: editingDept._id, data: payload },
        { onSettled: () => setSubmitting(false) }
      );
    } else {
      createMutation.mutate(
        { ...payload, code: code.toUpperCase() },
        { onSettled: () => setSubmitting(false) }
      );
    }
  };

  // Render tree lists helper
  const renderDeptRow = (dept: Department, level = 0) => {
    const headName = typeof dept.headId === 'object' ? dept.headId?.name : 'Not Assigned';
    return (
      <React.Fragment key={dept._id}>
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
              {level > 0 && <ArrowRight className="h-3.5 w-3.5 text-slate-400" />}
              <Folder className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-slate-900 dark:text-slate-100 font-semibold">{dept.name}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold tracking-wider text-slate-700 dark:text-slate-300">
              {dept.code}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
            {headName !== 'Not Assigned' ? (
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-indigo-600" />
                <span className="font-medium text-slate-800 dark:text-slate-200">{headName}</span>
              </div>
            ) : (
              <span className="text-slate-450 italic">None</span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
            <button
              onClick={() => handleOpenEdit(dept)}
              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
              title="Edit Department"
            >
              <Edit2 className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to deactivate this department?')) {
                  deactivateMutation.mutate(dept._id);
                }
              }}
              className="text-red-600 hover:text-red-900 dark:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
              title="Deactivate Department"
            >
              <ShieldAlert className="h-4.5 w-4.5" />
            </button>
          </td>
        </tr>
        {/* Render child elements if they exist recursively */}
        {/* Note: the hierarchy endpoint returns flattening or structured tree nodes, we list all matching parent tree nodes here */}
        {departments
          .filter((child) => {
            const childParentId = typeof child.parentId === 'object' ? child.parentId?._id : child.parentId;
            return childParentId === dept._id;
          })
          .map((child) => renderDeptRow(child, level + 1))}
      </React.Fragment>
    );
  };

  // Find root departments (those without parents)
  const rootDepts = departments.filter((d) => !d.parentId);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Enterprise Departments</h2>
          <p className="text-xs text-slate-500">Configure corporate hierarchies and department head mappings.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Department
        </button>
      </div>

      {deptsLoading ? (
        <div className="flex h-44 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/40">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Department Name</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Code</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Manager / Head</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {rootDepts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                    No departments created. Click "Add Department" to start.
                  </td>
                </tr>
              ) : (
                rootDepts.map((root) => renderDeptRow(root, 0))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150 p-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {editingDept ? 'Edit Department' : 'Create Department'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Specify parameters for corporate departments.</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Department Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Engineering"
                />
              </div>

              {/* Code (Only editable on create) */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Department Code</label>
                <input
                  type="text"
                  required
                  disabled={!!editingDept}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 disabled:bg-slate-100"
                  placeholder="ENG"
                />
              </div>

              {/* Parent department */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Parent Department (Optional)</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">None (Top Level)</option>
                  {departments
                    .filter((d) => !editingDept || d._id !== editingDept._id)
                    .map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                </select>
              </div>

              {/* Head of department */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Head of Department (Manager)</label>
                <select
                  value={headId}
                  onChange={(e) => setHeadId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                  {editingDept ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default Departments;
