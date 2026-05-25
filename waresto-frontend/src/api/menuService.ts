import { apiClient } from './client';

export const menuService = {
  getCategories: async () => {
    const response = await apiClient.get('/categories');
    return response.data;
  },
  getMenus: async (categoryId?: string) => {
    const response = await apiClient.get('/menus', {
      params: { categoryId },
    });
    return response.data;
  },
  getMenuById: async (id: string) => {
    const response = await apiClient.get(`/menus/${id}`);
    return response.data;
  },
  createCategory: async (data: any) => {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },
  createMenu: async (data: any) => {
    const response = await apiClient.post('/menus', data);
    return response.data;
  },
  updateMenu: async (id: string, data: any) => {
    const response = await apiClient.patch(`/menus/${id}`, data);
    return response.data;
  },
  deleteMenu: async (id: string) => {
    const response = await apiClient.delete(`/menus/${id}`);
    return response.data;
  },
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // Assuming backend returns { url: '/uploads/filename.jpg' }
    // We need the full URL since the frontend is on a different port
    const baseURL = apiClient.defaults.baseURL?.replace('/v1', '') || 'http://localhost:3001';
    return `${baseURL}${response.data.url}`;
  },
};
