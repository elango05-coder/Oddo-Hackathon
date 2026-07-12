import { api } from './api';

export const auditService = {
  async getCycles() {
    const response = await api.get('/audits/cycles');
    return response.data;
  },

  async getDiscrepancyReport(cycleId: string) {
    const response = await api.get(`/audits/cycles/${cycleId}/report`);
    return response.data;
  },

  async createCycle(data: { name: string; startDate: string; endDate: string; assignedAuditors: string[] }) {
    const response = await api.post('/audits/cycles', data);
    return response.data;
  },

  async startCycle(id: string) {
    const response = await api.post(`/audits/cycles/${id}/start`);
    return response.data;
  },

  async closeCycle(id: string) {
    const response = await api.post(`/audits/cycles/${id}/close`);
    return response.data;
  },

  async lockCycle(id: string) {
    const response = await api.post(`/audits/cycles/${id}/lock`);
    return response.data;
  },

  async verifyAsset(data: { cycleId: string; assetId: string; status: 'Verified' | 'Damaged' | 'Missing'; notes?: string }) {
    const response = await api.post('/audits/verify', data);
    return response.data;
  },
};
