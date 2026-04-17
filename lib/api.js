const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://steelestimate.onrender.com';

function buildUrl(path) {
  return `${API_BASE}${path}`;
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function getHeaders() {
  const token = getToken();

  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function getLeads(params = {}) {
  const query = new URLSearchParams();

  if (params.status) query.set('status', params.status);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);

  const path = query.toString() ? `/api/leads?${query.toString()}` : '/api/leads';
  return request(path);
}

export async function getLeadById(id) {
  return request(`/api/leads/${id}`);
}

export async function updateLeadStatus(id, data) {
  return request(`/api/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getAdminStats() {
  return request('/api/leads/admin/stats');
}

export async function getProjectHistory() {
  return request('/api/leads/history');
}

export async function login(email, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (data.token && typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
  }

  return data;
}
