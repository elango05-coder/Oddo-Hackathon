import { api } from './api';

export const maintenanceService = {
  async getPending() {
    const response = await api.get('/maintenance/pending');
    return response.data;
  },

  async getLogs(requestId: string) {
    const response = await api.get(`/maintenance/${requestId}/logs`);
    return response.data;
  },

  async request(formData: FormData) {
    const response = await api.post('/maintenance/request', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async approve(id: string, data: { assignedTechnicianId: string; estimatedCost: number; priority?: string }) {
    const response = await api.post(`/maintenance/${id}/approve`, data);
    return response.data;
  },

  async startWork(id: string) {
    const response = await api.post(`/maintenance/${id}/start`);
    return response.data;
  },

  async resolve(id: string, data: { actualCost: number; remarks: string }) {
    const response = await api.post(`/maintenance/${id}/resolve`, data);
    return response.data;
  },
};
