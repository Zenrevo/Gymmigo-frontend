import { describe, expect, it } from 'vitest';
import {
  COMPLETED_ROLES_KEY,
  landingAfterLogin,
  landingAfterOnboarding,
  readLocalCompletions,
  rememberCompletion,
  resolveGuardRedirect,
  withLocalCompletions,
} from './onboarding';

const member = (done: boolean) => ({ id: 'u1', active_role: 'user', roles: [{ role: 'user', is_completed: done }] });

describe('auth guard redirects', () => {
  it('sends signed-out visitors to login', () => {
    expect(resolveGuardRedirect({ hasToken: false, user: null, requireOnboarding: true })).toBe('/login');
  });

  it('waits while the user is loading', () => {
    expect(resolveGuardRedirect({ hasToken: true, user: null, requireOnboarding: true })).toBeNull();
  });

  it('sends unfinished onboarding to role select on app routes only', () => {
    expect(resolveGuardRedirect({ hasToken: true, user: member(false), requireOnboarding: true })).toBe('/onboarding/role');
    // onboarding routes never redirect to themselves → no loop
    expect(resolveGuardRedirect({ hasToken: true, user: member(false), requireOnboarding: false })).toBeNull();
  });

  it('lets finished users through', () => {
    expect(resolveGuardRedirect({ hasToken: true, user: member(true), requireOnboarding: true })).toBeNull();
  });

  it('a stale /auth/me is patched by local completions, so finishing onboarding does not bounce back', () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    rememberCompletion(storage, 'u1', 'user');
    expect(store.has(COMPLETED_ROLES_KEY)).toBe(true);
    const patched = withLocalCompletions(member(false), readLocalCompletions(storage, 'u1'));
    expect(resolveGuardRedirect({ hasToken: true, user: patched, requireOnboarding: true })).toBeNull();
    expect(readLocalCompletions(storage, 'someone-else')).toEqual([]);
  });

  it('lands new and returning users correctly', () => {
    expect(landingAfterLogin(member(true), true)).toBe('/onboarding/role');
    expect(landingAfterLogin({ id: 'u1', roles: [] })).toBe('/onboarding/role');
    expect(landingAfterLogin(member(false))).toBe('/onboarding/role');
    expect(landingAfterLogin(member(true))).toBe('/app/dashboard');
    expect(landingAfterOnboarding('user')).toBe('/app/dashboard');
    expect(landingAfterOnboarding('trainer')).toBe('/app/dashboard');
    expect(landingAfterOnboarding('gym_owner')).toBe('/app/gym-owner/add-gym');
  });
});
