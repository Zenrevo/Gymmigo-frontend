export type HomeMode = 'gym' | 'sports';
export const HOME_MODE_KEY = 'gymmigo_home_mode';

/** The Gym | Sports choice, remembered per browser (like the app's per-device setting). Defaults to Gym. */
export function readHomeMode(): HomeMode {
  try {
    return localStorage.getItem(HOME_MODE_KEY) === 'sports' ? 'sports' : 'gym';
  } catch {
    return 'gym';
  }
}
