const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = data?.message || data?.error || "Request failed";
    throw new Error(message);
  }

  return data;
}

export async function getMe() {
  return request("/auth/me");
}

export async function getPlans() {
  return request("/payments/plans");
}

export async function createPaymentOrder(planId) {
  return request("/payments/create-order", {
    method: "POST",
    body: JSON.stringify({ planId }),
  });
}

export async function verifyPayment(payload) {
  return request("/payments/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export default request;