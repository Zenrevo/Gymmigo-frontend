import api from '../utils/api';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = Record<string, any>;
const unwrap = (res: { data?: Json }) => res.data?.data ?? res.data;

export type DiscoveryParams = {
  search?: string;
  page_size?: number;
  sort_by?: 'distance' | 'rating';
  specialization?: string;
  lat?: number;
  lng?: number;
  radius?: number;
};

export const discoveryApi = {
  list: async (kind: 'gyms' | 'trainers', params: DiscoveryParams): Promise<Json[]> => {
    const res = await api.get(`/${kind}/`, { params });
    return res.data?.data?.results || res.data?.results || [];
  },
  gym: async (id: string) => unwrap(await api.get(`/gyms/${id}`)),
  gymWorkoutStats: async (id: string) => unwrap(await api.get(`/gyms/${id}/workout-stats`)),
  gymReviews: async (id: string) => unwrap(await api.get(`/memberships/reviews/${id}`)),
  postGymReview: async (body: { gym_id: string; rating: number; title?: string; review?: string }) =>
    unwrap(await api.post('/memberships/reviews', body)),
  applyCart: async (body: { gym_id: string; plans: { plan_id: string; selected_addons: string[] }[]; payment_method: string }) =>
    unwrap(await api.post('/memberships/apply-cart', body)),
  trainer: async (id: string) => unwrap(await api.get(`/trainers/${id}`)),
  trainerReviews: async (id: string) => unwrap(await api.get(`/trainer-bookings/reviews/${id}`)),
  bookTrainer: async (body: { trainer_id: string; package_id: string; start_date: string; user_notes?: string }) =>
    unwrap(await api.post('/trainer-bookings/bookings', body)),
  session: async (id: string) => unwrap(await api.get(`/trainer-bookings/sessions/${id}`)),
  cancelSession: async (id: string) => unwrap(await api.post(`/trainer-bookings/sessions/${id}/cancel`)),
};
