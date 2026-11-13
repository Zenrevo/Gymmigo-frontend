import { createContext, useContext } from 'react';
import type { ColorScheme, ThemePreference } from './theme';

export type ThemeContextValue = {
  preference: ThemePreference;
  scheme: ColorScheme;
  setPreference: (preference: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
