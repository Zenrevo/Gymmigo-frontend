import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const DEFAULT_TIMEOUT_MS = 20000;
const RETRY_DELAY_MS = 600;

export type ApiRequestConfig = AxiosRequestConfig & {
  _authRetry?: boolean;
  _networkRetry?: boolean;
  _requestStartedAt?: number;
  _requestId?: string;
  /** On a failed refresh, reject instead of redirecting to /login (session bootstrap). */
  _skipAuthRedirect?: boolean;
};

/**
 * Where the web keeps auth. `cookie`: the backend's httpOnly cookies only — no JWT is
 * readable by page scripts. `local`: tokens in localStorage, for hosts that can't
 * receive the API's cookies (localhost, Vercel previews). Override with VITE_AUTH_STORAGE.
 */
type AuthStorage = 'cookie' | 'local';

const resolveAuthStorage = (): AuthStorage => {
  const configured = import.meta.env.VITE_AUTH_STORAGE;
  if (configured === 'cookie' || configured === 'local') return configured;
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  return host === 'gymmigo.in' || host.endsWith('.gymmigo.in') ? 'cookie' : 'local';
};

export const AUTH_STORAGE: AuthStorage = resolveAuthStorage();

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
/** Non-secret marker so cookie mode only bootstraps a session when one may exist. */
const SESSION_MARKER_KEY = 'auth_session';

export const authTokens = {
  getAccess: () => (AUTH_STORAGE === 'local' ? localStorage.getItem(ACCESS_KEY) : null),
  getRefresh: () => (AUTH_STORAGE === 'local' ? localStorage.getItem(REFRESH_KEY) : null),
  hasSession: () =>
    AUTH_STORAGE === 'local' ? Boolean(localStorage.getItem(ACCESS_KEY)) : localStorage.getItem(SESSION_MARKER_KEY) === '1',
  save: (accessToken?: string | null, refreshToken?: string | null) => {
    if (AUTH_STORAGE === 'local') {
      if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    } else {
      localStorage.setItem(SESSION_MARKER_KEY, '1');
    }
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(SESSION_MARKER_KEY);
    localStorage.removeItem('user');
  },
};

