const AUTH_EVENT = 'steelestimate-auth-change';

let accessToken = null;
let currentUser = null;

function emitAuthChange(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail }));
}

export function getAccessToken() {
  return accessToken;
}

export function setAuthSession(token, user = null) {
  accessToken = token || null;
  currentUser = user || currentUser;
  emitAuthChange({ type: accessToken ? 'authenticated' : 'cleared', user: currentUser });
}

export function clearAuthSession() {
  accessToken = null;
  currentUser = null;
  emitAuthChange({ type: 'cleared' });
}

export function getCurrentUser() {
  return currentUser;
}

export function setCurrentUser(user) {
  currentUser = user || null;
  emitAuthChange({ type: 'user', user: currentUser });
}

export function hasAccessToken() {
  return Boolean(accessToken);
}

export function onAuthChange(callback) {
  if (typeof window === 'undefined') return () => {};

  const handler = (event) => callback(event.detail);
  window.addEventListener(AUTH_EVENT, handler);

  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
  };
}

export { AUTH_EVENT };
