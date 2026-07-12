import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { AuthLayout } from '../layouts/AuthLayout';
import { Lock, Mail, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupInput = z.infer<typeof signupSchema>;

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    setSubmitting(true);
    try {
      const res = await authService.signup(data);
      toast.success(res.message || 'Account registered successfully! Verification email sent.');
      navigate('/login');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Account</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Register to request an employee profile.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Full Name
          </label>
          <div className="mt-1.5 relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              disabled={submitting}
              className={`block w-full pl-10 pr-3 py-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? 'border-red-300 focus:ring-red-200 dark:border-red-800'
                  : 'border-slate-200 dark:border-slate-700/80 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-600'
              }`}
              placeholder="John Doe"
              {...register('name')}
            />
          </div>
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
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
              placeholder="johndoe@assetflow.com"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Password
          </label>
          <div className="mt-1.5 relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              disabled={submitting}
              className={`block w-full pl-10 pr-10 py-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.password
                  ? 'border-red-300 focus:ring-red-200 dark:border-red-800'
                  : 'border-slate-200 dark:border-slate-700/80 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-600'
              }`}
              placeholder="••••••••"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md shadow-indigo-100 dark:shadow-none disabled:opacity-50 transition-all duration-200"
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-xs text-slate-500">Already have an account? </span>
        <Link
          to="/login"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
};
export default Signup;
