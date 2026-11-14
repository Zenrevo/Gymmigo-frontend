import api from '../utils/api';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = Record<string, any>;
const unwrap = (res: { data?: Json }) => res.data?.data ?? res.data;

export const profileApi = {
  me: async (): Promise<Json> => unwrap(await api.get('/profile/me')),
  update: async (body: Json): Promise<Json> => unwrap(await api.patch('/profile/me', body)),
  addresses: async (): Promise<Json[]> => {
    const d = unwrap(await api.get('/profile/me/addresses'));
    return Array.isArray(d) ? d : d?.addresses || [];
  },
  addAddress: async (body: Json) => unwrap(await api.post('/profile/me/addresses', body)),
  deleteAddress: async (id: string) => unwrap(await api.delete(`/profile/me/addresses/${id}`)),
  fitness: async (): Promise<Json | null> => unwrap(await api.get('/profile/fitness')) || null,
  saveFitness: async (body: Json) => unwrap(await api.post('/profile/fitness', body)),
  dashboardStats: async (): Promise<Json> => unwrap(await api.get('/memberships/dashboard-stats')) || {},
  memberships: async (): Promise<Json[]> => {
    const d = unwrap(await api.get('/memberships/my'));
    return Array.isArray(d) ? d : d?.memberships || [];
  },
  socialCounts: async (userId: string): Promise<{ followers: number; following: number }> => {
    const d = unwrap(await api.get(`/social/users/${userId}`)) || {};
    return { followers: Number(d.followers_count) || 0, following: Number(d.following_count) || 0 };
  },
  fitnessCard: async (): Promise<Json | null> => unwrap(await api.get('/clubs/fitness-card/me')) || null,
  deleteAccount: async () => unwrap(await api.delete('/auth/account')),
};
