import { apiClient } from './api';
import { ApiResponse, Budget } from '../types/api';

export const budgetService = {
  async getBudgets(month?: number, year?: number): Promise<Budget[]> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const res = await apiClient.get<ApiResponse<Budget[]>>(`/api/budget/list?${params.toString()}`);
    return res.data?.data || [];
  },

  async saveBudget(budget: Partial<Budget>): Promise<Budget[]> {
    const res = await apiClient.post<ApiResponse<Budget[]>>('/api/budget/save', budget);
    return res.data?.data || [];
  },
};
