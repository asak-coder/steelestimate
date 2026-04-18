const DEFAULT_API_BASE = 'https://steelestimate.onrender.com';

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
  try {
    window.localStorage.removeItem('steelestimate_token');
  } catch (error) {
    // Ignore storage failures and continue with redirect fallback.
  }
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
    credentials: 'include',
    ...options,
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
    method: 'POST'
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
