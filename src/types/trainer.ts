/** Trainer self-management (/trainer/*), public trainer profiles (/trainers/*) and bookings (/trainer-bookings/*). */

export type SessionType = 'gym' | 'online' | 'home' | 'offline' | string;

export type TrainerPackage = {
  id: string;
  name: string;
  package_type?: string | null;
  total_sessions: number;
  session_duration_mins?: number | null;
  validity_days?: number | null;
  price: number;
  discounted_price?: number | null;
  description?: string | null;
  includes_diet_plan?: boolean;
  includes_progress_tracking?: boolean;
  allows_rescheduling?: boolean;
  is_popular?: boolean;
};

export type TrainerCertification = {
  id: string;
  name: string;
  issued_by?: string | null;
  certificate_url?: string | null;
  is_verified?: boolean;
};

/** day_of_week: 0 = Monday … 6 = Sunday. */
export type TrainerAvailability = {
  day_of_week: number;
  is_available: boolean;
  start_time?: string | null;
  end_time?: string | null;
  session_type?: 'online' | 'offline' | 'both' | string;
};

/* ---------------- /trainer (own profile) ---------------- */

export type TrainerDashboardStats = {
  is_available?: boolean;
  verification_status?: string | null;
  today_earnings?: number;
  this_month_earnings?: number;
  rating_avg?: number | null;
  total_clients?: number;
  total_sessions?: number;
  completion_rate?: number;
  completed_today?: number;
  remaining_today?: number;
};

/** GET /trainer/dashboard */
export type TrainerDashboard = {
  stats: TrainerDashboardStats;
  pending_bookings?: {
    id: string;
    client_name?: string;
    client_avatar?: string | null;
    package_name?: string | null;
    total_sessions?: number;
    total_amount?: number;
    session_type?: SessionType;
    start_date?: string | null;
    location?: string | null;
    user_notes?: string | null;
    created_at?: string | null;
  }[];
  confirmed_bookings?: {
    id: string;
    client_name?: string;
    package_name?: string | null;
    sessions_completed?: number;
    total_sessions?: number;
    location?: string | null;
  }[];
  today_sessions?: {
    id: string;
    user_id?: string;
    client_name?: string;
    client_avatar?: string | null;
    status: string;
    scheduled_time?: string;
    duration_minutes?: number;
    session_type?: SessionType;
    location?: string | null;
  }[];
  upcoming_sessions?: {
    id: string;
    client_name?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    duration_minutes?: number;
    session_type?: SessionType;
    status: string;
  }[];
};

/** GET /trainer/full */
export type TrainerFull = {
  profile: {
    hourly_rate?: number | null;
    monthly_charges?: number | null;
    single_session_charges?: number | null;
    session_duration_mins?: number | null;
    is_available_online?: boolean;
    is_available_offline?: boolean;
    accepts_home_visits?: boolean;
    [key: string]: unknown;
  };
  packages: TrainerPackage[];
  availability: TrainerAvailability[];
  certifications: TrainerCertification[];
};

/** PATCH /trainer */
export type UpdateTrainerBody = {
  hourly_rate?: number;
  monthly_charges?: number;
  single_session_charges?: number;
  session_duration_mins?: number;
  is_available_online: boolean;
  is_available_offline: boolean;
  accepts_home_visits: boolean;
};

/** POST /trainer/packages (errors carry `detail`). */
export type CreatePackageBody = {
  name: string;
  package_type: 'single' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  total_sessions: number;
  session_duration_mins: number;
  validity_days: number;
  price: number;
  discounted_price?: number;
  description?: string;
  includes_diet_plan: boolean;
  includes_progress_tracking: boolean;
  allows_rescheduling: boolean;
};

/** POST /trainer/availability — slots=[] when unavailable. */
export type SetAvailabilityBody = {
  day_of_week: number;
  is_available: boolean;
  session_type: 'online' | 'offline' | 'both';
  slots: { start_time: string; end_time: string }[];
};

/** POST /trainer/certifications */
export type CreateCertificationBody = { name: string; issued_by: string; certificate_url: string | null };

/** POST /trainer/profile/create */
export type CreateTrainerProfileBody = { full_name: string; bio: string; experience_years: number; expertises: string[] };

