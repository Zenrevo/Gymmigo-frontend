import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { getApiErrorMessage } from '../utils/api';

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
  token: string | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  switchRole: (role: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(true);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setToken(accessToken);
    setUser(userData);
    setIsLoading(false);
  };

  const attemptTokenRefresh = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    try {
      const response = await api.post('/auth/refresh-token', { 
        refresh_token: refreshToken 
      }, { timeout: 15000 });
      
      if (response.data.success) {
        const { access_token } = response.data.data;
        localStorage.setItem('access_token', access_token);
        setToken(access_token);
        return access_token;
      }
    } catch (error: any) {
      console.error('Failed to refresh token:', error);
      return null;
    }
    return null;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refresh_token: refreshToken }, { timeout: 5000 });
      } catch (e) {
        console.warn('Logout request failed', e);
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const refreshUser = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        // If /me fails with success=false, try a refresh first before giving up
        const newToken = await attemptTokenRefresh();
        if (newToken) {
          await refreshUser();
        } else {
          if (!user) logout();
        }
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        const newToken = await attemptTokenRefresh();
        if (newToken) {
          await refreshUser();
        } else {
          if (!user) logout();
        }
      } else {
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

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, switchRole, refreshUser }}>
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
