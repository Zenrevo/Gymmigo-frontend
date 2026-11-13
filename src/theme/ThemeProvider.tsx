import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyScheme,
  readPreference,
  resolveScheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from './theme';

import { ThemeContext } from './themeContext';

const darkQuery = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null);

/** System / Light / Dark, like the app's Profile → App appearance. Stored per browser. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readPreference(typeof window !== 'undefined' ? window.localStorage : undefined));
  const [systemDark, setSystemDark] = useState(() => darkQuery()?.matches ?? true);

  useEffect(() => {
    const mq = darkQuery();
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const scheme = resolveScheme(preference, systemDark);

  useEffect(() => {
    applyScheme(scheme);
  }, [scheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // private mode: the choice lasts for this tab only
    }
  }, []);

  const value = useMemo(() => ({ preference, scheme, setPreference }), [preference, scheme, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
