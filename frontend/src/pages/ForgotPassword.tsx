import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { AuthLayout } from '../layouts/AuthLayout';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotInput = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotInput) => {
    setSubmitting(true);
    try {
      const res = await authService.forgotPassword(data.email);
      toast.success(res.message || 'Password reset link sent to your email.');
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit password reset request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reset Password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Email Address
            </label>
            <div className="mt-1.5 relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                disabled={submitting}
                className={`block w-full pl-10 pr-3 py-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.email
                    ? 'border-red-300 focus:ring-red-200 dark:border-red-800'
                    : 'border-slate-200 dark:border-slate-700/80 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-600'
                }`}
                placeholder="you@assetflow.com"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md shadow-indigo-100 dark:shadow-none disabled:opacity-50 transition-all duration-200"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Reset Link'}
          </button>
        </form>
      ) : (
        <div className="text-center py-4 bg-indigo-50/20 rounded-2xl border border-indigo-100/50 p-4">
          <p className="text-sm text-indigo-900 dark:text-indigo-200">
            A password reset email has been sent. Please check your inbox and follow instructions.
          </p>
        </div>
      )}

      <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-850 pt-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>
    </AuthLayout>
  );
};
export default ForgotPassword;
