import { apiClient } from './api';
import { ApiResponse, Transaction, TransactionFilter } from '../types/api';

export const transactionService = {
  async getTransactions(filter: TransactionFilter = {}): Promise<Transaction[]> {
    const res = await apiClient.post<ApiResponse<Transaction[]>>('/api/transaction/list', filter);
    return res.data?.data || [];
  },

  async saveTransaction(transaction: Partial<Transaction>): Promise<Transaction[]> {
    const res = await apiClient.post<ApiResponse<Transaction[]>>('/api/transaction/save', transaction);
    return res.data?.data || [];
  },

  async deleteTransaction(encryptedId: string): Promise<Transaction[]> {
    const res = await apiClient.post<ApiResponse<Transaction[]>>('/api/transaction/delete', { encryptedId });
    return res.data?.data || [];
  },

  async exportCsvUrl(fromDate?: string, toDate?: string): Promise<string> {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    return `${apiClient.defaults.baseURL}/api/transaction/export-csv?${params.toString()}`;
  },
};
