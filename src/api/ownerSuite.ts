import api from '../utils/api';

/** Gym owner suite: billing, reminders, POS, club budget, trainers & PT, analytics (/gym-owner/gyms/{id}/…). */
export type PayMethod = 'cash' | 'upi' | 'card' | 'bank';
export type Invoice = {
  id: string; invoice_number: string; member_id: string | null; member_name: string | null; status: string; created_at: string | null; due_date: string | null;
  amount: number; subtotal: number; discount_amount: number; tax_amount: number; cgst: number; sgst: number; igst: number; gst_rate: number | null; gstin: string | null;
  total_amount: number; amount_paid: number; balance_due: number; coins_applied: number; source: string; customer_name: string | null; payment_method: string | null;
  items: { description: string; quantity: number; rate: number; amount: number; gst_rate?: number | null; hsn?: string | null }[];
  payments?: { id: string; amount: number; method: string; reference: string | null; paid_at: string | null }[];
  share_url?: string | null;
};
export type Product = { id: string; name: string; price: number; category: string; gst_rate: number | null; hsn: string | null; track_stock: boolean; stock_qty: number; low_stock_at: number; low_stock: boolean; is_active: boolean };

export type BillingSettings = {
  legal_name: string | null;
  gstin: string | null;
  gst_rate: number | null;
  prices_include_gst: boolean;
  state_code: string | null;
  invoice_prefix: string | null;
  terms: string | null;
  upi_id: string | null;
  default_due_days: number;
  gst_enabled: boolean;
  next_number_preview: string;
};

export type Totals = { subtotal: number; discount: number; taxable: number; cgst: number; sgst: number; igst: number; tax: number; total: number; gst_rate: number | null; prices_include_gst: boolean };

export type DueItem = {
  kind: 'invoice' | 'membership';
  invoice_id: string | null;
  invoice_number: string | null;
  member_id: string | null;
  name: string | null;
  phone: string | null;
  total: number;
  paid: number;
  balance: number;
  due_date: string | null;
  status: string;
  days_overdue: number;
  membership_id: string | null;
};
export type Dues = { total_due: number; overdue: number; count: number; items: DueItem[] };

export type ReminderSettings = {
  enabled: boolean;
  expiry_days: number[];
  on_due_date: boolean;
  overdue_every_days: number;
  overdue_max: number;
  push: boolean;
  whatsapp: boolean;
  auto_renew_invoice: boolean;
  owner_digest: boolean;
  whatsapp_configured: boolean;
};
export type ReminderLogRow = { id: string; kind: string; member: string | null; user_id: string | null; title: string | null; body: string | null; channels: string[]; status: string; at: string | null };

export type PosMember = { user_id: string; name: string | null; phone: string; coins: number; coin_cap_pct: number };
export type SaleBody = {
  lines: { product_id: string; quantity: number }[];
  member_id?: string;
  customer_name?: string;
  discount?: number;
  coins?: number;
  payments?: { method: PayMethod; amount: number; reference?: string }[];
};
export type DayReport = {
  day: string;
  sales: number;
  total: number;
  gst: number;
  by_method: Record<string, number>;
  top_items: { name: string; qty: number; amount: number }[];
  invoices: { id: string; invoice_number: string; total: number; status: string; customer: string | null; member_id: string | null; items: number; at: string | null }[];
};

export type ClubProgram = {
  gym_id: string;
  monthly_reward_budget_inr: number | null;
  budget_alerts: number[];
  no_cash_cost_only: boolean;
  gym_coins_enabled: boolean;
  owner_locked: boolean;
  template_limits: { cashback_pct: Record<string, number>; coin_ceilings: Record<string, number>; coin_invoice_cap_pct: number };
};
export type PlannedReward = {
  min_level: number;
  name: string;
  reward_type: string;
  discount_pct: number | null;
  est_cost_inr: number;
  member_value_inr: number | null;
  eligible_members: number;
  expected_claims: number;
  expected_cost_inr: number;
  monthly_budget_inr: number | null;
  quantity_per_month: number | null;
  planned_cost_inr: number;
  example?: string;
};
export type RewardPlan = {
  budget_inr: number;
  expected_cost_inr: number;
  planned_cost_inr: number;
  fits: boolean;
  scaled_to_pct: number;
  uptake_assumed_pct: number;
  avg_plan_price_inr: number;
  members_counted: number;
  rewards: PlannedReward[];
  created?: number;
};

