import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLocked: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  updateUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setLocked: (locked: boolean) => void;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

const ACCESS_TOKEN_KEY = 'ET_ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'ET_REFRESH_TOKEN';
const USER_KEY = 'ET_USER_PROFILE';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  isLocked: false,

  setAuth: async (user: User, accessToken: string, refreshToken: string) => {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save auth to secure store', e);
    }

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
      isLocked: false,
    });
  },

  updateUser: (user: User) => {
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)).catch(console.error);
    set({ user });
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } catch (e) {
      console.error('Failed to update tokens in secure store', e);
    }

    set({ accessToken, refreshToken });
  },

  setLocked: (locked: boolean) => {
    set({ isLocked: locked });
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      console.error('Failed to clear secure store', e);
    }

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isLocked: false,
    });
  },

  loadStoredAuth: async () => {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (accessToken && userJson) {
        const user = JSON.parse(userJson) as User;
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          isLocked: user.isBiometricOn,
        });
        return;
      }
    } catch (e) {
      console.error('Failed to load stored auth', e);
    }

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isLocked: false,
    });
  },
}));
