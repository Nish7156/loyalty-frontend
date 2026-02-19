import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { PlatformUser, StaffUser } from '../lib/api';

export type AuthRole = 'SUPER_ADMIN' | 'PARTNER_OWNER' | 'STAFF';

export type AuthState =
  | { type: 'platform'; user: PlatformUser; token: string }
  | { type: 'staff'; staff: StaffUser; token: string }
  | { type: 'none' };

function getRole(state: AuthState): AuthRole | null {
  if (state.type === 'platform') return state.user.role;
  if (state.type === 'staff') return 'STAFF';
  return null;
}

const AuthContext = createContext<{
  auth: AuthState;
  role: AuthRole | null;
  token: string | null;
  loginPlatform: (user: PlatformUser, token: string) => void;
  loginStaff: (staff: StaffUser, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const raw = localStorage.getItem('auth');
    if (!raw) return { type: 'none' as const };
    try {
      const data = JSON.parse(raw);
      if (data.type === 'platform' && data.user && data.token) {
        return { type: 'platform', user: data.user, token: data.token };
      }
      if (data.type === 'staff' && data.staff && data.token) {
        return { type: 'staff', staff: data.staff, token: data.token };
      }
    } catch {}
    return { type: 'none' as const };
  });

  const persist = useCallback((state: AuthState) => {
    if (state.type === 'none') {
      localStorage.removeItem('auth');
      localStorage.removeItem('access_token');
    } else {
      const token = state.type === 'platform' ? state.token : state.token;
      localStorage.setItem('access_token', token);
      localStorage.setItem('auth', JSON.stringify(state));
    }
  }, []);

  const loginPlatform = useCallback(
    (user: PlatformUser, token: string) => {
      const next: AuthState = { type: 'platform', user, token };
      setAuth(next);
      persist(next);
    },
    [persist]
  );

  const loginStaff = useCallback(
    (staff: StaffUser, token: string) => {
      const next: AuthState = { type: 'staff', staff, token };
      setAuth(next);
      persist(next);
    },
    [persist]
  );

  const logout = useCallback(() => {
    setAuth({ type: 'none' });
    persist({ type: 'none' });
  }, [persist]);

  const value = useMemo(
    () => ({
      auth,
      role: getRole(auth),
      token: auth.type === 'none' ? null : auth.token,
      loginPlatform,
      loginStaff,
      logout,
      isAuthenticated: auth.type !== 'none',
    }),
    [auth, loginPlatform, loginStaff, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
