import { apiClient } from './api';
import { ApiResponse, CategorySummary, DailySummary, MonthlySummary } from '../types/api';

export const summaryService = {
  async getMonthlySummary(month?: number, year?: number): Promise<MonthlySummary | null> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const res = await apiClient.get<ApiResponse<MonthlySummary>>(`/api/summary/monthly?${params.toString()}`);
    return res.data?.data || null;
  },

  async getCategorySummary(month?: number, year?: number, type: number = 1): Promise<CategorySummary[]> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    params.append('type', type.toString());
    const res = await apiClient.get<ApiResponse<CategorySummary[]>>(`/api/summary/by-category?${params.toString()}`);
    return res.data?.data || [];
  },

  async getDailySummary(month?: number, year?: number): Promise<DailySummary[]> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const res = await apiClient.get<ApiResponse<DailySummary[]>>(`/api/summary/daily?${params.toString()}`);
    return res.data?.data || [];
  },
};
