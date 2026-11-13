export type ThemePreference = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'gymmigo_theme';

/** Meta theme-color per scheme: the app's background tokens. */
export const THEME_COLOR: Record<ColorScheme, string> = { light: '#F1F1F3', dark: '#131315' };

export function parsePreference(value: string | null | undefined): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function resolveScheme(preference: ThemePreference, systemPrefersDark: boolean): ColorScheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}

export function readPreference(storage: Pick<Storage, 'getItem'> | undefined): ThemePreference {
  try {
    return parsePreference(storage?.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
}

/** Writes the scheme to <html data-theme> and the browser chrome colour. */
export function applyScheme(scheme: ColorScheme, doc: Document = document) {
  doc.documentElement.setAttribute('data-theme', scheme);
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[scheme]);
}
