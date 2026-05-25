import { apiClient } from './client';

export const orderService = {
  getOrders: async () => {
    const response = await apiClient.get('/orders');
    return response.data;
  },
  createOrder: async (orderData: any) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },
  updateOrderStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/orders/${id}/status`, { status });
    return response.data;
  },
  updateOrderItems: async (id: string, items: any[]) => {
    const response = await apiClient.patch(`/orders/${id}/items`, { items });
    return response.data;
  },
  clearHistory: async () => {
    const response = await apiClient.delete('/orders/clear-history');
    return response.data;
  },
  startNewDay: async () => {
    const response = await apiClient.post('/orders/start-new-day');
    return response.data;
  },
};
