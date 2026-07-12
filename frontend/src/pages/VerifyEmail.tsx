import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { AuthLayout } from '../layouts/AuthLayout';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');
  const token = searchParams.get('token');

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing or invalid.');
        return;
      }
      try {
        const res = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(res.message || 'Your email has been verified successfully!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Email verification failed. The link may have expired.');
      }
    };

    performVerification();
  }, [token]);

  return (
    <AuthLayout>
      <div className="text-center py-4">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Verifying Email</h2>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Email Verified!</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-100 dark:shadow-none transition-all duration-200"
            >
              Go to Login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <XCircle className="h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Verification Failed</h2>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <Link
              to="/signup"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Sign Up Again
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};
export default VerifyEmail;
