import type {
  GymAddon,
  GymAddress,
  GymAmenity,
  GymEquipment,
  GymFacility,
  GymImage,
  MembershipPlan,
  OperatingHour,
  TimeSlot,
} from './ownerGymShapes';

export type MembershipStatus = 'active' | 'pending' | 'expired' | 'cancelled' | 'suspended' | string;

export type GymMetrics = {
  current_occupancy?: number | null;
  active_members?: number | null;
  monthly_revenue?: number | null;
  workout_distribution?: { workout: string; count: number }[];
};

/** Owner view of a gym (GET /gym-owner/gyms/{id}). */
export type OwnerGym = {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  established_year?: number | null;
  website_url?: string | null;
  city?: string | null;
  state?: string | null;
  max_capacity?: number | null;
  is_24_hours?: boolean;
  show_stats?: boolean;
  is_verified?: boolean;
  is_active?: boolean;
  supplement_partner_enabled?: boolean;
  available_trainers?: number | null;
  trainers?: unknown[];
  body_composition_scan_supported?: boolean;
  metrics?: GymMetrics;
  addresses?: GymAddress[];
  membership_plans?: MembershipPlan[];
  addons?: GymAddon[];
  equipment?: GymEquipment[];
  facilities?: GymFacility[];
  images?: GymImage[];
  amenities?: GymAmenity[];
  operating_hours?: OperatingHour[];
};

/**
 * Legacy screens hedge `data.gym || data` on GET /gym-owner/gyms/{id};
 * use `pickOwnerGym()` from the gymOwner endpoints to normalise.
 */
export type OwnerGymPayload = OwnerGym & { gym?: OwnerGym };

/** Item of GET /gym-owner/gyms */
export type OwnerGymListItem = {
  gym: Pick<OwnerGym, 'id' | 'name' | 'logo_url' | 'description' | 'city' | 'is_verified' | 'is_active' | 'max_capacity'>;
  metrics: GymMetrics;
};

/** POST /gym-owner/gyms */
export type CreateGymBody = {
  name: string;
  description?: string;
  /** "+91" + digits */
  contact_phone?: string;
  contact_email?: string;
  established_year: number | null;
  max_capacity: number;
  city?: string;
  state?: string;
  is_24_hours: boolean;
  logo_url: string | null;
  addresses: GymAddressBody[];
  amenities: { name: string }[];
  facilities: unknown[];
  equipment: unknown[];
};

/** PATCH /gym-owner/gyms/{id}/basic-info */
export type GymBasicInfoBody = {
  name: string;
  description?: string;
  contact_phone?: string;
  contact_email?: string;
  established_year: number | null;
  website_url: string | null;
  is_24_hours: boolean;
  show_stats: boolean;
};

/** POST /gym-owner/gyms/{id}/addresses and PATCH .../addresses/{addressId} */
export type GymAddressBody = {
  address_line1: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  country: string;
  is_primary: boolean;
};

/** PATCH /gym-owner/gyms/{id}/media */
export type GymMediaBody = { logo_url?: string; cover_image_url?: string };

/** GET /gym-owner/gyms/{id}/daily-qr */
export type DailyQr = { qr_payload: string; [key: string]: unknown };

/** GET /gym-owner/gyms/{id}/dashboard-analytics */
export type DashboardAnalytics = {
  revenue?: {
    total?: number;
    mom_growth?: number;
    breakdown?: { type: string; percentage: number; amount: number }[];
  };
  at_risk_members?: { membership_id: string; name: string; issue?: string; phone?: string | null }[];
  footfall?: { count: number; [key: string]: unknown }[];
  member_growth?: unknown;
};

/* ---------------- Members ---------------- */

export type OwnerMembersParams = {
  page_size?: number;
  search?: string;
  status?: 'active' | 'pending' | 'expired' | 'cancelled';
};

/** Item of GET /gym-owner/gyms/{id}/members (read under several alias names). */
export type OwnerMemberListItem = {
  membership_id?: string;
  id?: string;
  user_id: string;
  full_name?: string | null;
  user_name?: string | null;
  avatar_url?: string | null;
  plan_name?: string | null;
  memberships?: { plan_name?: string | null; [key: string]: unknown }[];
  fitness_score?: { today_score?: number; streak?: number } | null;
  active_status?: string | null;
  status?: MembershipStatus | null;
  phone?: string | null;
  user_phone?: string | null;
  is_currently_checked_in?: boolean;
};

/** Legacy reads `data.members` or `data` itself as the array. */
export type OwnerMembersPayload = { members: OwnerMemberListItem[]; total?: number } | OwnerMemberListItem[];

export type OwnerMemberMembership = {
  membership_id: string;
  plan_id?: string | null;
  plan_name?: string | null;
  amount_paid?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status: MembershipStatus;
  payment_method?: string | null;
  remaining_visits?: number | null;
  total_check_ins?: number | null;
  auto_renew?: boolean;
  selected_addons?: Pick<GymAddon, 'id' | 'name' | 'price'>[];
};

