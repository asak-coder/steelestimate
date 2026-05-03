import apiClient from './apiClient';
import { clearAuthSession, setAuthSession } from './authStore';

const createRequestError = (message, status, data) => {
  const error = new Error(message || 'Request failed');
  error.status = status;
  error.statusCode = status;
  error.data = data;
  return error;
};

const redirectForAuthError = () => {
  if (typeof window === 'undefined') return;

  const loginPath = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
  if (window.location.pathname !== loginPath) {
    window.location.assign(`${loginPath}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  }
};

export async function request(path, options = {}) {
  const {
    headers: customHeaders = {},
    body,
    redirectOnAuthError = true,
    responseType = 'json',
    ...fetchOptions
  } = options;

  const headers = { ...customHeaders };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (body !== undefined && body !== null && !isFormData && typeof body !== 'string') {
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  try {
    const response = await apiClient.request({
      url: path,
      method: fetchOptions.method || 'GET',
      headers,
      data:
        body === undefined || body === null
          ? undefined
          : isFormData || typeof body === 'string'
            ? body
            : body,
      responseType: responseType === 'arrayBuffer' ? 'arraybuffer' : responseType,
      skipAuthRefresh: redirectOnAuthError === false && path.includes('/api/auth/')
    });

    return response.data;
  } catch (error) {
    const status = error?.response?.status || error.status || 500;
    const data = error?.response?.data || error.data || null;
    const message =
      data?.message ||
      data?.error ||
      data?.msg ||
      error?.message ||
      `Request failed with status ${status}`;

    if ((status === 401 || status === 403) && redirectOnAuthError) {
      clearAuthSession();
      redirectForAuthError();
    }

    throw createRequestError(message, status, data);
  }
}

const unwrapData = (payload) => {
  if (payload && typeof payload === 'object') {
    if ('data' in payload && payload.data !== undefined) return payload.data;
    if ('result' in payload && payload.result !== undefined) return payload.result;
  }

  return payload;
};

export async function login(payload) {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: payload,
    redirectOnAuthError: false,
  });
  const data = response?.data || response || {};
  if (data.accessToken) {
    setAuthSession(data.accessToken, data.user || null);
  }
  return response;
}

export async function verifyLogin2FA(payload) {
  const response = await request('/api/auth/2fa/login', {
    method: 'POST',
    body: payload,
    redirectOnAuthError: false,
  });
  const data = response?.data || response || {};
  if (data.accessToken) {
    setAuthSession(data.accessToken, data.user || null);
  }
  return response;
}

export async function register(payload) {
  return request('/api/auth/register', {
    method: 'POST',
    body: payload,
    redirectOnAuthError: false,
  });
}

export async function logout() {
  const response = await request('/api/auth/logout', {
    method: 'POST',
    redirectOnAuthError: false,
  });
  clearAuthSession();
  return response;
}

export async function getMe() {
  const data = await request('/api/auth/me', { method: 'GET' });
  if (data && typeof data === 'object') {
    return data.user || data.data || data.result || data;
  }
  return data;
}

export async function refreshSession() {
  const response = await request('/api/auth/refresh', {
    method: 'POST',
    redirectOnAuthError: false,
  });
  const data = response?.data || response || {};
  if (data.accessToken) {
    setAuthSession(data.accessToken, data.user || null);
  }
  return response;
}

export async function getSessions() {
  return unwrapData(await request('/api/auth/sessions', { method: 'GET' }));
}

export async function revokeSession(refreshTokenId) {
  return request(`/api/auth/sessions/${encodeURIComponent(refreshTokenId)}`, { method: 'DELETE' });
}

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export async function getLoginLogs(params = {}) {
  return unwrapData(await request(`/api/auth/login-logs${buildQuery(params)}`, { method: 'GET' }));
}

export async function getSecurityEvents(params = {}) {
  return unwrapData(await request(`/api/auth/security-events${buildQuery(params)}`, { method: 'GET' }));
}

export async function getAdminSecurityEvents(params = {}) {
  return unwrapData(await request(`/api/admin/security/events${buildQuery(params)}`, { method: 'GET' }));
}

export async function getAdminSecurityLogins(params = {}) {
  return unwrapData(await request(`/api/admin/security/logins${buildQuery(params)}`, { method: 'GET' }));
}

export async function getAdminSecuritySummary(params = {}) {
  return unwrapData(await request(`/api/admin/security/summary${buildQuery(params)}`, { method: 'GET' }));
}

export async function getAdminSecurityLive() {
  return unwrapData(await request('/api/admin/security/live', { method: 'GET' }));
}

export async function setup2FA() {
  return unwrapData(await request('/api/auth/2fa/setup', { method: 'POST' }));
}

export async function enable2FA(payload) {
  return unwrapData(await request('/api/auth/2fa/verify', { method: 'POST', body: payload }));
}

export async function disable2FA(payload) {
  return unwrapData(await request('/api/auth/2fa/disable', { method: 'POST', body: payload }));
}

export async function updateProfile(payload) {
  return request('/api/auth/me', {
    method: 'PATCH',
    body: payload,
  });
}

export async function trackCalculatorUsage(payload = {}) {
  return request('/api/leads/track-usage', {
    method: 'POST',
    body: payload,
    redirectOnAuthError: false,
  });
}

export async function getPlans() {
  const data = await request('/api/plans', {
    method: 'GET',
    redirectOnAuthError: false,
  });

  if (data && typeof data === 'object') {
    return data.plans || data.data || data.result || data;
  }

  return data;
}

export async function createSubscribeOrder(planKeyOrPayload) {
  const payload =
    typeof planKeyOrPayload === 'string'
      ? { planKey: planKeyOrPayload, plan: planKeyOrPayload }
      : {
          ...planKeyOrPayload,
          planKey: planKeyOrPayload?.planKey || planKeyOrPayload?.plan || planKeyOrPayload?.planType,
          plan: planKeyOrPayload?.plan || planKeyOrPayload?.planKey || planKeyOrPayload?.planType,
        };

  return request('/api/subscribe', {
    method: 'POST',
    body: payload,
  });
}

export async function createOrder(planKeyOrPayload) {
  return createSubscribeOrder(planKeyOrPayload);
}

export const subscribeOrder = createSubscribeOrder;

const paymentVerifyEndpoints = ['/api/subscribe/verify', '/api/verify-payment', '/api/payment/verify'];
const sectionsCache = new Map();
const sectionsPromiseCache = new Map();

export async function verifyPayment(payload) {
  const requestBody =
    typeof payload === 'string'
      ? { orderId: payload }
      : {
          ...payload,
          planKey: payload?.planKey || payload?.plan || payload?.planType,
          plan: payload?.plan || payload?.planKey || payload?.planType,
          razorpay_payment_id: payload?.razorpay_payment_id || payload?.paymentId,
          razorpay_order_id: payload?.razorpay_order_id || payload?.orderId,
          razorpay_signature: payload?.razorpay_signature || payload?.signature,
        };

  let lastError = null;

  for (const endpoint of paymentVerifyEndpoints) {
    try {
      const response = await request(endpoint, {
        method: 'POST',
        body: requestBody,
      });

      return response;
    } catch (error) {
      lastError = error;
      if (error?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError || createRequestError('Unable to verify payment', 500);
}

export async function verifySubscribePayment(payload) {
  return verifyPayment(payload);
}

export const verifySubscriptionPayment = verifyPayment;
export const fetchPlans = getPlans;

export async function getSections(type) {
  const cacheKey = String(type || '').trim().toUpperCase();
  if (!cacheKey) {
    return [];
  }

  if (sectionsCache.has(cacheKey)) {
    return sectionsCache.get(cacheKey);
  }

  if (sectionsPromiseCache.has(cacheKey)) {
    return sectionsPromiseCache.get(cacheKey);
  }

  const pending = (async () => {
    const data = await request(`/api/sections/${cacheKey}`, { method: 'GET' });
    const unwrapped = unwrapData(data);
    sectionsCache.set(cacheKey, unwrapped);
    sectionsPromiseCache.delete(cacheKey);
    return unwrapped;
  })();

  sectionsPromiseCache.set(cacheKey, pending);

  try {
    return await pending;
  } catch (error) {
    sectionsPromiseCache.delete(cacheKey);
    throw error;
  }
}

export async function createLead(payload) {
  return request('/api/leads', {
    method: 'POST',
    body: payload,
  });
}

export async function getLeads(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const path = queryString ? `/api/leads?${queryString}` : '/api/leads';
  const data = await request(path, { method: 'GET' });
  return unwrapData(data);
}

export async function getLeadById(id) {
  const data = await request(`/api/leads/${id}`, { method: 'GET' });
  return unwrapData(data);
}

export async function updateLeadStatus(id, payload) {
  const body = typeof payload === 'string' ? { status: payload } : payload;
  return request(`/api/leads/${id}/status`, {
    method: 'PATCH',
    body,
  });
}

export async function updateLeadNotes(id, payload) {
  const body = typeof payload === 'string' ? { notes: payload } : payload;
  return request(`/api/leads/${id}/notes`, {
    method: 'PATCH',
    body,
  });
}

export async function getProjectHistory() {
  const fallbackPaths = ['/api/history', '/api/projects/history', '/api/admin/history'];
  let lastError = null;

  for (const path of fallbackPaths) {
    try {
      const data = await request(path, { method: 'GET' });
      return unwrapData(data);
    } catch (error) {
      lastError = error;
      if (error?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError || createRequestError('Unable to load project history', 500);
}

export async function getAdminStats() {
  const fallbackPaths = ['/api/admin/stats', '/api/admin/dashboard/stats', '/api/stats'];
  let lastError = null;

  for (const path of fallbackPaths) {
    try {
      const data = await request(path, { method: 'GET' });
      return unwrapData(data);
    } catch (error) {
      lastError = error;
      if (error?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError || createRequestError('Unable to load admin stats', 500);
}

export async function getAdminUsers() {
  const fallbackPaths = ['/api/admin/users'];
  let lastError = null;

  for (const path of fallbackPaths) {
    try {
      const data = await request(path, { method: 'GET' });
      return unwrapData(data);
    } catch (error) {
      lastError = error;
      if (error?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError || createRequestError('Unable to load admin users', 500);
}

export async function getAdminLeads(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const fallbackPaths = [queryString ? `/api/admin/leads?${queryString}` : '/api/admin/leads'];
  let lastError = null;

  for (const path of fallbackPaths) {
    try {
      const data = await request(path, { method: 'GET' });
      return unwrapData(data);
    } catch (error) {
      lastError = error;
      if (error?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError || createRequestError('Unable to load admin leads', 500);
}

export async function getAdminSubscriptions() {
  const fallbackPaths = ['/api/admin/subscriptions'];
  let lastError = null;

  for (const path of fallbackPaths) {
    try {
      const data = await request(path, { method: 'GET' });
      return unwrapData(data);
    } catch (error) {
      lastError = error;
      if (error?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError || createRequestError('Unable to load admin subscriptions', 500);
}

export async function getAnalyticsSummary() {
  const fallbackPaths = ['/api/admin/analytics/summary', '/api/analytics/summary', '/api/admin/analytics'];
  let lastError = null;

  for (const path of fallbackPaths) {
    try {
      const data = await request(path, { method: 'GET' });
      return unwrapData(data);
    } catch (error) {
      lastError = error;
      if (error?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError || createRequestError('Unable to load analytics summary', 500);
}

export async function getBoqProjects() {
  const data = await request('/api/boq', { method: 'GET' });
  return unwrapData(data);
}

export async function getBoqProject(id) {
  return getBoqProjectById(id);
}

export async function getBoqProjectById(id) {
  const data = await request(`/api/boq/${id}`, { method: 'GET' });
  return unwrapData(data);
}

export async function saveBoqProject(payload) {
  return request('/api/boq/save', {
    method: 'POST',
    body: payload,
  });
}

export async function exportBoqProject(payload) {
  return request('/api/boq/export', {
    method: 'POST',
    body: payload,
    headers: {
      Accept: 'application/octet-stream',
    },
    responseType: 'blob',
  });
}

export async function getProjects() {
  const data = await request('/api/projects', { method: 'GET' });
  return unwrapData(data);
}

export async function getProjectById(id) {
  const data = await request(`/api/projects/${id}`, { method: 'GET' });
  return unwrapData(data);
}

export async function createProject(payload) {
  return request('/api/projects', {
    method: 'POST',
    body: payload,
  });
}

export async function updateProject(id, payload) {
  return request(`/api/projects/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteProject(id) {
  return request(`/api/projects/${id}`, {
    method: 'DELETE',
  });
}

export async function getEstimates() {
  const data = await request('/api/estimates', { method: 'GET' });
  return unwrapData(data);
}

export async function calculateEstimate(payload) {
  return request('/api/estimates/calculate', {
    method: 'POST',
    body: payload,
  });
}

export async function estimateWithAi(payload) {
  return request('/api/ai/estimate', {
    method: 'POST',
    body: payload,
  });
}

export async function createEstimate(payload) {
  return request('/api/estimates', {
    method: 'POST',
    body: payload,
  });
}

export async function deleteEstimate(id) {
  return request(`/api/estimates/${id}`, {
    method: 'DELETE',
  });
}

const api = {
  request,
  login,
  verifyLogin2FA,
  register,
  logout,
  getMe,
  refreshSession,
  getSessions,
  revokeSession,
  getLoginLogs,
  getSecurityEvents,
  getAdminSecurityEvents,
  getAdminSecurityLogins,
  getAdminSecuritySummary,
  getAdminSecurityLive,
  setup2FA,
  enable2FA,
  disable2FA,
  updateProfile,
  trackCalculatorUsage,
  getPlans,
  createSubscribeOrder,
  createOrder,
  subscribeOrder,
  verifyPayment,
  verifySubscribePayment,
  verifySubscriptionPayment,
  fetchPlans,
  getSections,
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  updateLeadNotes,
  getProjectHistory,
  getAdminStats,
  getAdminUsers,
  getAdminLeads,
  getAdminSubscriptions,
  getAnalyticsSummary,
  getBoqProjects,
  getBoqProject,
  getBoqProjectById,
  saveBoqProject,
  exportBoqProject,
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getEstimates,
  calculateEstimate,
  estimateWithAi,
  createEstimate,
  deleteEstimate,
};

export default api;
