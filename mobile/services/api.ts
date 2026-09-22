import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { ApiResponse, AuthResponse } from '../types/api';

const getBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5050';
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Auto-detect host IP when running on physical device via Expo Go or simulator
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5050`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5050';
  }

  return 'http://localhost:5050';
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
    if (error.response?.status === 401 && !originalRequest._retry) {
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
        } catch (refreshErr) {
          console.error('Refresh token failed:', refreshErr);
          await useAuthStore.getState().logout();
        }
      } else {
        await useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);
