import { api } from './api';

export const categoryService = {
  async getAll() {
    const response = await api.get('/categories');
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  async create(data: { name: string; code: string; description?: string; fields: any[] }) {
    const response = await api.post('/categories', data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};
