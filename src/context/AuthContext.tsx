import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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

// Axios Global Configuration
axios.defaults.timeout = 10000; // 10 second global timeout

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setToken(accessToken);
    setUser(userData);
    setIsLoading(false); // Crucial: manual login satisfies the loading state
  };

  const logout = () => {
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
      const response = await axios.get(`${API_URL}/auth/me`, { timeout: 10000 });
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        // Only logout if we don't have a user state already (prevent race condition with login)
        if (!user) logout();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      if (!user) logout();
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/switch-role`, { role }, { timeout: 10000 });
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

    // Response interceptor for 401 (Unauthorized)
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('Unauthorized request. Logging out...');
          logout();
          window.location.href = '/'; // Simple redirect to root/login
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
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
