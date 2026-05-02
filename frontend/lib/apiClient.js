import axios from 'axios';
import { clearAuthSession, getAccessToken, setAuthSession } from './authStore';

const DEFAULT_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  'http://localhost:5000';

const normalizeBaseUrl = (baseUrl) => String(baseUrl || '').replace(/\/+$/, '');

export const API_BASE_URL = normalizeBaseUrl(DEFAULT_API_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

let refreshPromise = null;

function isAuthEndpoint(url = '') {
  return String(url).includes('/api/auth/login') || String(url).includes('/api/auth/refresh');
}

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const pathname = window.location.pathname;
  const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login';
  if (pathname !== loginPath) {
    window.location.assign(`${loginPath}?next=${encodeURIComponent(pathname + window.location.search)}`);
  }
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post('/api/auth/refresh', null, {
        skipAuthRefresh: true
      })
      .then((response) => {
        const payload = response.data?.data || response.data || {};
        if (!payload.accessToken) {
          throw new Error('Refresh response did not include an access token');
        }
        setAuthSession(payload.accessToken, payload.user || null);
        return payload;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error.config || {};

    if (
      (status === 401 || status === 403) &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;
      try {
        await refreshAccessToken();
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearAuthSession();
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
