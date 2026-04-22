const AUTH_EVENT = 'steelestimate-auth-change';

function notifyAuthChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function getLoginPath() {
  if (typeof window === 'undefined') return '/login';

  const hostname = window.location.hostname.toLowerCase();
  if (hostname === 'admin.steelestimate.com') {
    return '/admin/login';
  }

  return '/login';
}

function clearStoredToken() {
  if (typeof window === 'undefined') return;
  notifyAuthChange();
}

function hasValidSession() {
  if (typeof window === 'undefined') return false;

  return Boolean(
    window.document.cookie.includes('authToken=') ||
    window.localStorage.getItem('authToken') ||
    window.sessionStorage.getItem('authToken')
  );
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
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('authToken');
    window.sessionStorage.removeItem('authToken');
  }
  clearStoredToken();
  if (typeof window !== 'undefined') {
    window.location.replace(getLoginPath());
  }
}

export {
  clearStoredToken,
  logout,
  hasValidSession,
  onAuthChange
};
