import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Building2, Save, Globe, ShieldAlert, Award, Compass } from 'lucide-react';
import toast from 'react-hot-toast';

export const Organization: React.FC = () => {
  const [orgData, setOrgData] = useState(() => {
    const saved = localStorage.getItem('organization');
    return saved
      ? JSON.parse(saved)
      : {
          name: 'AssetFlow Corp Ltd',
          domain: 'assetflow.com',
          licenseKey: 'AF-ERP-9082-XM99-LL01',
          timezone: 'GMT +5:30',
          currency: 'USD ($)',
          location: 'San Francisco, CA, USA',
        };
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('organization', JSON.stringify(orgData));
      toast.success('Organization configurations saved successfully!');
      setSaving(false);
    }, 800);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight">Organization Profile</h2>
        <p className="text-xs text-slate-500">Configure global parameters and enterprise licenses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Left Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center">
          <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-full text-indigo-600 dark:text-indigo-400 mb-4">
            <Building2 className="h-10 w-10" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{orgData.name}</h3>
          <p className="text-xs text-slate-500 mt-1">Enterprise Domain: {orgData.domain}</p>

          <div className="w-full border-t border-slate-100 dark:border-slate-800/80 my-6 pt-6 space-y-4 text-left">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Award className="h-4.5 w-4.5 text-indigo-600 flex-shrink-0" />
              <span>License: <strong className="text-slate-850 dark:text-slate-250">{orgData.licenseKey}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Globe className="h-4.5 w-4.5 text-indigo-600 flex-shrink-0" />
              <span>Timezone: <strong className="text-slate-850 dark:text-slate-250">{orgData.timezone}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Compass className="h-4.5 w-4.5 text-indigo-600 flex-shrink-0" />
              <span>Location: <strong className="text-slate-850 dark:text-slate-250">{orgData.location}</strong></span>
            </div>
          </div>
        </div>

        {/* Configuration Edit Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm lg:col-span-2">
          <h4 className="font-bold text-sm mb-6">General System Configurations</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Organization name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Company Name</label>
                <input
                  type="text"
                  required
                  value={orgData.name}
                  onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Domain Address</label>
                <input
                  type="text"
                  required
                  value={orgData.domain}
                  onChange={(e) => setOrgData({ ...orgData, domain: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Base Currency</label>
                <select
                  value={orgData.currency}
                  onChange={(e) => setOrgData({ ...orgData, currency: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                  <option>INR (₹)</option>
                </select>
              </div>

              {/* HQ Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Headquarters Location</label>
                <input
                  type="text"
                  required
                  value={orgData.location}
                  onChange={(e) => setOrgData({ ...orgData, location: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* License key */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Enterprise License ID</label>
              <input
                type="text"
                disabled
                value={orgData.licenseKey}
                className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-sm select-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-amber-500" />
                Contact licensing@assetflow.com to extend or update enterprise licenses.
              </span>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default Organization;
