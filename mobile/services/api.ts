import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { ApiResponse, AuthResponse } from '../types/api';

const RENDER_PROD_API_URL = 'https://expense-tracker-api-4xxr.onrender.com';

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.startsWith('http')) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Only use localhost in local dev server mode
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:5050`;
    }

    if (Platform.OS === 'web') {
      return 'http://localhost:5050';
    }

    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5050';
    }
  }

  // Default to live Render backend for all mobile standalone/preview/production builds
  return RENDER_PROD_API_URL;
};

const API_BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Don't attempt refresh for auth endpoints (login, register, refresh)
    const isAuthEndpoint = originalRequest?.url?.includes('/api/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const res = await axios.post<ApiResponse<AuthResponse>>(
            `${API_BASE_URL}/api/auth/refresh`,
            { refreshToken }
          );

          if (res.data?.success && res.data.data) {
            const { accessToken, refreshToken: newRefreshToken, user } = res.data.data;
            await useAuthStore.getState().setAuth(user, accessToken, newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        } catch {
          // Token expired or invalid, log out quietly without LogBox toast
          await useAuthStore.getState().logout();
        }
      } else {
        await useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);
