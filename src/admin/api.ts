import axios, { AxiosError } from 'axios';

/**
 * Admin console API client. Separate from the app's client: its own token (kept in sessionStorage, so it
 * ends with the tab), no refresh flow, and a 401 sends you back to the admin sign-in.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'gymmigo_admin_token';

export const adminToken = {
  get: (): string | null => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string | null) => {
    try {
      if (t) sessionStorage.setItem(TOKEN_KEY, t);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage blocked: the session just won't survive a reload */
    }
  },
};

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

export const adminHttp = axios.create({ baseURL: `${API_URL}/admin`, timeout: 20000 });

adminHttp.interceptors.request.use(config => {
  const t = adminToken.get();
  if (t && !config.headers.Authorization) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

adminHttp.interceptors.response.use(
  r => r,
  (error: AxiosError<ApiError>) => {
    const data = error.response?.data;
    const code = data?.error?.code ?? (typeof data?.detail === 'object' ? data.detail?.error?.code : undefined);
    if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/') && code !== 'INVALID_CREDENTIALS') {
      adminToken.set(null);
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

type ApiError = { error?: { code?: string; message?: string }; detail?: { error?: { code?: string; message?: string } } | string };

export function adminError(e: unknown): { code?: string; message: string } {
  const err = e as AxiosError<ApiError>;
  const data = err.response?.data;
  const inner = data?.error ?? (typeof data?.detail === 'object' ? data.detail?.error : undefined);
  if (inner?.message) return { code: inner.code, message: inner.message };
  if (typeof data?.detail === 'string') return { message: data.detail };
  if (!err.response) return { message: 'Could not reach the server. Check your connection.' };
  return { message: `Request failed (${err.response.status}).` };
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return (await p).data.data;
}

export const adminGet = <T>(url: string, params?: Record<string, unknown>) =>
  unwrap<T>(adminHttp.get(url, { params: clean(params) }));
export const adminPost = <T>(url: string, body?: unknown) => unwrap<T>(adminHttp.post(url, body));
export const adminPatch = <T>(url: string, body?: unknown) => unwrap<T>(adminHttp.patch(url, body));
export const adminPut = <T>(url: string, body?: unknown) => unwrap<T>(adminHttp.put(url, body));
export const adminDelete = <T>(url: string, params?: Record<string, unknown>) =>
  unwrap<T>(adminHttp.delete(url, { params: clean(params) }));

function clean(params?: Record<string, unknown>) {
  if (!params) return undefined;
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

/* ─── Types ─── */

export type Permission = string;

export type AdminProfile = {
  id: string;
  username: string;
  full_name: string | null;
  role: string;
  role_label: string;
  permissions: Permission[];
  phone_masked: string | null;
  last_login_at: string | null;
  password_changed_at: string | null;
};

export type LoginStep =
  | { stage: 'setup'; challenge_token: string; phone_locked: boolean; phone_masked: string | null; username: string }
  | { stage: 'otp'; challenge_token: string; phone_masked: string; resend_after: number }
  | Session;

export type Session = { stage: 'done'; access_token: string; expires_at: string; admin: AdminProfile };

export type Paged<T> = { items: T[]; total: number; page: number; page_size: number };
