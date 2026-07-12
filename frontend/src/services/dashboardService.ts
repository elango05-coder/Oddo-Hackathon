import { api } from './api';

export const dashboardService = {
  async getStats(params?: { refresh?: boolean }) {
    const response = await api.get('/dashboard', { params });
    return response.data;
  },

  async rebuildCache() {
    const response = await api.post('/dashboard/rebuild-cache');
    return response.data;
  },
  
  async seedDemo() {
    const response = await api.post('/dashboard/seed-demo');
    return response.data;
  },
};