/* ---------------- /trainers (public) ---------------- */

/** Item of GET /trainers/ `results[]` (body is not enveloped). */
export type TrainerSearchItem = {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  location?: string | null;
  specializations?: string[];
  hourly_rate?: number | null;
  rating_avg?: number | null;
  distance?: number | null;
};

export type TrainerSearchParams = {
  search?: string;
  page_size?: number;
  sort_by?: 'distance' | 'rating';
  specialization?: string;
  lat?: number;
  lng?: number;
  radius?: number;
};

/** GET /trainers/{id} (root body, not enveloped). */
export type TrainerPublicProfile = {
  id?: string;
  full_name: string;
  avatar_url?: string | null;
  verification_status?: string | null;
  rating_avg?: number | null;
  experience_years?: number | null;
  experience_level?: string | null;
  is_available_online?: boolean;
  accepts_home_visits?: boolean;
  specializations?: string[];
  bio?: string | null;
  single_session_charges?: number | null;
  hourly_rate?: number | null;
  monthly_charges?: number | null;
  languages_spoken?: string[];
  primary_gym_name?: string | null;
  certifications?: TrainerCertification[];
  packages?: TrainerPackage[];
  availability?: TrainerAvailability[];
  gallery?: { id: string; image_url: string }[];
  [key: string]: unknown;
};

/** GET /trainers/{id}/available-slots?date=yyyy-MM-dd (root body, not enveloped). */
export type AvailableSlots = { slots: { start_time: string; is_booked: boolean; end_time?: string }[]; [key: string]: unknown };

/* ---------------- /trainer-bookings ---------------- */

export type BookingRole = 'user' | 'trainer';

export type TrainerBooking = {
  id: string;
  trainer_id?: string;
  trainer_name?: string | null;
  trainer_phone?: string | null;
  user_id?: string;
  user_name?: string | null;
  user_phone?: string | null;
  package_name?: string | null;
  session_type?: SessionType;
  status: string;
  sessions_remaining?: number;
  sessions_completed?: number;
  total_sessions?: number;
  total_amount?: number;
  start_date?: string | null;
  end_date?: string | null;
  scheduled_time?: string | null;
  location?: string | null;
  user_notes?: string | null;
};

/** GET /trainer-bookings/bookings/my?role=user|trainer[&status=confirmed] */
export type MyBookingsParams = { role: BookingRole; status?: string };

export type MyBookings = { bookings: TrainerBooking[] };

export type TrainerSession = {
  id: string;
  user_id?: string;
  user_name?: string | null;
  user_phone?: string | null;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number;
  session_type?: SessionType;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  trainer_notes?: string | null;
};

/** GET /trainer-bookings/sessions/my — member passes `trainer_id`, trainer passes `role=trainer`. */
export type MySessionsParams = { trainer_id?: string; role?: BookingRole };

export type MySessions = { sessions: TrainerSession[] };

/** GET /trainer-bookings/sessions/{id} */
export type SessionDetail = {
  trainer_user_id?: string;
  user_name?: string | null;
  trainer_name?: string | null;
  user_phone?: string | null;
  trainer_phone?: string | null;
  user_avatar?: string | null;
  trainer_avatar?: string | null;
  status: string;
  session_type?: SessionType;
  package_name?: string | null;
  scheduled_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
};

export type TrainerReview = {
  id: string;
  avatar_url?: string | null;
  user_name?: string | null;
  is_verified_client?: boolean;
  rating: number;
  created_at?: string | null;
  title?: string | null;
  review?: string | null;
  trainer_response?: string | null;
};

/** GET /trainer-bookings/reviews/{trainerId} */
export type TrainerReviews = { reviews: TrainerReview[]; total?: number; avg_rating?: number | null };

/** POST /trainer-bookings/bookings → data.booking_id */
export type CreateBookingBody = { trainer_id: string; package_id: string | null; start_date: string; user_notes?: string };

export type CreateBookingResult = { booking_id: string; [key: string]: unknown };

/** POST /trainer-bookings/bookings/{bookingId}/schedule-session */
export type ScheduleSessionBody = {
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  session_type: 'gym' | 'online' | 'home';
  location?: string;
  latitude?: number;
  longitude?: number;
  user_notes?: string;
};
