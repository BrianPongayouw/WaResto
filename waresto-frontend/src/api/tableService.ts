import { apiClient } from './client';

export const tableService = {
  getTables: async () => {
    const response = await apiClient.get('/tables');
    return response.data;
  },
  updateTable: async (id: string, data: any) => {
    const response = await apiClient.patch(`/tables/${id}`, data);
    return response.data;
  },
  createTable: async (data: any) => {
    const response = await apiClient.post('/tables', data);
    return response.data;
  },
  deleteTable: async (id: string) => {
    const response = await apiClient.delete(`/tables/${id}`);
    return response.data;
  },
};
