'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
  verifyLogin2FA
} from '../lib/api';
import {
  clearAuthSession,
  getAccessToken,
  getCurrentUser,
  onAuthChange,
  setCurrentUser
} from '../lib/authStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(null);
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncFromStore = useCallback(() => {
    setAccessTokenState(getAccessToken());
    setUserState(getCurrentUser());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      try {
        const response = await refreshSession();
        const payload = response?.data || response || {};
        if (!cancelled) {
          setAccessTokenState(payload.accessToken || null);
          setUserState(payload.user || null);
        }
      } catch (_) {
        clearAuthSession();
        if (!cancelled) {
          setAccessTokenState(null);
          setUserState(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();
    const unsubscribe = onAuthChange(syncFromStore);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [syncFromStore]);

  const login = useCallback(async (payload) => {
    const response = await loginRequest(payload);
    syncFromStore();
    return response;
  }, [syncFromStore]);

  const verify2FA = useCallback(async (payload) => {
    const response = await verifyLogin2FA(payload);
    syncFromStore();
    return response;
  }, [syncFromStore]);

  const logout = useCallback(async () => {
    await logoutRequest();
    clearAuthSession();
    syncFromStore();
  }, [syncFromStore]);

  const reloadUser = useCallback(async () => {
    const nextUser = await getMe();
    setCurrentUser(nextUser);
    syncFromStore();
    return nextUser;
  }, [syncFromStore]);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      loading,
      authenticated: Boolean(accessToken),
      login,
      verify2FA,
      logout,
      reloadUser
    }),
    [accessToken, loading, login, logout, reloadUser, user, verify2FA]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