export type GymTrainer = {
  affiliation_id: string;
  trainer_id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: 'pending' | 'accepted' | string;
  role: string;
  commission_pct: number | null;
  monthly_fee: number | null;
  since: string | null;
  rating: number | null;
  rating_count: number;
  experience_years: number | null;
  session_rate: number | null;
  active_clients: number;
  sessions_this_month: number;
  pt_revenue_this_month: number;
  commission_this_month: number;
};
export type PtAllocation = {
  id: string;
  member_id: string;
  member: string | null;
  trainer_id: string;
  trainer: string | null;
  sessions_total: number;
  sessions_used: number;
  sessions_left: number;
  start_date: string;
  end_date: string | null;
  status: string;
  price: number;
  paid: number;
  balance_due: number;
  invoice_id: string | null;
  invoice_number: string | null;
  notes: string | null;
};
export type PendingPt = { member_id: string; member: string | null; membership_id: string; plan: string; sessions_included: number; ends: string | null };
export type Payouts = { month: string; total_payout: number; trainers: { trainer_id: string; name: string | null; sessions: number; pt_collected: number; commission_pct: number; monthly_fee: number; payout: number }[] };
export type GymInvitation = { affiliation_id: string; gym_id: string; gym_name: string; gym_logo: string | null; status: string; role: string; commission_pct: number | null; monthly_fee: number | null; message: string | null; since: string | null };

export type Point = { date: string; value: number };
export type AnalyticsRange = '7d' | '30d' | '90d' | '180d' | '12m';
export type GymAnalytics = {
  range: AnalyticsRange;
  from: string;
  to: string;
  bucket: 'day' | 'week';
  revenue: { collected: number; by_source: Record<string, number>; series: Point[]; dues: number; overdue: number; expenses: number; profit: number };
  members: { active: number; new: number; renewals: number; churned: number; churn_rate_pct: number | null; cohorts: { month: string; joined: number; still_active: number; retention_pct: number | null }[] };
  attendance: { check_ins: number; unique_visitors: number; avg_visits_per_active: number | null; avg_minutes: number | null; series: Point[]; by_hour: { hour: number; value: number }[]; by_weekday: { day: string; value: number }[] };
  clubs: { members_by_level: { level: number; members: number }[]; avg_gcpi: number | null; missions_issued: number; missions_done: number; mission_completion_pct: number | null };
  pt: { active_allocations: number; sessions_sold: number; sessions_used: number; utilisation_pct: number | null; sessions_in_range: number };
  top_products: { name: string; amount: number; qty: number }[];
};

