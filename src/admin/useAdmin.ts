import { createContext, useContext } from 'react';
import type { AdminProfile, Session } from './api';

export type Ctx = {
  admin: AdminProfile | null;
  loading: boolean;
  can: (perm: string) => boolean;
  startSession: (s: Session) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AdminAuthContext = createContext<Ctx | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminAuthProvider');
  return ctx;
}
