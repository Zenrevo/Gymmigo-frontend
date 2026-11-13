import { createContext } from 'react';

/** Set by MainLayout; <Legacy> pages call it to force the shell dark. */
export const LegacyThemeContext = createContext<((forced: boolean) => void) | null>(null);
