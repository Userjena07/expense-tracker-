export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const typography = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  xxl: 30,
  title: 36,
  hero: 44,
};

export const darkTheme = {
  name: 'dark' as const,
  bg: '#0B0E17',
  bgSecondary: '#121624',
  card: '#181E2F',
  cardBorder: '#262F48',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  accent: '#8B5CF6',
  accentGradient: ['#8B5CF6', '#6366F1'],
  accentLight: '#8B5CF620',
  income: '#10B981',
  incomeBg: '#10B98120',
  expense: '#FF5A78',
  expenseBg: '#FF5A7820',
  transfer: '#38BDF8',
  transferBg: '#38BDF820',
  warning: '#F59E0B',
  warningBg: '#F59E0B20',
  gold: '#FBBF24',
  danger: '#EF4444',
  border: '#232A3E',
  inputBg: '#111522',
  tabBarBg: '#101422E6',
};

export const lightTheme = {
  name: 'light' as const,
  bg: '#F8FAFC',
  bgSecondary: '#F1F5F9',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  accent: '#6366F1',
  accentGradient: ['#6366F1', '#4F46E5'],
  accentLight: '#6366F115',
  income: '#059669',
  incomeBg: '#05966915',
  expense: '#E11D48',
  expenseBg: '#E11D4815',
  transfer: '#0284C7',
  transferBg: '#0284C715',
  warning: '#D97706',
  warningBg: '#D9770615',
  gold: '#D97706',
  danger: '#DC2626',
  border: '#E2E8F0',
  inputBg: '#F1F5F9',
  tabBarBg: '#FFFFFFE6',
};

export type Theme = typeof darkTheme;
export type ThemeColors = typeof darkTheme | typeof lightTheme;
