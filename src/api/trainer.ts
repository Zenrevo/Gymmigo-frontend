import api from '../utils/api';
import type { ApiEnvelope } from './owner';
import type {
  CreateCertificationBody,
  CreatePackageBody,
  MyBookings,
  MySessions,
  SetAvailabilityBody,
  TrainerCertification,
  TrainerDashboard,
  TrainerFull,
  TrainerPackage,
  TrainerReviews,
  UpdateTrainerBody,
} from '../types/trainer';

/** The signed-in trainer's own profile (/trainer/*) and the trainer side of bookings. Returns raw axios responses. */
export const trainerApi = {
  profile: () => api.get<ApiEnvelope<Record<string, unknown>>>('/trainer'),
  dashboard: () => api.get<ApiEnvelope<TrainerDashboard>>('/trainer/dashboard'),
  full: () => api.get<ApiEnvelope<TrainerFull>>('/trainer/full'),
  update: (body: UpdateTrainerBody | Record<string, unknown>) => api.patch<ApiEnvelope<unknown>>('/trainer', body),
  toggleAvailability: () => api.patch<ApiEnvelope<unknown>>('/trainer/toggle-availability'),
  createPackage: (body: CreatePackageBody | Record<string, unknown>) => api.post<ApiEnvelope<TrainerPackage>>('/trainer/packages', body),
  /** One weekday per call (0=Mon…6=Sun). */
  setAvailability: (body: SetAvailabilityBody | Record<string, unknown>) => api.post<ApiEnvelope<unknown>>('/trainer/availability', body),
  createCertification: (body: CreateCertificationBody | Record<string, unknown>) =>
    api.post<ApiEnvelope<TrainerCertification>>('/trainer/certifications', body),
  gallery: () => api.get<ApiEnvelope<unknown>>('/trainer/gallery'),
  addGalleryImage: (body: Record<string, unknown>) => api.post<ApiEnvelope<unknown>>('/trainer/gallery', body),
  deleteGalleryImage: (imageId: string) => api.delete<ApiEnvelope<unknown>>(`/trainer/gallery/${imageId}`),
};

export const trainerBookingsApi = {
  myBookings: (role: 'user' | 'trainer') => api.get<ApiEnvelope<MyBookings>>('/trainer-bookings/bookings/my', { params: { role } }),
  mySessions: (params: { role?: 'user' | 'trainer'; trainer_id?: string }) =>
    api.get<ApiEnvelope<MySessions>>('/trainer-bookings/sessions/my', { params }),
  /** `action` is accept | reject (trainer) or cancel (member). */
  sessionAction: (sessionId: string, action: 'accept' | 'reject' | 'cancel' | string) =>
    api.post<ApiEnvelope<unknown>>(`/trainer-bookings/sessions/${sessionId}/${action}`),
  scheduleSession: (bookingId: string, body: Record<string, unknown>) =>
    api.post<ApiEnvelope<unknown>>(`/trainer-bookings/bookings/${bookingId}/schedule-session`, body),
  trainerReviews: (trainerId: string) => api.get<ApiEnvelope<TrainerReviews>>(`/trainer-bookings/reviews/${trainerId}`),
  availableSlots: (trainerId: string, date: string) =>
    api.get<ApiEnvelope<unknown>>(`/trainers/${trainerId}/available-slots`, { params: { date } }),
};