export type TrainingSession = { date: string | null; source: string; label: string; minutes?: number | null; km?: number | null; status?: string; note?: string | null };
export type MemberAnalytics = {
  range: AnalyticsRange;
  from: string;
  member: { user_id: string; name: string | null; phone: string | null; avatar_url: string | null; member_since: string | null; status: string };
  kpis: {
    visits_in_range: number;
    visits_per_week: number;
    streak_weeks: number;
    last_visit: string | null;
    days_since_visit: number | null;
    avg_minutes: number | null;
    preferred_hour: number | null;
    lifetime_value: number;
    dues: number;
    days_left: number | null;
    churn_risk: { score: number; level: string; action: string | null } | null;
  };
  attendance: { series: Point[]; by_hour: { hour: number; value: number }[]; recent: { at: string; minutes: number | null }[] };
  memberships: { id: string; start: string | null; end: string | null; status: string; amount: number; payment_status: string; auto_renew: boolean }[];
  invoices: { id: string; invoice_number: string; date: string | null; total: number; paid: number; balance: number; status: string; source: string }[];
  club: {
    level: number;
    level_name: string;
    active_cp: number;
    lifetime_cp: number;
    gcpi: number | null;
    dimensions: Record<string, { name?: string; score?: number | null } | number> | null;
    multiplier: number;
    multiplier_label: string | null;
    streak_weeks: number;
    review_status: string | null;
    retention_stage: string | null;
    missions_issued: number;
    missions_done: number;
    coins: number;
    claims: { code: string; status: string; at: string | null }[];
  };
  pt: PtAllocation[];
  training_shared: boolean;
  sharing_decided: boolean;
  training: null | {
    workouts: { total: number; by_source: Record<string, number>; recent: TrainingSession[] };
    runs: { count: number; km: number; minutes: number };
    health: { synced_days: number; avg_steps: number | null; avg_sleep_h: number | null; avg_resting_hr: number | null; weight_kg: number | null; weight_change_kg: number | null };
    diet: { plans?: { date: string | null; title: string | null; followed: boolean; kcal?: number | null }[]; followed?: string | null } | null;
  };
};
export type TimelineEvent = { at: string; type: 'check_in' | 'payment' | 'invoice' | 'membership' | 'mission' | 'reminder' | 'note' | 'pt_session' | string; title: string; detail: string | null };
export type MemberNote = { id: string; body: string; pinned: boolean; author: string | null; at: string | null };


/* ─── API client (GET/POST/PATCH/DELETE return the envelope's data) ─── */

const g = (id: string) => `/gym-owner/gyms/${id}`;
const get = <T,>(url: string, params?: Record<string, unknown>) => api.get(url, { params }).then(r => r.data.data as T);
const post = <T,>(url: string, body?: unknown) => api.post(url, body).then(r => r.data.data as T);
const patch = <T,>(url: string, body?: unknown) => api.patch(url, body).then(r => r.data.data as T);

