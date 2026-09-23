import { apiClient } from './api';
import { ApiResponse, AuthResponse, User } from '../types/api';

export const authService = {
  async register(data: {
    fullName: string;
    email: string;
    password: string;
    currencyCode?: string;
    monthStartDay?: number;
    theme?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/register', data);
    return res.data;
  },

  async login(data: {
    email: string;
    password: string;
    deviceInfo?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/login', data);
    return res.data;
  },

  async logout(): Promise<ApiResponse<null>> {
    const res = await apiClient.post<ApiResponse<null>>('/api/auth/logout');
    return res.data;
  },

  generateSecretKey(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `EXP-${segment()}-${segment()}-${segment()}`;
  },

  getSecretCredentials(secretKey: string) {
    const cleanKey = secretKey.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const cleanEmail = `${cleanKey.toLowerCase().replace(/-/g, '')}@expensetracker.local`;
    const cleanPassword = `ET_PWD_${cleanKey}`;
    return { cleanKey, cleanEmail, cleanPassword };
  },

  async createAccountWithSecret(fullName: string, currencyCode: string = 'INR', secretKey?: string): Promise<{ secretKey: string; response: ApiResponse<AuthResponse> }> {
    const key = secretKey || this.generateSecretKey();
    const { cleanEmail, cleanPassword } = this.getSecretCredentials(key);

    const res = await this.register({
      fullName: fullName.trim(),
      email: cleanEmail,
      password: cleanPassword,
      currencyCode,
      monthStartDay: 1,
      theme: 'dark',
    });

    return { secretKey: key, response: res };
  },

  async restoreAccountWithSecret(secretKey: string): Promise<ApiResponse<AuthResponse>> {
    const { cleanEmail, cleanPassword } = this.getSecretCredentials(secretKey);
    return this.login({
      email: cleanEmail,
      password: cleanPassword,
      deviceInfo: 'Mobile Device',
    });
  },

  async getProfile(): Promise<ApiResponse<User>> {
    const res = await apiClient.get<ApiResponse<User>>('/api/user/profile');
    return res.data;
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const res = await apiClient.post<ApiResponse<User>>('/api/user/update-profile', data);
    return res.data;
  },
};
