import { api } from './api';

export const bookingService = {
  async getCalendar(start?: string, end?: string) {
    const params = { start, end };
    const response = await api.get('/bookings/calendar', { params });
    return response.data;
  },

  async book(data: { resourceId: string; startDate: string; endDate: string; purpose: string }) {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  async reschedule(id: string, data: { startDate: string; endDate: string }) {
    const response = await api.post(`/bookings/${id}/reschedule`, data);
    return response.data;
  },

  async cancel(id: string) {
    const response = await api.post(`/bookings/${id}/cancel`);
    return response.data;
  },
};