export const ownerSuite = {
  billingSettings: (id: string) => get<BillingSettings>(`${g(id)}/billing/settings`),
  saveBillingSettings: (id: string, body: Partial<BillingSettings>) => patch<BillingSettings>(`${g(id)}/billing/settings`, body),
  previewTotals: (id: string, body: { items: { description: string; quantity: number; rate: number; gst_rate?: number | null }[]; discount?: number }) => post<Totals>(`${g(id)}/billing/preview`, body),
  dues: (id: string) => get<Dues>(`${g(id)}/billing/dues`),
  invoice: (id: string, inv: string) => get<Invoice>(`${g(id)}/invoices/${inv}`),
  invoices: (id: string) => get<Invoice[]>(`${g(id)}/invoices`),
  createInvoice: (id: string, body: Record<string, unknown>) => post<Invoice>(`${g(id)}/invoices`, body),
  addPayment: (id: string, inv: string, body: { amount: number; method: PayMethod; reference?: string }) => post<Invoice>(`${g(id)}/invoices/${inv}/payments`, body),
  reminderSettings: (id: string) => get<ReminderSettings>(`${g(id)}/reminders/settings`),
  saveReminderSettings: (id: string, body: Partial<ReminderSettings>) => patch<ReminderSettings>(`${g(id)}/reminders/settings`, body),
  reminderLog: (id: string) => get<ReminderLogRow[]>(`${g(id)}/reminders/log`),
  remind: (id: string, uid: string, body: { kind: 'dues' | 'expiry' | 'custom'; message?: string }) => post<{ sent: unknown[] }>(`${g(id)}/members/${uid}/remind`, body),
  broadcast: (id: string, body: { audience: string; title: string; body: string }) => post<{ members: number; delivered: number }>(`${g(id)}/broadcast`, body),
  products: (id: string) => get<Product[]>(`${g(id)}/products`),
  saveProduct: (id: string, body: Record<string, unknown>, pid?: string) => (pid ? patch<Product>(`${g(id)}/products/${pid}`, body) : post<Product>(`${g(id)}/products`, body)),
  posMember: (id: string, phone: string) => get<PosMember>(`${g(id)}/pos/member`, { phone }),
  sale: (id: string, body: SaleBody) => post<Invoice>(`${g(id)}/pos/sales`, body),
  sales: (id: string, day?: string) => get<DayReport>(`${g(id)}/pos/sales`, day ? { day } : undefined),
  stock: (id: string, pid: string, body: { delta: number; reason: 'purchase' | 'adjust' | 'return'; note?: string }) => post<{ stock_qty: number }>(`${g(id)}/products/${pid}/stock`, body),
  program: (id: string) => get<ClubProgram>(`${g(id)}/clubs/program`),
  saveProgram: (id: string, body: Partial<ClubProgram>) => patch<ClubProgram>(`${g(id)}/clubs/program`, body),
  planRewards: (id: string, body: { budget_inr: number; apply?: boolean; overrides?: Record<string, unknown>[] }) => post<RewardPlan>(`${g(id)}/clubs/plan`, body),
  deleteReward: (id: string, rid: string) => api.delete(`${g(id)}/clubs/rewards/${rid}`),
  trainers: (id: string) => get<GymTrainer[]>(`${g(id)}/trainers`),
  inviteTrainer: (id: string, body: { phone: string; commission_pct?: number; monthly_fee?: number; message?: string }) => post(`${g(id)}/trainers/invite`, body),
  updateTrainer: (id: string, aff: string, body: { commission_pct?: number; monthly_fee?: number; end?: boolean }) => patch(`${g(id)}/trainers/${aff}`, body),
  payouts: (id: string) => get<Payouts>(`${g(id)}/trainers-payouts`),
  pt: (id: string, params?: Record<string, string>) => get<PtAllocation[]>(`${g(id)}/pt`, params),
  pendingPt: (id: string) => get<PendingPt[]>(`${g(id)}/pt/pending`),
  assignPt: (id: string, body: Record<string, unknown>) => post<PtAllocation>(`${g(id)}/pt`, body),
  updatePt: (id: string, b: string, body: Record<string, unknown>) => patch<PtAllocation>(`${g(id)}/pt/${b}`, body),
  analytics: (id: string, range: AnalyticsRange) => get<GymAnalytics>(`${g(id)}/analytics`, { range }),
  memberAnalytics: (id: string, uid: string, range: AnalyticsRange) => get<MemberAnalytics>(`${g(id)}/members/${uid}/analytics`, { range }),
  timeline: (id: string, uid: string) => get<TimelineEvent[]>(`${g(id)}/members/${uid}/timeline`),
  notes: (id: string, uid: string) => get<MemberNote[]>(`${g(id)}/members/${uid}/notes`),
  addNote: (id: string, uid: string, body: { body: string; pinned?: boolean }) => post(`${g(id)}/members/${uid}/notes`, body),
  deleteNote: (id: string, uid: string, nid: string) => api.delete(`${g(id)}/members/${uid}/notes/${nid}`),
  mySharing: () => get<{ share_training: boolean; decided: boolean }>('/members/me/gym-sharing'),
  setMySharing: (share_training: boolean) => patch('/members/me/gym-sharing', { share_training }),
  myGymInvitations: () => get<GymInvitation[]>('/trainer/gym-invitations'),
  respondInvitation: (aff: string, accept: boolean) => post(`/trainer/gym-invitations/${aff}/respond`, { accept }),
};

/** ₹ with Indian grouping. */
export const inr = (n: number | null | undefined) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;
/** Most Gym Coins a bill can take: cap% of the total and never more than the balance. */
export const coinCap = (total: number, balance: number, capPct: number) => Math.max(0, Math.min(balance, Math.floor((total * capPct) / 100)));