if (AUTH_STORAGE === 'cookie') {
  // Tokens left over from before cookie auth must not linger where scripts can read them.
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/** Headers for requests made outside the shared axios instance (e.g. fetch streaming). */
export const authRequestHeaders = (): Record<string, string> => {
  const token = authTokens.getAccess();
  return {
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/** Sentinel: refresh failed for network/server reasons — keep the session. */
export const REFRESH_NETWORK_ERROR = '__network_error__';

let inflightRefresh: Promise<string | null> | null = null;

/**
 * Single-flight refresh shared by the interceptor and AuthContext, so a rotated
 * refresh token is never presented twice. Resolves to the new access token, null
 * when the server rejects the refresh token, or REFRESH_NETWORK_ERROR on a
 * transient failure (the user stays signed in).
 */
export const refreshSession = (): Promise<string | null> => {
  inflightRefresh ??= doRefresh().finally(() => {
    inflightRefresh = null;
  });
  return inflightRefresh;
};

const doRefresh = async (): Promise<string | null> => {
  const refreshToken = authTokens.getRefresh();
  if (AUTH_STORAGE === 'local' && !refreshToken) return null;
  try {
    const res = await axios.post(
      `${API_URL}/auth/refresh-token`,
      refreshToken ? { refresh_token: refreshToken } : {},
      { timeout: 15000, withCredentials: true, headers: { 'X-Requested-With': 'XMLHttpRequest' } },
    );
    if (res.data?.success) {
      const { access_token, refresh_token } = res.data.data;
      // refresh_token is only present when the server rotates; keep it or the next refresh fails.
      authTokens.save(access_token, refresh_token);
      return access_token;
    }
    return null;
  } catch (err) {
    const status = (err as AxiosError).response?.status;
    if (status === 401 || status === 403) return null;
    return REFRESH_NETWORK_ERROR;
  }
};

const createRequestId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isTimeoutOrNetworkError = (error: AxiosError) => {
  return Boolean(
    error.code === 'ECONNABORTED' ||
    error.code === 'ERR_NETWORK' ||
    error.message?.toLowerCase().includes('timeout') ||
    !error.response
  );
};

const shouldRetry = (error: AxiosError) => {
  const config = error.config as ApiRequestConfig | undefined;
  return (
    config?.method?.toLowerCase() === 'get' &&
    !config._networkRetry &&
    isTimeoutOrNetworkError(error)
  );
};

export type ApiValidationIssue = { code?: string; message: string; mission_code?: string };

export const getApiValidationIssues = (error: unknown): ApiValidationIssue[] => {
  const err = error as AxiosError<{ error?: { extra?: { errors?: ApiValidationIssue[] } }; detail?: { extra?: { errors?: ApiValidationIssue[] } } }>;
  const data = err.response?.data;
  return data?.error?.extra?.errors || data?.detail?.extra?.errors || [];
};

export const getApiErrorMessage = (error: unknown) => {
  const err = error as AxiosError<any>;
  if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
    return 'The server is taking longer than usual to respond. Please try again.';
  }
  if (err.code === 'ERR_NETWORK' || !err.response) {
    return navigator.onLine
      ? 'We could not reach the server. It may be waking up, please retry in a moment.'
      : 'You appear to be offline. Please check your internet connection.';
  }
  const data = err.response?.data;
  const detail = data?.detail;
  return (
    data?.error?.message ||
    detail?.error?.message ||
    (typeof detail === 'string' ? detail : undefined) ||
    detail?.message ||
    data?.message ||
    'Something went wrong. Please try again.'
  );
};

const api = axios.create({
  baseURL: API_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const requestConfig = config as ApiRequestConfig;
    requestConfig._requestStartedAt = Date.now();
    requestConfig._requestId = requestConfig._requestId || createRequestId();
    config.headers = config.headers || {};
    config.headers['X-Request-ID'] = requestConfig._requestId;

    const token = authTokens.getAccess();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for handling token expiration
api.interceptors.response.use(
  (response) => {
    const config = response.config as ApiRequestConfig;
    const elapsedMs = config._requestStartedAt ? Date.now() - config._requestStartedAt : undefined;
    if (elapsedMs && elapsedMs > 3000) {
      console.info('[api] Slow response', {
        method: config.method,
        url: config.url,
        status: response.status,
        requestId: response.headers['x-request-id'] || config._requestId,
        elapsedMs,
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as ApiRequestConfig | undefined;

    if (originalRequest && shouldRetry(error)) {
      originalRequest._networkRetry = true;
      await delay(RETRY_DELAY_MS);
      return api(originalRequest);
    }

    if (originalRequest && isTimeoutOrNetworkError(error)) {
      const elapsedMs = originalRequest._requestStartedAt ? Date.now() - originalRequest._requestStartedAt : undefined;
      console.warn('[api] Request failed before a usable response', {
        method: originalRequest.method,
        url: originalRequest.url,
        requestId: originalRequest._requestId,
        elapsedMs,
        online: navigator.onLine,
        code: error.code,
        message: error.message,
      });
    }
    
    // If error is 401 and not an auth endpoint, try to refresh token or redirect to login
    if (error.response?.status === 401 && originalRequest && !originalRequest._authRetry) {
      const isAuthEndpoint = originalRequest.url?.includes('/auth/send-otp') || 
                             originalRequest.url?.includes('/auth/verify-otp') ||
                             originalRequest.url?.includes('/auth/refresh-token');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      originalRequest._authRetry = true;

      const newAccessToken = await refreshSession();
      if (newAccessToken === REFRESH_NETWORK_ERROR) {
        return Promise.reject(error);
      }
      if (newAccessToken) {
        // In cookie mode the request interceptor attaches nothing; the refreshed cookie is sent.
        delete originalRequest.headers?.Authorization;
        return api(originalRequest);
      }

      authTokens.clear();
      if (!originalRequest._skipAuthRedirect) {
        console.error('Session expired. Redirecting to login.');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
