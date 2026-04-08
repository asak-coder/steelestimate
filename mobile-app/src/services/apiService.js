const { Platform } = require('react-native');

const API_BASE_URL = 'https://steelestimate.onrender.com/api/v1';

function normalizeError(error) {
  if (!error) {
    return new Error('Unknown API error');
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (error instanceof Error) {
    return error;
  }

  if (error.response && error.response.data) {
    const data = error.response.data;
    const message =
      typeof data === 'string'
        ? data
        : data.message || data.error || 'Request failed';
    return new Error(message);
  }

  if (error.message) {
    return new Error(error.message);
  }

  return new Error('Request failed');
}

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let payload = null;
  const text = await response.text();

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (parseError) {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && (payload.message || payload.error)) ||
      (typeof payload === 'string' ? payload : null) ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload;
}

module.exports = {
  API_BASE_URL,
  normalizeError,
  request,
};