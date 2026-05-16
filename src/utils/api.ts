import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const DEFAULT_TIMEOUT_MS = 20000;
const RETRY_DELAY_MS = 600;

type ApiRequestConfig = AxiosRequestConfig & {
  _authRetry?: boolean;
  _networkRetry?: boolean;
  _requestStartedAt?: number;
  _requestId?: string;
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
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
  headers: {
    'Content-Type': 'application/json',
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

    const token = localStorage.getItem('access_token');
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

      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((newAccessToken: string) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            resolve(api(originalRequest));
          });
        });
      }
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          isRefreshing = true;
          const res = await axios.post(`${API_URL}/auth/refresh-token`, {
            refresh_token: refreshToken,
          }, { timeout: 15000 });
          
          if (res.data.success) {
            const newAccessToken = res.data.data.access_token;
            localStorage.setItem('access_token', newAccessToken);
            onRefreshed(newAccessToken);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Session expired. Redirecting to login.');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          refreshSubscribers = [];
          window.location.href = '/login';
        } finally {
          isRefreshing = false;
        }
      } else {
        refreshSubscribers = [];
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
