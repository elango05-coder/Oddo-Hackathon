import { api } from './api';

export const departmentService = {
  async getHierarchy() {
    const response = await api.get('/departments/hierarchy');
    return response.data;
  },

  async create(data: { name: string; code: string; parentId?: string | null; headId?: string | null }) {
    const response = await api.post('/departments', data);
    return response.data;
  },

  async update(id: string, data: { name: string; parentId?: string | null; headId?: string | null }) {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  async deactivate(id: string) {
    const response = await api.post(`/departments/${id}/deactivate`);
    return response.data;
  },
};
