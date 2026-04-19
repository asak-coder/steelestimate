const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

const normalizeBaseUrl = (baseUrl) => {
  if (!baseUrl) return '';
  return String(baseUrl).replace(/\/+$/, '');
};

const API_BASE_URL = normalizeBaseUrl(DEFAULT_API_URL);

const joinUrl = (path) => {
  const cleanPath = String(path || '').startsWith('/') ? String(path) : `/${path}`;

  if (!API_BASE_URL) {
    return cleanPath;
  }

  const baseEndsWithApi = /\/api$/i.test(API_BASE_URL);
  if (baseEndsWithApi && cleanPath.startsWith('/api/')) {
    return `${API_BASE_URL}${cleanPath.slice(4)}`;
  }

  return `${API_BASE_URL}${cleanPath}`;
};

const createRequestError = (message, status, data) => {
  const error = new Error(message || 'Request failed');
  error.status = status;
  error.statusCode = status;
  error.data = data;
  return error;
};

const notifyAuthChange = (detail) => {
  if (typeof window === 'undefined') return;

  try {
    window.dispatchEvent(new CustomEvent('steelestimate-auth-change', { detail }));
  } catch (_) {
    window.dispatchEvent(new Event('steelestimate-auth-change'));
  }
};

const redirectForAuthError = () => {
  if (typeof window === 'undefined') return;

  const loginPath = '/login';
  if (window.location.pathname !== loginPath) {
    window.location.assign(`${loginPath}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
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

  const response = await fetch(joinUrl(path), {
    credentials: 'include',
    ...fetchOptions,
    headers,
    body:
      body === undefined || body === null
        ? undefined
        : isFormData || typeof body === 'string'
          ? body
          : JSON.stringify(body),
  });

  let data = null;

  if (responseType === 'blob') {
    data = await response.blob();
  } else if (responseType === 'arrayBuffer') {
    data = await response.arrayBuffer();
  } else {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }
    } else {
      try {
        const text = await response.text();
        data = text ? { message: text } : null;
      } catch (_) {
        data = null;
      }
    }
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.msg ||
      `Request failed with status ${response.status}`;

    if (response.status === 401 && redirectOnAuthError) {
      notifyAuthChange({ type: 'unauthorized' });
      redirectForAuthError();
    }

    throw createRequestError(message, response.status, data);
  }

  return data;
}

const unwrapData = (payload) => {
  if (payload && typeof payload === 'object') {
    if ('data' in payload && payload.data !== undefined) return payload.data;
    if ('result' in payload && payload.result !== undefined) return payload.result;
  }

  return payload;
};

export async function login(payload) {
  return request('/api/auth/login', {
    method: 'POST',
    body: payload,
    redirectOnAuthError: false,
  });
}

export async function register(payload) {
  return request('/api/auth/register', {
    method: 'POST',
    body: payload,
    redirectOnAuthError: false,
  });
}

export async function logout() {
  return request('/api/auth/logout', {
    method: 'POST',
    redirectOnAuthError: false,
  });
}

export async function getMe() {
  const data = await request('/api/auth/me', { method: 'GET' });
  if (data && typeof data === 'object') {
    return data.user || data.data || data.result || data;
  }
  return data;
}

export async function updateProfile(payload) {
  return request('/api/auth/me', {
    method: 'PATCH',
    body: payload,
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

export async function getSections() {
  const data = await request('/api/sections', { method: 'GET' });
  return unwrapData(data);
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
  const body = payload?.id || payload?._id ? payload : payload;
  if (body?.id || body?._id) {
    return request(`/api/boq/${body.id || body._id}`, {
      method: 'PATCH',
      body,
    });
  }

  return request('/api/boq', {
    method: 'POST',
    body,
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
  register,
  logout,
  getMe,
  updateProfile,
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
