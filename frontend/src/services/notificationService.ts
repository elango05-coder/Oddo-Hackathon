import { api } from './api';

export const notificationService = {
  async getAll() {
    const response = await api.get('/notifications');
    return response.data;
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread');
    return response.data;
  },

  async markAllRead() {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },
};
