import { useSettingsStore } from '../store/settingsStore';
import { darkTheme, lightTheme, ThemeColors, spacing, radius, typography } from './tokens';

export function useTheme() {
  const themeMode = useSettingsStore((state) => state.theme);
  const colors: ThemeColors = themeMode === 'light' ? lightTheme : darkTheme;

  return {
    colors,
    spacing,
    radius,
    typography,
    isDark: themeMode !== 'light',
  };
}
