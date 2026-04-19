const DEFAULT_API_BASE = 'https://api.steelestimate.com';

function getApiBase() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE;

  if (typeof apiUrl !== 'string' || !apiUrl.trim()) {
    throw new Error('NEXT_PUBLIC_API_URL is required.');
  }

  return apiUrl.replace(/\/$/, '');
}

function buildUrl(path) {
  return `${getApiBase()}${path}`;
}

function isAuthError(response) {
  return response.status === 401 || response.status === 403;
}

function notifyAuthChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('steelestimate-auth-change'));
}

function clearClientSession() {
  if (typeof window === 'undefined') return;
  notifyAuthChange();
}

function handleUnauthorized() {
  if (typeof window === 'undefined') return;
  clearClientSession();
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.replace(`/admin/login?next=${next}`);
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';

  try {
    data = contentType.includes('application/json') ? await response.json() : await response.text();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    if (isAuthError(response)) {
      handleUnauthorized();
    }

    const error = new Error((data && typeof data === 'object' && (data.message || data.error)) || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function getPlans() {
  return request('/api/plans');
}

export async function getMe() {
  return request('/api/auth/me');
}

export async function createPaymentOrder(planId) {
  return request('/api/payments/orders', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  });
}

export async function verifyPayment(payload) {
  return request('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getLeads(params = {}) {
  const query = new URLSearchParams();

  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.search) query.set('search', params.search);
  if (params.score !== undefined && params.score !== '') query.set('score', params.score);

  const path = query.toString() ? `/api/leads?${query.toString()}` : '/api/leads';
  return request(path);
}

export async function getLeadById(id) {
  return request(`/api/leads/${encodeURIComponent(id)}`);
}

export async function updateLeadStatus(id, data) {
  const payload = typeof data === 'string' ? { status: data } : data;
  return request(`/api/leads/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateLeadNotes(id, notes) {
  return request(`/api/leads/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ notes }),
  });
}

export async function getAdminStats() {
  return request('/api/leads/admin/stats');
}

export async function getProjectHistory() {
  return request('/api/leads/history');
}

export async function login(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return request('/api/auth/logout', {
    method: 'POST',
  });
}

export async function getCurrentUser() {
  return request('/api/auth/me');
}

export async function register(email, password, name, role) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, role }),
  });
}

export async function runOrchestrator(payload) {
  return request('/api/orchestrator/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getEstimates() {
  return request('/api/estimates');
}

export async function getAnalyticsSummary(params = {}) {
  const query = new URLSearchParams();

  if (params.projectType) query.set('projectType', params.projectType);
  if (params.clientType) query.set('clientType', params.clientType);
  if (params.region) query.set('region', params.region);
  if (params.fromDate) query.set('fromDate', params.fromDate);
  if (params.toDate) query.set('toDate', params.toDate);

  const path = query.toString() ? `/api/analytics/summary?${query.toString()}` : '/api/analytics/summary';
  return request(path);
}

export async function getLearningInsights(params = {}) {
  const query = new URLSearchParams();

  if (params.projectType) query.set('projectType', params.projectType);
  if (params.clientType) query.set('clientType', params.clientType);
  if (params.region) query.set('region', params.region);
  if (params.fromDate) query.set('fromDate', params.fromDate);
  if (params.toDate) query.set('toDate', params.toDate);

  const path = query.toString() ? `/api/analytics/learning-insights?${query.toString()}` : '/api/analytics/learning-insights';
  return request(path);
}

export async function generateEstimatePdf(estimateId) {
  return request('/api/estimate/generate-pdf', {
    method: 'POST',
    body: JSON.stringify({ estimateId }),
  });
}
