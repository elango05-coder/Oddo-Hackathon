import { api } from './api';

export const authService = {
  async signup(data: any) {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  async login(data: any) {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(data: any) {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async promoteUser(data: { email: string; roleName: string; departmentId?: string | null }) {
    const response = await api.post('/auth/promote', data);
    return response.data;
  },

  async getUsers() {
    const response = await api.get('/auth/users');
    return response.data;
  },

  async deactivateUser(userId: string) {
    const response = await api.post('/auth/deactivate', { userId });
    return response.data;
  },

  async updateProfile(data: { name: string }) {
    const response = await api.put('/auth/update-profile', data);
    return response.data;
  },
};
