import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/categoryService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { AssetCategory } from '../types';
import { Plus, Trash2, ListFilter, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Categories: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories list
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categoriesList'],
    queryFn: () => categoryService.getAll(),
  });

  const categories: AssetCategory[] = categoriesData?.data || [];

  const handleOpenCreate = () => {
    setName('');
    setCode('');
    setDescription('');
    setFields([]);
    setModalOpen(true);
  };

  const addFieldRow = () => {
    setFields([...fields, { name: '', label: '', type: 'text', required: false }]);
  };

  const removeFieldRow = (index: number) => {
    setFields(fields.filter((_, idx) => idx !== index));
  };

  const handleFieldChange = (index: number, key: string, value: any) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => categoryService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoriesList'] });
      toast.success('Category schema registered successfully!');
      setModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to register category.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoriesList'] });
      toast.success('Category schema deleted.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete category.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate custom fields
    const invalidField = fields.some((f) => !f.name.trim() || !f.label.trim());
    if (invalidField) {
      toast.error('All dynamic metadata attributes must specify a Name and Label.');
      return;
    }

    setSubmitting(true);

    // Format names to lowercase keys
    const formattedFields = fields.map((f) => ({
      ...f,
      name: f.name.toLowerCase().replace(/\s+/g, '_'),
    }));

    createMutation.mutate(
      {
        name,
        code: code.toUpperCase(),
        description,
        fields: formattedFields,
      },
      { onSettled: () => setSubmitting(false) }
    );
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Asset Categories</h2>
          <p className="text-xs text-slate-500">Configure classification categories and dynamic metadata schemas.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Category
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-44 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-sm">
              No categories registered yet. Click "Create Category" to define asset schema templates.
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold tracking-wider text-slate-700 dark:text-slate-300">
                      {cat.code}
                    </span>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this category schema? Assets inside this category may experience metadata rendering constraints.')) {
                          deleteMutation.mutate(cat._id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                  <h3 className="font-bold text-base mt-3 text-slate-900 dark:text-white">{cat.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description || 'No description provided.'}</p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 mt-4 pt-4">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    Dynamic Field Attributes ({cat.fields.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.fields.map((f) => (
                      <span key={f.name} className="px-2 py-0.5 bg-indigo-50/60 dark:bg-indigo-950/20 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 rounded border border-indigo-100/30">
                        {f.label} ({f.type}{f.required ? '*' : ''})
                      </span>
                    ))}
                    {cat.fields.length === 0 && (
                      <span className="text-[10px] text-slate-400 italic">No custom fields defined.</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-150 p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Create Asset Category</h3>
            <p className="text-xs text-slate-500 mt-1">Specify name, code, and map custom attributes fields.</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Category details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Category Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Laptops"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Category Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="LAP"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 h-16 resize-none"
                  placeholder="Enterprise personal laptop allocations"
                />
              </div>

              {/* DYNAMIC FIELD ATTRIBUTES BUILDER */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Dynamic Attributes Fields</h4>
                  <button
                    type="button"
                    onClick={addFieldRow}
                    className="px-2.5 py-1 text-[11px] font-bold bg-indigo-500/10 text-indigo-600 hover:bg-indigo-50 border border-indigo-200/50 rounded-lg transition-colors"
                  >
                    Add Attribute
                  </button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {fields.map((field, index) => (
                    <div key={index} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-800/40">
                      
                      {/* Technical Name */}
                      <input
                        type="text"
                        required
                        placeholder="Identifier (e.g. ram_gb)"
                        value={field.name}
                        onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                        className="w-full sm:flex-1 min-w-[100px] px-2.5 py-1 border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 rounded-lg text-xs"
                      />

                      {/* Display Label */}
                      <input
                        type="text"
                        required
                        placeholder="Label (e.g. RAM Size)"
                        value={field.label}
                        onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                        className="w-full sm:flex-1 min-w-[100px] px-2.5 py-1 border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 rounded-lg text-xs"
                      />

                      {/* Attribute Type */}
                      <select
                        value={field.type}
                        onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                        className="w-24 px-2 py-1 border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 rounded-lg text-xs"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                      </select>

                      {/* Required check */}
                      <label className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                          className="rounded border-slate-200 text-indigo-600"
                        />
                        Req?
                      </label>

                      {/* Remove row */}
                      <button
                        type="button"
                        onClick={() => removeFieldRow(index)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-1 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                      No custom fields added. Assets in this category will use default details only.
                    </div>
                  )}
                </div>
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
                  Register Schema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default Categories;
