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

  async getProfile(): Promise<ApiResponse<User>> {
    const res = await apiClient.get<ApiResponse<User>>('/api/user/profile');
    return res.data;
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const res = await apiClient.post<ApiResponse<User>>('/api/user/update-profile', data);
    return res.data;
  },
};