/** GET /gym-owner/gyms/{id}/members/{userId} — NOTE: path takes the USER id. */
export type OwnerMemberDetail = {
  user_id: string;
  user_name?: string | null;
  user_phone?: string | null;
  avatar_url?: string | null;
  active_status?: string | null;
  is_currently_checked_in?: boolean;
  total_check_ins?: number | null;
  fitness_score?: {
    today_score?: number;
    streak?: number;
    global_rank?: number | null;
    daily_score?: { coach_nudge?: string | null } | null;
  } | null;
  memberships: OwnerMemberMembership[];
  check_in_history?: {
    id: string;
    check_in_time: string;
    check_out_time?: string | null;
    workout_type?: string | null;
    duration_minutes?: number | null;
    method?: string | null;
  }[];
};

/** POST /gym-owner/gyms/{id}/members/enroll */
export type EnrollMemberBody = {
  /** "+91XXXXXXXXXX" */
  phone: string;
  full_name: string;
  plan_id: string;
  /** lowercase, e.g. "cash" */
  payment_method: string;
  amount_paid?: number;
  /** YYYY-MM-DD */
  start_date: string;
  /** Full addon objects, as legacy sent them. */
  selected_addons: GymAddon[];
};

/** PATCH /gym-owner/gyms/{id}/members/{membershipId} — NOTE: path takes the MEMBERSHIP id. */
export type UpdateMembershipBody = {
  full_name?: string;
  plan_id?: string;
  start_date?: string;
  end_date?: string;
  status?: 'active' | 'pending' | 'expired' | 'cancelled' | 'suspended';
  auto_renew?: boolean;
  selected_addons?: Pick<GymAddon, 'id' | 'name' | 'price'>[];
  amount_paid?: number;
  payment_method?: string;
  remaining_visits?: number;
  total_check_ins?: number;
};

export type ImportRowResult = {
  row: number;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  status: string;
  phone?: string | null;
  full_name?: string | null;
  membership_id?: string | null;
  message: string;
};

/** POST /gym-owner/gyms/{id}/members/import → data */
export type MembersImportSummary = {
  total_rows: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  results: ImportRowResult[];
};

export type MembersExportParams = { status?: string; search?: string };

/* ---------------- Managers ---------------- */

export type GymManager = { user_id: string; name?: string | null; email?: string | null; is_active?: boolean; avatar?: string | null };

/** POST /gym-owner/gyms/{id}/managers — phone "+91XXXXXXXXXX", email may be ''. */
export type AddManagerBody = { name: string; phone: string; email: string };

/* ---------------- Finance ---------------- */

/** GET /gym-owner/gyms/{id}/finance/summary?month=YYYY-MM */
export type FinanceSummary = { revenue: number; expenses: number; profit: number; [key: string]: unknown };

export type InvoiceStatus = 'paid' | 'canceled' | 'pending' | string;

export type Invoice = {
  id: string;
  invoice_number?: string | null;
  member_name?: string | null;
  amount: number;
  status: InvoiceStatus;
  created_at?: string | null;
};

export type InvoiceItem = { description: string; quantity: number; rate: number; amount: number };

/** POST /gym-owner/gyms/{id}/invoices — member_id is the USER id. */
export type CreateInvoiceBody = { member_id: string; notes?: string; amount: number; items: InvoiceItem[] };

export type ExpenseCategory = 'rent' | 'salary' | 'electricity' | 'maintenance' | 'marketing' | 'other';

export type Expense = { id: string; category: ExpenseCategory | string; description?: string | null; amount: number; expense_date: string };

export type ExpenseBody = { category: ExpenseCategory; amount: number; description?: string; expense_date: string };

export type Product = { id: string; name: string; price: number; category: 'service' | 'retail' | string };

export type ProductBody = { name: string; price: number; category: 'service' | 'retail' };

/* ---------------- Catalogue ---------------- */

/** POST /gym-owner/gyms/{id}/plans and PATCH .../plans/{planId} */
export type PlanBody = {
  name: string;
  /** Duplicate of `name`, legacy sends both. */
  plan_name: string;
  price: number;
  discounted_price: number | null;
  entry_fee: number;
  duration_days: number;
  duration_type: 'day' | 'week' | 'month' | 'quarter' | 'half_year' | 'year';
  description?: string;
  slot_name?: string;
  is_popular: boolean;
  benefits: string[];
  access_time_slots: TimeSlot[];
  access_start_time?: string;
  access_end_time?: string;
};

/** POST /gym-owner/gyms/{id}/addons and PATCH .../addons/{addonId} */
export type AddonBody = { name: string; description?: string; price: number; duration_type: string };

export type EquipmentBody = { name: string; brand?: string; quantity: number; category?: string };

export type FacilityBody = { name: string; description?: string; quantity: number; is_included: boolean };

/** POST /gym-owner/gyms/{id}/images (legacy: one call per image, sequential). */
export type GymImageBody = { image_url: string; caption?: string; is_primary?: boolean };

/** POST /gym-owner/gyms/{id}/hours — day_of_week 0=Mon … 6=Sun, times 'HH:mm'. */
export type OperatingHoursBody = { day_of_week: number; open_time: string; close_time: string; is_closed: boolean };

/** POST /gym-owner/gyms/{id}/busy-hours */
export type BusyHoursBody = { day: string; hour: number; occupancy_percentage: number };
