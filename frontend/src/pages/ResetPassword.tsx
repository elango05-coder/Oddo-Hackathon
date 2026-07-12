import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { AuthLayout } from '../layouts/AuthLayout';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetInput = z.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetInput) => {
    if (!token) {
      toast.error('Reset token is missing.');
      return;
    }
    setSubmitting(true);
    try {
      await authService.resetPassword({
        token,
        newPassword: data.newPassword,
      });
      toast.success('Password reset successfully. Please log in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter and confirm your new secure account password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            New Password
          </label>
          <div className="mt-1.5 relative rounded-xl shadow-sm">
            <input
              type={showPassword ? 'text' : 'password'}
              disabled={submitting}
              className={`block w-full px-3 py-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.newPassword
                  ? 'border-red-300 focus:ring-red-200 dark:border-red-800'
                  : 'border-slate-200 dark:border-slate-700/80 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-600'
              }`}
              placeholder="••••••••"
              {...register('newPassword')}
            />
          </div>
          {errors.newPassword && (
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.newPassword.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Confirm Password
          </label>
          <div className="mt-1.5 relative rounded-xl shadow-sm">
            <input
              type={showPassword ? 'text' : 'password'}
              disabled={submitting}
              className={`block w-full px-3 py-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.confirmPassword
                  ? 'border-red-300 focus:ring-red-200 dark:border-red-800'
                  : 'border-slate-200 dark:border-slate-700/80 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-600'
              }`}
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md shadow-indigo-100 dark:shadow-none disabled:opacity-50 transition-all duration-200"
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  );
};
export default ResetPassword;
