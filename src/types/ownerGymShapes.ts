/** Shared gym catalogue shapes (public /gyms/* and the owner /gym-owner/gyms/{id} payload). */

export type TimeSlot = { start: string; end: string };

export type GymAddon = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_type?: string | null;
  is_active?: boolean;
};

export type MembershipPlan = {
  id: string;
  name?: string | null;
  /** Legacy alias of `name` (owner screens send both). */
  plan_name?: string | null;
  slot_name?: string | null;
  description?: string | null;
  price: number;
  discounted_price?: number | null;
  entry_fee?: number | null;
  duration_days?: number | null;
  duration_type?: string | null;
  is_popular?: boolean;
  benefits?: string[];
  access_time_slots?: TimeSlot[];
  access_start_time?: string | null;
  access_end_time?: string | null;
  addons?: GymAddon[];
};

export type GymEquipment = {
  id: string;
  name?: string | null;
  /** Some payloads use `title` instead of `name`. */
  title?: string | null;
  brand?: string | null;
  category?: string | null;
  quantity?: number | null;
};

export type GymFacility = {
  id: string;
  name: string;
  description?: string | null;
  quantity?: number | null;
  is_included?: boolean;
};

/** Images are read as `image_url` or `url`. */
export type GymImage = { id: string; image_url?: string | null; url?: string | null; is_primary?: boolean; caption?: string | null };

export type GymAmenity = { id: string; name: string };

export type GymAddress = {
  id?: string;
  address_line1?: string | null;
  landmark?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_primary?: boolean;
};

export type OperatingHour = { day_of_week: number; open_time?: string | null; close_time?: string | null; is_closed?: boolean };

/** Amenities arrive either as objects or plain strings on the public detail. */
export type AmenityLike = GymAmenity | string;

/** GET /gyms/{id} — legacy read the root object (`res.data`); membership detail hedged `data.data || data`. */
export type GymDetail = {
  id?: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  gym_logo_url?: string | null;
  cover_image_url?: string | null;
  images?: GymImage[];
  membership_plans?: MembershipPlan[];
  amenities?: AmenityLike[];
  facilities?: GymFacility[];
  equipment?: GymEquipment[];
  addresses?: GymAddress[];
  current_occupancy?: number | null;
  max_capacity?: number | null;
  contact_phone?: string | null;
  is_24_hours?: boolean;
  is_verified?: boolean;
  is_new_member?: boolean;
  rating_avg?: number | null;
  rating_count?: number | null;
  can_review?: boolean;
  [key: string]: unknown;
};

/** Item of GET /gyms/ `results[]` (body is not enveloped). */
export type GymSearchItem = {
  id: string;
  name: string;
  cover_image_url?: string | null;
  logo_url?: string | null;
  /** km */
  distance?: number | null;
  rating_avg?: number | null;
  address_line1?: string | null;
  city?: string | null;
  starting_price?: number | null;
  starting_price_duration?: string | null;
  /** Present when the backend includes coordinates; used for map pins only. */
  latitude?: number | string | null;
  longitude?: number | string | null;
};

/** Query of GET /gyms/ — category filters are appended into `search` by the caller. */
export type GymSearchParams = {
  search?: string;
  page_size?: number;
  sort_by?: 'distance' | 'rating';
  lat?: number;
  lng?: number;
  /** km, near-me mode only */
  radius?: number;
};

export type SearchResults<T> = { results: T[]; total?: number; [key: string]: unknown };

/**
 * GET /gyms/{id}/workout-stats (root body, not enveloped).
 * hourly_distribution[DayName] = { "<range>": count, ..., best_time }.
 */
export type WorkoutStats = {
  hourly_distribution?: Record<string, Record<string, number | string | null>>;
  weekly_stats?: Record<string, number>;
  best_time_today?: string | null;
};
