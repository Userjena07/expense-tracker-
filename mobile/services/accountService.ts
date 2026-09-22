import { apiClient } from './api';
import { Account, ApiResponse } from '../types/api';

export const accountService = {
  async getAccounts(): Promise<Account[]> {
    const res = await apiClient.post<ApiResponse<Account[]>>('/api/account/list');
    return res.data?.data || [];
  },

  async saveAccount(account: Partial<Account>): Promise<Account[]> {
    const res = await apiClient.post<ApiResponse<Account[]>>('/api/account/save', account);
    return res.data?.data || [];
  },

  async deleteAccount(encryptedId: string): Promise<Account[]> {
    const res = await apiClient.post<ApiResponse<Account[]>>('/api/account/delete', { encryptedId });
    return res.data?.data || [];
  },
};
