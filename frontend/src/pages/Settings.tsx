import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { authService } from '../services/authService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Shield, Moon, Sun, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [submitting, setSubmitting] = useState(false);

  const userRole = typeof user?.roleId === 'object' ? user.roleId.name : 'Employee';
  const deptName = typeof user?.departmentId === 'object' ? user.departmentId?.name : 'Not Assigned';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      const res = await authService.updateProfile({ name });
      const updatedUser = res.data;
      updateUser(updatedUser);
      toast.success('Profile details updated successfully.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-xs text-slate-500">Configure personal specifications and interface themes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Summary Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150/40 text-indigo-650 flex items-center justify-center text-xl font-bold mb-4">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{user?.name}</h3>
          <p className="text-xs text-slate-500 mt-1">{user?.email}</p>

          <div className="w-full border-t border-slate-100 dark:border-slate-800/80 my-6 pt-6 text-left text-xs space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-indigo-650" />
              <span>Role: <strong className="capitalize text-slate-900 dark:text-slate-200">{userRole}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-indigo-650" />
              <span>Department: <strong className="text-slate-900 dark:text-slate-200">{deptName}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Side: Update Profile Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-6">
          
          {/* Profile form */}
          <div>
            <h4 className="font-bold text-sm mb-4">Edit Profile</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-855 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="mt-1.5 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Theme custom settings */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h4 className="font-bold text-sm mb-4">Preferences</h4>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 rounded-xl">
                  {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Interface Dark Mode</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Toggle light/dark appearance for this session.</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};
export default Settings;
