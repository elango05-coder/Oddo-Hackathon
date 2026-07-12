import { api } from './api';

export const assetService = {
  async search(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    status?: string;
    q?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const response = await api.get('/assets/search', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  },

  async getHistory(id: string) {
    const response = await api.get(`/assets/${id}/history`);
    return response.data;
  },

  async create(formData: FormData) {
    const response = await api.post('/assets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async update(id: string, formData: FormData) {
    const response = await api.put(`/assets/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/assets/${id}`);
    return response.data;
  },
};
