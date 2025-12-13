import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthUser = {
  id: number;
  email?: string;
  role?: string;
  companyId?: number;
};

type AuthState = {
  authLoaded: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  setAuthenticated: (v: boolean) => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Prime from localStorage to avoid initial flicker
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.isAuthenticated) {
          setAuthenticated(true);
          setUser({ id: parsed.id, email: parsed.email, role: parsed.role, companyId: parsed.companyId });
        }
      }
    } catch {}

    // Verify with server
    (async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data?.user?.id) {
            setAuthenticated(true);
            setUser({ id: data.user.id, email: data.user.email, role: data.user.role, companyId: data.user.companyId });
          } else {
            setAuthenticated(false);
            setUser(null);
          }
        } else if (res.status === 401) {
          setAuthenticated(false);
          setUser(null);
        } else {
          // Non-401 error: keep provisional state, but mark loaded
        }
      } catch {
        // Network errors: keep provisional state
      } finally {
        setAuthLoaded(true);
      }
    })();
    
    // Listen to login/logout events and storage changes
    const onAuthLogin = (e: any) => {
      const detail = e?.detail;
      if (detail && detail.id) {
        setAuthenticated(true);
        setUser({ id: detail.id, email: detail.email, role: detail.role, companyId: detail.companyId });
      }
    };
    const onAuthLogout = () => {
      setAuthenticated(false);
      setUser(null);
    };
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === 'currentUser') {
        try {
          const val = ev.newValue ? JSON.parse(ev.newValue) : null;
          if (val && val.isAuthenticated) {
            setAuthenticated(true);
            setUser({ id: val.id, email: val.email, role: val.role, companyId: val.companyId });
          } else {
            setAuthenticated(false);
            setUser(null);
          }
        } catch {}
      }
    };
    window.addEventListener('auth:login', onAuthLogin as EventListener);
    window.addEventListener('auth:logout', onAuthLogout);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('auth:login', onAuthLogin as EventListener);
      window.removeEventListener('auth:logout', onAuthLogout);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const value = useMemo(() => ({ authLoaded, isAuthenticated, user, setUser, setAuthenticated }), [authLoaded, isAuthenticated, user]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


