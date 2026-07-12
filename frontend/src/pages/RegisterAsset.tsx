import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/categoryService';
import { assetService } from '../services/assetService';
import { departmentService } from '../services/departmentService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { AssetCategory, Department } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, ArrowLeft, Loader2, Save } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Asset name is required'),
  categoryId: z.string().min(1, 'Please select a category'),
  departmentId: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseCost: z.coerce.number().min(0, 'Purchase cost cannot be negative'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
});


export const RegisterAsset: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories
  const { data: catRes } = useQuery({
    queryKey: ['categoriesList'],
    queryFn: () => categoryService.getAll(),
  });
  const categories: AssetCategory[] = catRes?.data || [];

  // Fetch departments
  const { data: deptRes } = useQuery({
    queryKey: ['departmentsHierarchy'],
    queryFn: () => departmentService.getHierarchy(),
  });
  const departments: Department[] = deptRes?.data || [];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: 0,
    },
  });

  const categoryIdWatch = watch('categoryId');

  // Trigger dynamic schema build on category select
  useEffect(() => {
    if (categoryIdWatch) {
      const match = categories.find((c) => c._id === categoryIdWatch);
      if (match) {
        setSelectedCategory(match);
        // Initialize dynamic fields values
        const initVals: Record<string, any> = {};
        match.fields.forEach((f) => {
          initVals[f.name] = f.type === 'boolean' ? false : f.type === 'number' ? 0 : '';
        });
        setDynamicValues(initVals);
      }
    } else {
      setSelectedCategory(null);
      setDynamicValues({});
    }
  }, [categoryIdWatch, categories]);

  const handleDynamicChange = (fieldName: string, val: any) => {
    setDynamicValues({ ...dynamicValues, [fieldName]: val });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setDocFiles([...docFiles, ...Array.from(files)]);
    }
  };

  const removeDoc = (idx: number) => {
    setDocFiles(docFiles.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data: any) => {
    // Validate required custom fields
    if (selectedCategory) {
      for (const field of selectedCategory.fields) {
        if (field.required) {
          const val = dynamicValues[field.name];
          if (val === undefined || val === null || val === '') {
            toast.error(`Custom attribute field "${field.label}" is required.`);
            return;
          }
        }
      }
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('categoryId', data.categoryId);
    if (data.departmentId) formData.append('departmentId', data.departmentId);
    if (data.serialNumber) formData.append('serialNumber', data.serialNumber);
    formData.append('purchaseCost', String(data.purchaseCost));
    formData.append('purchaseDate', data.purchaseDate);

    // Dynamic metadata must be stringified JSON for multer parsing
    formData.append('metadata', JSON.stringify(dynamicValues));

    if (imageFile) {
      formData.append('image', imageFile);
    }
    docFiles.forEach((doc) => {
      formData.append('documents', doc);
    });

    try {
      await assetService.create(formData);
      queryClient.invalidateQueries({ queryKey: ['assetsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Asset registered successfully!');
      navigate('/assets');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to register asset. Ensure fields are correct.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6">
        <Link
          to="/assets"
          className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Register New Asset</h2>
          <p className="text-xs text-slate-500">Record hardware, software, or shared equipment parameters.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* LEFT PANEL: UPLOADS */}
          <div className="space-y-4">
            {/* Image Preview / Upload Box */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 self-start">Asset Image</label>
              <div className="h-40 w-full rounded-xl bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-700 relative overflow-hidden flex items-center justify-center">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center text-slate-400 hover:text-slate-600">
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-[11px]">Upload Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>

            {/* Documents Receipt Box */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Invoice Receipts</label>
              <label className="cursor-pointer flex items-center justify-center gap-1.5 px-4 py-2 border border-dashed border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs text-slate-500 font-semibold mb-3">
                <Upload className="h-4 w-4" />
                Upload PDFs / Docs
                <input type="file" multiple className="hidden" onChange={handleDocsChange} />
              </label>

              <div className="space-y-1.5 overflow-y-auto max-h-32 custom-scrollbar">
                {docFiles.map((doc, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] bg-slate-50 dark:bg-slate-850 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800/40">
                    <span className="truncate max-w-[150px] font-mono">{doc.name}</span>
                    <button type="button" onClick={() => removeDoc(idx)} className="text-red-500 hover:bg-red-50 p-0.5 rounded">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: CORE FORMS */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            
            {/* General Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Asset Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset Name</label>
                <input
                  type="text"
                  disabled={submitting}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="MacBook Pro 16"
                  {...register('name')}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Serial Number (Optional)</label>
                <input
                  type="text"
                  disabled={submitting}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="C02GG829MD6R"
                  {...register('serialNumber')}
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset Category</label>
                <select
                  disabled={submitting}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  {...register('categoryId')}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name} ({cat.code})
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
              </div>

              {/* Department selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Assign to Department</label>
                <select
                  disabled={submitting}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  {...register('departmentId')}
                >
                  <option value="">None (Corporate Stock)</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Purchase Cost */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchase Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  disabled={submitting}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  {...register('purchaseCost')}
                />
                {errors.purchaseCost && <p className="mt-1 text-xs text-red-500">{errors.purchaseCost.message}</p>}
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchase Date</label>
                <input
                  type="date"
                  disabled={submitting}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  {...register('purchaseDate')}
                />
                {errors.purchaseDate && <p className="mt-1 text-xs text-red-500">{errors.purchaseDate.message}</p>}
              </div>
            </div>

            {/* DYNAMIC CATEGORY FIELD METADATA */}
            {selectedCategory && selectedCategory.fields.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-650 dark:text-slate-400 mb-3">
                  Dynamic Category Parameters: {selectedCategory.name}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedCategory.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'text' && (
                        <input
                          type="text"
                          disabled={submitting}
                          value={dynamicValues[field.name] || ''}
                          onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                          className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      )}
                      {field.type === 'number' && (
                        <input
                          type="number"
                          disabled={submitting}
                          value={dynamicValues[field.name] || ''}
                          onChange={(e) => handleDynamicChange(field.name, Number(e.target.value))}
                          className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      )}
                      {field.type === 'date' && (
                        <input
                          type="date"
                          disabled={submitting}
                          value={dynamicValues[field.name] || ''}
                          onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                          className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      )}
                      {field.type === 'boolean' && (
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="checkbox"
                            disabled={submitting}
                            checked={!!dynamicValues[field.name]}
                            onChange={(e) => handleDynamicChange(field.name, e.target.checked)}
                            className="rounded border-slate-200 text-indigo-650 h-4.5 w-4.5"
                          />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-355">Toggle Option</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <Link
                to="/assets"
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Asset
              </button>
            </div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
};
export default RegisterAsset;
