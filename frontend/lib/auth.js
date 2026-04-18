const AUTH_EVENT = 'steelestimate-auth-change';

function notifyAuthChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function clearStoredToken() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('steelestimate_token');
  } catch (error) {
    // Ignore storage failures. Cookie-based auth is authoritative.
  }
  notifyAuthChange();
}

function hasValidSession() {
  return true;
}

function onAuthChange(callback) {
  if (typeof window === 'undefined') return () => {};

  const handler = () => callback();
  window.addEventListener(AUTH_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

function logout() {
  clearStoredToken();
  if (typeof window !== 'undefined') {
    window.location.replace('/admin/login');
  }
}

export {
  clearStoredToken,
  logout,
  hasValidSession,
  onAuthChange
};
