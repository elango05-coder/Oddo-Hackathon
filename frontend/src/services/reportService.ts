import { api } from './api';

export const reportService = {
  async getUtilization() {
    const response = await api.get('/reports/utilization');
    return response.data;
  },

  async getMaintenanceStats() {
    const response = await api.get('/reports/maintenance');
    return response.data;
  },

  async getIdleAssets() {
    const response = await api.get('/reports/idle');
    return response.data;
  },

  async getPopularAssets() {
    const response = await api.get('/reports/popular');
    return response.data;
  },

  async exportCSV() {
    // Return direct array buffer or triggering browser download
    const response = await api.get('/reports/export/csv', { responseType: 'blob' });
    return response.data;
  },
};
export type { User } from '../types';
