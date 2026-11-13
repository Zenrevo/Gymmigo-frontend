import { describe, expect, it } from 'vitest';
import { applyScheme, parsePreference, readPreference, resolveScheme, THEME_COLOR, THEME_STORAGE_KEY } from './theme';

describe('theme resolution', () => {
  it('parses stored preferences and falls back to system', () => {
    expect(parsePreference('dark')).toBe('dark');
    expect(parsePreference('light')).toBe('light');
    expect(parsePreference('system')).toBe('system');
    expect(parsePreference('neon')).toBe('system');
    expect(parsePreference(null)).toBe('system');
  });

  it('resolves system against the OS setting and honours explicit choices', () => {
    expect(resolveScheme('system', true)).toBe('dark');
    expect(resolveScheme('system', false)).toBe('light');
    expect(resolveScheme('light', true)).toBe('light');
    expect(resolveScheme('dark', false)).toBe('dark');
  });

  it('reads from storage and survives a throwing or missing storage', () => {
    expect(readPreference({ getItem: k => (k === THEME_STORAGE_KEY ? 'light' : null) })).toBe('light');
    expect(readPreference(undefined)).toBe('system');
    expect(
      readPreference({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toBe('system');
  });

  it('applies data-theme and meta theme-color', () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
    applyScheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(meta.content.toUpperCase()).toBe(THEME_COLOR.dark.toUpperCase());
    applyScheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
