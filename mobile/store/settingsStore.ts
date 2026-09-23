import { create } from 'zustand';
import { storage } from '../utils/storage';

interface SettingsState {
  theme: 'dark' | 'light';
  currency: string;
  currencySymbol: string;
  hasSeenOnboarding: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  setCurrency: (currency: string) => void;
  setOnboardingSeen: (seen: boolean) => void;
  loadSettings: () => Promise<void>;
}

const SETTINGS_KEY = 'ET_APP_SETTINGS';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
  AED: 'AED ',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'light',
  currency: 'INR',
  currencySymbol: '₹',
  hasSeenOnboarding: false,

  setTheme: (theme: 'dark' | 'light') => {
    set({ theme });
    saveToStorage({ ...get(), theme });
  },

  setCurrency: (currency: string) => {
    const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
    set({ currency, currencySymbol: symbol });
    saveToStorage({ ...get(), currency, currencySymbol: symbol });
  },

  setOnboardingSeen: (hasSeenOnboarding: boolean) => {
    set({ hasSeenOnboarding });
    saveToStorage({ ...get(), hasSeenOnboarding });
  },

  loadSettings: async () => {
    try {
      const data = await storage.getItem(SETTINGS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        set({
          theme: parsed.theme || 'light',
          currency: parsed.currency || 'INR',
          currencySymbol: CURRENCY_SYMBOLS[parsed.currency || 'INR'] || '₹',
          hasSeenOnboarding: parsed.hasSeenOnboarding ?? false,
        });
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  },
}));

async function saveToStorage(state: any) {
  try {
    const json = JSON.stringify({
      theme: state.theme,
      currency: state.currency,
      hasSeenOnboarding: state.hasSeenOnboarding,
    });
    await storage.setItem(SETTINGS_KEY, json);
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}
