import { apiClient } from './api';
import { ApiResponse, Category } from '../types/api';

export const categoryService = {
  async getCategories(categoryType: number = 0): Promise<Category[]> {
    const res = await apiClient.get<ApiResponse<Category[]>>(`/api/category/list?categoryType=${categoryType}`);
    return res.data?.data || [];
  },

  async saveCategory(category: Partial<Category>): Promise<Category[]> {
    const res = await apiClient.post<ApiResponse<Category[]>>('/api/category/save', category);
    return res.data?.data || [];
  },

  async deleteCategory(encryptedId: string): Promise<Category[]> {
    const res = await apiClient.post<ApiResponse<Category[]>>('/api/category/delete', { encryptedId });
    return res.data?.data || [];
  },
};
