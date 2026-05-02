import {
  clearAuthSession,
  hasAccessToken,
  onAuthChange
} from './authStore';

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
  clearAuthSession();
}

function hasValidSession() {
  return hasAccessToken();
}

function logout() {
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
