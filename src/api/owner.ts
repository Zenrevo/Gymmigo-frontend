import api from '../utils/api';
import type {
  AddManagerBody,
  AddonBody,
  BusyHoursBody,
  CreateGymBody,
  CreateInvoiceBody,
  DailyQr,
  DashboardAnalytics,
  EnrollMemberBody,
  EquipmentBody,
  Expense,
  ExpenseBody,
  FacilityBody,
  FinanceSummary,
  GymAddressBody,
  GymBasicInfoBody,
  GymImageBody,
  GymManager,
  GymMediaBody,
  Invoice,
  MembersImportSummary,
  OperatingHoursBody,
  OwnerGym,
  OwnerGymListItem,
  OwnerGymPayload,
  OwnerMemberDetail,
  OwnerMemberListItem,
  OwnerMembersParams,
  OwnerMembersPayload,
  PlanBody,
  Product,
  ProductBody,
  UpdateMembershipBody,
} from '../types/owner';

/** Backend envelope. Every helper returns the raw axios response, so call sites read `res.data.data` as before. */
export type ApiEnvelope<T> = { success: boolean; data: T; message?: string; error?: { code?: string; message?: string } };

const gym = (gymId: string) => `/gym-owner/gyms/${gymId}`;
const clubs = (gymId: string) => `/clubs/gyms/${gymId}`;

/** The owner gym payload is `{ gym }` on some deployments and the gym itself on others. */
export const pickOwnerGym = (payload: OwnerGymPayload | null | undefined): OwnerGym | undefined =>
  payload ? (payload as { gym?: OwnerGym }).gym ?? (payload as OwnerGym) : undefined;

/** Members come back as `{ members }` or as the bare array. */
export const pickOwnerMembers = (payload: OwnerMembersPayload | null | undefined): OwnerMemberListItem[] =>
  Array.isArray(payload) ? payload : (payload as { members?: OwnerMemberListItem[] })?.members ?? [];

/**
 * Gym owner / manager API. Id quirk on /members/{x}: GET takes the USER id; PATCH, accept, reject and
 * cancel take the MEMBERSHIP id. Staff check-in/out use the USER id under /users/{userId}.
 */
