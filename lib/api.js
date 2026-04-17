const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// ============================
// AUTH TOKEN
// ============================
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

// ============================
// LEADS
// ============================

export async function getLeads() {
  const res = await fetch(`${API_BASE}/api/leads`, {
    headers: getHeaders(),
  });
  return res.json();
}

export async function getLeadById(id) {
  const res = await fetch(`${API_BASE}/api/leads/${id}`, {
    headers: getHeaders(),
  });
  return res.json();
}

export async function updateLeadStatus(id, data) {
  const res = await fetch(`${API_BASE}/api/leads/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

// ============================
// DASHBOARD
// ============================

export async function getAdminStats() {
  const res = await fetch(`${API_BASE}/api/leads/admin/stats`, {
    headers: getHeaders(),
  });
  return res.json();
}

export async function getDashboard() {
  const res = await fetch(`${API_BASE}/api/leads/dashboard`, {
    headers: getHeaders(),
  });
  return res.json();
}

// ============================
// HISTORY
// ============================

export async function getProjectHistory() {
  const res = await fetch(`${API_BASE}/api/leads/history`, {
    headers: getHeaders(),
  });
  return res.json();
}

// ============================
// AUTH
// ============================

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (data.token && typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
  }

  return data;
}