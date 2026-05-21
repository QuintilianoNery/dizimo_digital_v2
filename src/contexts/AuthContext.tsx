import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, signIn, signOut } from '@/services/auth.service';
import type { AppUser, UserRole, AuthState } from '@/types';

// ── Context ───────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (
    email: string,
    password: string,
    expectedRole?: UserRole | UserRole[]
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  /** Carrega o usuário a partir da sessão Supabase ativa */
  const loadUser = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const user = await getCurrentUser();
      setState({ user, isAuthenticated: !!user, loading: false });
    } catch {
      setState({ user: null, isAuthenticated: false, loading: false });
    }
  }, []);

  // Escuta mudanças de sessão do Supabase (login, logout, refresh)
  useEffect(() => {
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          void loadUser();
        } else if (event === 'SIGNED_OUT') {
          setState({ user: null, isAuthenticated: false, loading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string, expectedRole?: UserRole | UserRole[]) => {
      const { user, role } = await signIn(email, password);
      const expectedRoles = Array.isArray(expectedRole) ? expectedRole : expectedRole ? [expectedRole] : [];
      if (expectedRoles.length > 0 && !expectedRoles.includes(role)) {
        await signOut();
        throw new Error('Acesso negado para este perfil.');
      }
      setState({ user, isAuthenticated: true, loading: false });
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut();
    setState({ user: null, isAuthenticated: false, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
