import type { AxiosRequestConfig } from 'axios';
import api from '../utils/api';

/** Backend envelope: `{ success, data, error }`. These helpers return `data` (errors throw, as axios does). */
type Envelope<T> = { success: boolean; data: T; error?: { code?: string; message?: string } | null };

export const http = {
  get: async <T>(url: string, config?: AxiosRequestConfig) => (await api.get<Envelope<T>>(url, config)).data.data,
  post: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => (await api.post<Envelope<T>>(url, body, config)).data.data,
  delete: async <T>(url: string, config?: AxiosRequestConfig) => (await api.delete<Envelope<T>>(url, config)).data.data,
};

/** Error code from an API failure (`ROOM_FULL`, `NOT_HOST`…), or null. */
export function apiErrorCode(error: unknown): string | null {
  const data = (error as { response?: { data?: { error?: { code?: string }; detail?: { error?: { code?: string } } } } })?.response?.data;
  return data?.error?.code ?? data?.detail?.error?.code ?? null;
}

/** Ids from links are put into paths: encode them and refuse dot segments. */
export const pathId = (v: string) => {
  if (!v || v === '.' || v === '..') throw new Error('Invalid id');
  return encodeURIComponent(v);
};
