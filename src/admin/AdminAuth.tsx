import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGet, adminPost, adminToken, setUnauthorizedHandler, type AdminProfile, type Session } from './api';
import { AdminAuthContext, type Ctx } from './useAdmin';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(() => !!adminToken.get());

  const refresh = useCallback(async () => {
    if (!adminToken.get()) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      setAdmin(await adminGet<AdminProfile>('/auth/me'));
    } catch {
      adminToken.set(null);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAdmin(null);
      navigate('/admin/login', { replace: true, state: { expired: true } });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  const startSession = useCallback((s: Session) => {
    adminToken.set(s.access_token);
    setAdmin(s.admin);
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminPost('/auth/logout');
    } catch {
      /* already signed out */
    }
    adminToken.set(null);
    setAdmin(null);
    navigate('/admin/login', { replace: true });
  }, [navigate]);

  const value = useMemo<Ctx>(
    () => ({ admin, loading, can: p => !!admin?.permissions.includes(p), startSession, refresh, logout }),
    [admin, loading, startSession, refresh, logout],
  );
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
