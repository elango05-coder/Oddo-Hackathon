import { api } from './api';

export const allocationService = {
  async getActive() {
    const response = await api.get('/allocations/active');
    return response.data;
  },

  async getPendingTransfers() {
    const response = await api.get('/allocations/transfers/pending');
    return response.data;
  },

  async checkout(data: {
    assetId: string;
    assigneeId: string;
    expectedReturnDate: string;
    conditionOnAllocation: string;
  }) {
    const response = await api.post('/allocations/checkout', data);
    return response.data;
  },

  async returnAsset(data: { assetId: string; conditionOnReturn: string }) {
    const response = await api.post('/allocations/return', data);
    return response.data;
  },

  async requestTransfer(data: { assetId: string; toUserId: string; reason: string }) {
    const response = await api.post('/allocations/transfer', data);
    return response.data;
  },

  async approveTransfer(id: string) {
    const response = await api.post(`/allocations/transfer/${id}/approve`);
    return response.data;
  },

  async rejectTransfer(id: string) {
    const response = await api.post(`/allocations/transfer/${id}/reject`);
    return response.data;
  },
};
