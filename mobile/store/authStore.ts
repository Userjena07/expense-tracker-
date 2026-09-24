import { create } from 'zustand';
import { storage } from '../utils/storage';
import { User } from '../types/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  secretKey: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLocked: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string, secretKey?: string) => Promise<void>;
  setSecretKey: (key: string) => Promise<void>;
  updateUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setLocked: (locked: boolean) => void;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

const ACCESS_TOKEN_KEY = 'ET_ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'ET_REFRESH_TOKEN';
const USER_KEY = 'ET_USER_PROFILE';
const SECRET_KEY = 'ET_SECRET_KEY';
const BIOMETRIC_KEY = 'ET_BIOMETRIC_ENABLED';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  secretKey: null,
  isAuthenticated: false,
  isLoading: true,
  isLocked: false,

  setAuth: async (user: User, accessToken: string, refreshToken: string, secretKey?: string) => {
    try {
      await storage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      await storage.setItem(USER_KEY, JSON.stringify(user));
      if (user.isBiometricOn) {
        await storage.setItem(BIOMETRIC_KEY, 'true');
      }
      if (secretKey) {
        await storage.setItem(SECRET_KEY, secretKey);
      }
    } catch (e) {
      console.error('Failed to save auth to secure store', e);
    }

    set({
      user,
      accessToken,
      refreshToken,
      secretKey: secretKey || get().secretKey,
      isAuthenticated: true,
      isLoading: false,
      isLocked: false,
    });
  },

  setSecretKey: async (key: string) => {
    try {
      await storage.setItem(SECRET_KEY, key);
    } catch (e) {
      console.error('Failed to save secret key', e);
    }
    set({ secretKey: key });
  },

  updateUser: (user: User) => {
    storage.setItem(USER_KEY, JSON.stringify(user)).catch(console.error);
    storage.setItem(BIOMETRIC_KEY, user.isBiometricOn ? 'true' : 'false').catch(console.error);
    set({ user });
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    try {
      await storage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
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
      await storage.deleteItem(ACCESS_TOKEN_KEY);
      await storage.deleteItem(REFRESH_TOKEN_KEY);
      await storage.deleteItem(USER_KEY);
      await storage.deleteItem(SECRET_KEY);
      await storage.deleteItem(BIOMETRIC_KEY);
    } catch (e) {
      console.error('Failed to clear secure store', e);
    }

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      secretKey: null,
      isAuthenticated: false,
      isLoading: false,
      isLocked: false,
    });
  },

  loadStoredAuth: async () => {
    try {
      const [accessToken, refreshToken, userJson, storedSecretKey, storedBio] = await Promise.all([
        storage.getItem(ACCESS_TOKEN_KEY),
        storage.getItem(REFRESH_TOKEN_KEY),
        storage.getItem(USER_KEY),
        storage.getItem(SECRET_KEY),
        storage.getItem(BIOMETRIC_KEY),
      ]);

      if (accessToken && userJson) {
        const user = JSON.parse(userJson) as User;
        const isBioActive = storedBio !== null ? storedBio === 'true' : !!user.isBiometricOn;
        const resolvedUser = { ...user, isBiometricOn: isBioActive };
        set({
          user: resolvedUser,
          accessToken,
          refreshToken,
          secretKey: storedSecretKey,
          isAuthenticated: true,
          isLoading: false,
          isLocked: isBioActive,
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
      secretKey: null,
      isAuthenticated: false,
      isLoading: false,
      isLocked: false,
    });
  },
}));
