import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Shield } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-all duration-200"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            Asset<span className="text-indigo-600">Flow</span>
          </span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 sm:px-10 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl shadow-slate-100 dark:shadow-none">
          {children}
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;
