export type RoleAssignment = { role: string; is_completed?: boolean };
export type AuthUserLike = { id: string; roles?: RoleAssignment[] | null; active_role?: string | null };

export const COMPLETED_ROLES_KEY = 'gymmigo_completed_roles';

/** Roles finished on this browser, for this user (the app's `withLocalCompletions`). */
export function readLocalCompletions(storage: Pick<Storage, 'getItem'> | undefined, userId: string): string[] {
  try {
    const raw = storage?.getItem(COMPLETED_ROLES_KEY);
    const parsed = raw ? (JSON.parse(raw) as { userId?: string; roles?: string[] }) : null;
    return parsed?.userId === userId && Array.isArray(parsed.roles) ? parsed.roles : [];
  } catch {
    return [];
  }
}

export function rememberCompletion(storage: Pick<Storage, 'getItem' | 'setItem'> | undefined, userId: string, role: string) {
  const roles = new Set(readLocalCompletions(storage, userId));
  roles.add(role);
  try {
    storage?.setItem(COMPLETED_ROLES_KEY, JSON.stringify({ userId, roles: [...roles] }));
  } catch {
    // ignore (private mode)
  }
}

/**
 * If the server still says `is_completed: false` for a role the user just finished here (stale read or a
 * backend that doesn't set the flag), treat it as completed so a refresh can't send them back to onboarding.
 */
export function withLocalCompletions<T extends AuthUserLike>(user: T, completed: string[]): T {
  if (!completed.length || !Array.isArray(user.roles)) return user;
  let changed = false;
  const roles = user.roles.map(r => {
    if (completed.includes(r.role) && !r.is_completed) {
      changed = true;
      return { ...r, is_completed: true };
    }
    return r;
  });
  return changed ? { ...user, roles } : user;
}

export function isActiveRoleCompleted(user: AuthUserLike | null | undefined): boolean {
  if (!user) return false;
  const active = user.roles?.find(r => r.role === user.active_role);
  return !!active?.is_completed;
}

export const needsOnboarding = (user: AuthUserLike | null | undefined) => !!user && !isActiveRoleCompleted(user);

/**
 * Where a guarded route should send the user, or null to render it.
 * - signed out → /login
 * - app route while the active role's onboarding is unfinished → /onboarding/role
 * Onboarding routes themselves use requireOnboarding=false: a finished user may come back to add a role.
 */
export function resolveGuardRedirect({
  hasToken,
  user,
  requireOnboarding,
}: {
  hasToken: boolean;
  user: AuthUserLike | null | undefined;
  requireOnboarding: boolean;
}): string | null {
  if (!hasToken) return '/login';
  if (!user) return null; // still loading /auth/me
  if (requireOnboarding && !isActiveRoleCompleted(user)) return '/onboarding/role';
  return null;
}

/** After OTP: brand-new users (or users without roles) go to role select, everyone else to the dashboard. */
export function landingAfterLogin(user: AuthUserLike, isNewUser?: boolean): string {
  if (isNewUser || !user.roles?.length) return '/onboarding/role';
  return isActiveRoleCompleted(user) ? '/app/dashboard' : '/onboarding/role';
}

/** Where finishing onboarding lands (owners go straight to adding their gym, as in the app). */
export function landingAfterOnboarding(role: string): string {
  return role === 'gym_owner' ? '/app/gym-owner/add-gym' : '/app/dashboard';
}
