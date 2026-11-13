import { useContext, useEffect, type ReactNode } from 'react';
import { LegacyThemeContext } from './legacyThemeContext';

/**
 * Pages not yet rebuilt on the new tokens hard-code white text on dark backgrounds.
 * Wrapping one in <Legacy> makes the whole shell render dark while it's on screen, so it stays legible
 * in light theme. Remove the wrapper when a page is rebuilt with the kit.
 */

export function Legacy({ children }: { children: ReactNode }) {
  const setForced = useContext(LegacyThemeContext);
  useEffect(() => {
    setForced?.(true);
    return () => setForced?.(false);
  }, [setForced]);
  // Outside the shell (public / full-screen pages) force dark on the subtree itself.
  if (!setForced) return <div data-theme="dark" className="min-h-dvh bg-background text-ink">{children}</div>;
  return <>{children}</>;
}