export const ownerApi = {
  /* Gyms */
  listGyms: () => api.get<ApiEnvelope<OwnerGymListItem[]>>('/gym-owner/gyms'),
  createGym: (body: CreateGymBody | Record<string, unknown>) => api.post<ApiEnvelope<OwnerGym>>('/gym-owner/gyms', body),
  getGym: (gymId: string) => api.get<ApiEnvelope<OwnerGymPayload>>(gym(gymId)),
  ownerReviews: () => api.get<ApiEnvelope<{ reviews?: unknown[] }>>('/gym-owner/gyms/reviews'),
  updateBasicInfo: (gymId: string, body: GymBasicInfoBody | Record<string, unknown>) =>
    api.patch<ApiEnvelope<unknown>>(`${gym(gymId)}/basic-info`, body),
  updateCapacity: (gymId: string, body: { max_capacity: number } | Record<string, unknown>) =>
    api.patch<ApiEnvelope<unknown>>(`${gym(gymId)}/capacity`, body),
  updateMedia: (gymId: string, body: GymMediaBody | Record<string, unknown>) => api.patch<ApiEnvelope<unknown>>(`${gym(gymId)}/media`, body),
  addAddress: (gymId: string, body: GymAddressBody | Record<string, unknown>) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/addresses`, body),
  updateAddress: (gymId: string, addressId: string, body: GymAddressBody | Record<string, unknown>) =>
    api.patch<ApiEnvelope<unknown>>(`${gym(gymId)}/addresses/${addressId}`, body),
  dailyQr: (gymId: string) => api.get<ApiEnvelope<DailyQr>>(`${gym(gymId)}/daily-qr`),
  dashboardAnalytics: (gymId: string) => api.get<ApiEnvelope<DashboardAnalytics>>(`${gym(gymId)}/dashboard-analytics`),
  workoutStats: (gymId: string) => api.get<ApiEnvelope<Record<string, unknown>>>(`/gyms/${gymId}/workout-stats`),

  /* Members */
  listMembers: (gymId: string, params?: OwnerMembersParams | Record<string, unknown>) =>
    api.get<ApiEnvelope<OwnerMembersPayload>>(`${gym(gymId)}/members`, { params }),
  getMember: (gymId: string, userId: string) => api.get<ApiEnvelope<OwnerMemberDetail>>(`${gym(gymId)}/members/${userId}`),
  exportMembers: (gymId: string, params?: Record<string, unknown>) =>
    api.get<Blob>(`${gym(gymId)}/members/export`, { params, responseType: 'blob' }),
  importMembers: (gymId: string, form: FormData) =>
    api.post<ApiEnvelope<MembersImportSummary>>(`${gym(gymId)}/members/import`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  enrollMember: (gymId: string, body: EnrollMemberBody | Record<string, unknown>) =>
    api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/members/enroll`, body),
  updateMembership: (gymId: string, membershipId: string, body: UpdateMembershipBody | Record<string, unknown>) =>
    api.patch<ApiEnvelope<unknown>>(`${gym(gymId)}/members/${membershipId}`, body),
  acceptMembership: (gymId: string, membershipId: string) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/members/${membershipId}/accept`),
  rejectMembership: (gymId: string, membershipId: string) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/members/${membershipId}/reject`),
  cancelMembership: (gymId: string, membershipId: string) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/members/${membershipId}/cancel`),
  checkInUser: (gymId: string, userId: string) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/users/${userId}/check-in`),
  checkOutUser: (gymId: string, userId: string) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/users/${userId}/check-out`),
  attendance: (gymId: string, params?: Record<string, unknown>) => api.get<ApiEnvelope<unknown>>(`${gym(gymId)}/attendance`, { params }),

  /* Team */
  listManagers: (gymId: string) => api.get<ApiEnvelope<GymManager[]>>(`${gym(gymId)}/managers`),
  addManager: (gymId: string, body: AddManagerBody | Record<string, unknown>) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/managers`, body),
  removeManager: (gymId: string, userId: string) => api.delete<ApiEnvelope<unknown>>(`${gym(gymId)}/managers/${userId}`),

  /* Finance */
  financeSummary: (gymId: string, params?: Record<string, unknown>) =>
    api.get<ApiEnvelope<FinanceSummary>>(`${gym(gymId)}/finance/summary`, { params }),
  listInvoices: (gymId: string) => api.get<ApiEnvelope<Invoice[]>>(`${gym(gymId)}/invoices`),
  createInvoice: (gymId: string, body: CreateInvoiceBody | Record<string, unknown>) => api.post<ApiEnvelope<Invoice>>(`${gym(gymId)}/invoices`, body),
  /** Status travels in the query string; the body is null. */
  updateInvoiceStatus: (gymId: string, invoiceId: string, status: string) =>
    api.patch<ApiEnvelope<unknown>>(`${gym(gymId)}/invoices/${invoiceId}/status`, null, { params: { status } }),
  emailInvoice: (gymId: string, invoiceId: string) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/invoices/${invoiceId}/send-email`),
  listExpenses: (gymId: string) => api.get<ApiEnvelope<Expense[]>>(`${gym(gymId)}/expenses`),
  createExpense: (gymId: string, body: ExpenseBody | Record<string, unknown>) => api.post<ApiEnvelope<Expense>>(`${gym(gymId)}/expenses`, body),
  listProducts: (gymId: string) => api.get<ApiEnvelope<Product[]>>(`${gym(gymId)}/products`),
  createProduct: (gymId: string, body: ProductBody | Record<string, unknown>) => api.post<ApiEnvelope<Product>>(`${gym(gymId)}/products`, body),

  /* Plans & add-ons */
  createPlan: (gymId: string, body: PlanBody | Record<string, unknown>) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/plans`, body),
  updatePlan: (gymId: string, planId: string, body: PlanBody | Record<string, unknown>) =>
    api.patch<ApiEnvelope<unknown>>(`${gym(gymId)}/plans/${planId}`, body),
  deletePlan: (gymId: string, planId: string) => api.delete<ApiEnvelope<unknown>>(`${gym(gymId)}/plans/${planId}`),
  createAddon: (gymId: string, body: AddonBody | Record<string, unknown>) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/addons`, body),
  updateAddon: (gymId: string, addonId: string, body: AddonBody | Record<string, unknown>) =>
    api.patch<ApiEnvelope<unknown>>(`${gym(gymId)}/addons/${addonId}`, body),
  deleteAddon: (gymId: string, addonId: string) => api.delete<ApiEnvelope<unknown>>(`${gym(gymId)}/addons/${addonId}`),

  /* Equipment, facilities, amenities, gallery */
  createEquipment: (gymId: string, body: EquipmentBody | Record<string, unknown>) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/equipment`, body),
  updateEquipment: (gymId: string, id: string, body: EquipmentBody | Record<string, unknown>) =>
    api.patch<ApiEnvelope<unknown>>(`${gym(gymId)}/equipment/${id}`, body),
  deleteEquipment: (gymId: string, id: string) => api.delete<ApiEnvelope<unknown>>(`${gym(gymId)}/equipment/${id}`),
  createFacility: (gymId: string, body: FacilityBody | Record<string, unknown>) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/facilities`, body),
  updateFacility: (gymId: string, id: string, body: FacilityBody | Record<string, unknown>) =>
    api.patch<ApiEnvelope<unknown>>(`${gym(gymId)}/facilities/${id}`, body),
  deleteFacility: (gymId: string, id: string) => api.delete<ApiEnvelope<unknown>>(`${gym(gymId)}/facilities/${id}`),
  addAmenity: (gymId: string, body: { name: string } | Record<string, unknown>) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/amenities`, body),
  deleteAmenity: (gymId: string, id: string) => api.delete<ApiEnvelope<unknown>>(`${gym(gymId)}/amenities/${id}`),
  addImage: (gymId: string, body: GymImageBody | Record<string, unknown>) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/images`, body),
  deleteImage: (gymId: string, id: string) => api.delete<ApiEnvelope<unknown>>(`${gym(gymId)}/images/${id}`),
  addVideo: (gymId: string, body: Record<string, unknown>) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/videos`, body),
  deleteVideo: (gymId: string, id: string) => api.delete<ApiEnvelope<unknown>>(`${gym(gymId)}/videos/${id}`),

  /* Schedule */
  setHours: (gymId: string, body: OperatingHoursBody | Record<string, unknown>) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/hours`, body),
  setBusyHours: (gymId: string, body: BusyHoursBody | Record<string, unknown>) => api.post<ApiEnvelope<unknown>>(`${gym(gymId)}/busy-hours`, body),

  /* Reviews */
  gymReviews: (gymId: string, params: Record<string, unknown> = { sort_by: 'newest', page: 1, page_size: 50 }) =>
    api.get<ApiEnvelope<unknown>>(`/memberships/reviews/${gymId}`, { params }),
  respondToReview: (reviewId: string, body: Record<string, unknown>) =>
    api.post<ApiEnvelope<unknown>>(`/memberships/reviews/${reviewId}/respond`, body),

  /* Loyalty clubs (owner side) */
  clubConfigs: (gymId: string) => api.get<ApiEnvelope<unknown>>(`${clubs(gymId)}/club-configs`),
  publishClubConfigs: (gymId: string, body: Record<string, unknown>) => api.post<ApiEnvelope<unknown>>(`${clubs(gymId)}/club-configs/publish-batch`, body),
  clubMemberships: (gymId: string) => api.get<ApiEnvelope<unknown>>(`${clubs(gymId)}/club-memberships`),
  updateClubMembership: (gymId: string, id: string, body: Record<string, unknown>) =>
    api.patch<ApiEnvelope<unknown>>(`${clubs(gymId)}/club-memberships/${id}`, body),
  rewardClaims: (gymId: string, status = 'claimed') => api.get<ApiEnvelope<unknown>>(`${clubs(gymId)}/reward-claims`, { params: { status } }),
  updateRewardClaim: (gymId: string, id: string, body: Record<string, unknown>) =>
    api.patch<ApiEnvelope<unknown>>(`${clubs(gymId)}/reward-claims/${id}`, body),
  transferRequests: (gymId: string, status = 'pending') => api.get<ApiEnvelope<unknown>>(`${clubs(gymId)}/transfer-requests`, { params: { status } }),
  updateTransferRequest: (gymId: string, id: string, body: Record<string, unknown>) =>
    api.patch<ApiEnvelope<unknown>>(`${clubs(gymId)}/transfer-requests/${id}`, body),
  referralLeads: (gymId: string, params?: Record<string, unknown>) => api.get<ApiEnvelope<unknown>>(`${clubs(gymId)}/referral-leads`, { params }),
  updateReferralLead: (gymId: string, id: string, body: Record<string, unknown>) =>
    api.patch<ApiEnvelope<unknown>>(`${clubs(gymId)}/referral-leads/${id}`, body),
};
