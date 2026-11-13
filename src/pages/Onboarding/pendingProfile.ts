/** Member profile answers carried from Profile details to the Location step (survives a refresh). */
export const PENDING_PROFILE_KEY = 'gymmigo_onboarding_profile';
export type PendingProfile = { full_name: string; email: string };

export const savePendingProfile = (p: PendingProfile) => {
  try {
    sessionStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
};

export const readPendingProfile = (): PendingProfile | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as PendingProfile) : null;
  } catch {
    return null;
  }
};

export const clearPendingProfile = () => {
  try {
    sessionStorage.removeItem(PENDING_PROFILE_KEY);
  } catch {
    /* ignore */
  }
};
