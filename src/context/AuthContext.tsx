import React, { createContext, useContext, useState, useEffect } from 'react';
import api, {
  AUTH_STORAGE,
  authTokens,
  getApiErrorMessage,
  refreshSession,
  REFRESH_NETWORK_ERROR,
  type ApiRequestConfig,
} from '../utils/api';
import { COMPLETED_ROLES_KEY, readLocalCompletions, rememberCompletion, withLocalCompletions } from '../auth/onboarding';

const storage = () => (typeof window !== 'undefined' ? window.localStorage : undefined);
const mergeLocal = <T extends Parameters<typeof withLocalCompletions>[0] & { id: string }>(u: T): T => (u?.id ? withLocalCompletions(u, readLocalCompletions(storage(), u.id)) : u);

interface User {
  id: string;
  phone: string;
  roles: any[];
  active_role: string;
  full_name?: string;
  avatar_url?: string;
  onboarding_complete?: boolean;
}

interface AuthContextType {
  user: User | null;
  /**
   * Truthy while signed in. In local mode this is the access JWT; in cookie mode the
   * JWT lives in an httpOnly cookie, so this is a non-secret placeholder.
   */
  token: string | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  switchRole: (role: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Records a finished onboarding for `role` (survives a stale /auth/me) and makes it active locally. */
  markRoleCompleted: (role: string) => Promise<void>;
}

const COOKIE_SESSION_TOKEN = 'cookie-session';

const currentSessionToken = () =>
  AUTH_STORAGE === 'local' ? authTokens.getAccess() : authTokens.hasSession() ? COOKIE_SESSION_TOKEN : null;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => (storage() ? currentSessionToken() : null));
  const [isLoading, setIsLoading] = useState(true);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    authTokens.save(accessToken, refreshToken);
    setToken(currentSessionToken());
    setUser(mergeLocal(userData));
    setIsLoading(false);
  };

  const clearSession = () => {
    authTokens.clear();
    localStorage.removeItem(COMPLETED_ROLES_KEY);
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const logout = async () => {
    if (authTokens.hasSession()) {
      try {
        // In cookie mode the backend reads the refresh token from the cookie and clears both cookies.
        const refreshToken = authTokens.getRefresh();
        await api.post('/auth/logout', refreshToken ? { refresh_token: refreshToken } : {}, { timeout: 5000 });
      } catch (e) {
        console.warn('Logout request failed', e);
      }
    }
    clearSession();
  };

  const refreshUser = async () => {
    if (!authTokens.hasSession()) {
      setIsLoading(false);
      return;
    }

    try {
      // A 401 here is refreshed by the interceptor; only a rejected refresh surfaces.
      const config: ApiRequestConfig = { _skipAuthRedirect: true };
      const response = await api.get('/auth/me', config);
      if (response.data.success) {
        setUser(mergeLocal(response.data.data));
        setToken(currentSessionToken());
      } else {
        const refreshed = await refreshSession();
        if (refreshed && refreshed !== REFRESH_NETWORK_ERROR) {
          await refreshUser();
        } else if (!refreshed && !user) {
          clearSession();
        }
      }
    } catch (error: any) {
      // The interceptor clears stored auth only when the server rejected the refresh;
      // a refresh that failed on the network leaves the session in place.
      if (error.response?.status === 401 && !authTokens.hasSession()) {
        clearSession();
      } else if (error.response?.status !== 401) {
        console.error('Failed to fetch user:', getApiErrorMessage(error), error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role: string) => {
    try {
      const response = await api.post('/auth/switch-role', { role });
      if (response.data.success) {
        const { user: userData, tokens } = response.data.data;
        const { access_token, refresh_token } = tokens;
        login(access_token, refresh_token, userData);
      }
    } catch (error) {
      console.error('Failed to switch role:', error);
      throw error;
    }
  };

  const markRoleCompleted = async (role: string) => {
    if (user?.id) rememberCompletion(storage(), user.id, role);
    await refreshUser();
    setUser(prev => {
      if (!prev) return prev;
      const roles = prev.roles?.some((r: { role: string }) => r.role === role)
        ? prev.roles.map((r: { role: string; is_completed?: boolean }) => (r.role === role ? { ...r, is_completed: true } : r))
        : [...(prev.roles ?? []), { role, is_completed: true }];
      return { ...prev, active_role: role, roles };
    });
  };

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, switchRole, refreshUser, markRoleCompleted }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
