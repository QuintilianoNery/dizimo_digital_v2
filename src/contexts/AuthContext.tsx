import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthUser, UserRole } from '../types';
import { supabase, hasSupabaseConfig } from '../utils/supabase';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  loginAdmin: (email: string, senha: string) => Promise<string | null>;
  loginParoquial: (codigoOuNome: string, senha: string) => Promise<string | null>;
  loginCEB: (codigoOuNomeParoquia: string, codigoOuNomeCeb: string, senha: string) => Promise<string | null>;
  logout: () => void;
  isFirstAccess: () => Promise<boolean>;
  setupAdminPassword: (email: string, senha: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toIsoDateFromExpiresAt(expiresAt?: number | null) {
  if (!expiresAt) return undefined;
  return new Date(expiresAt * 1000).toISOString();
}

function withSessionMetadata(user: AuthUser, email: string, expiresAt?: number | null): AuthUser {
  return {
    ...user,
    email,
    sessionStartedAt: new Date().toISOString(),
    sessionExpiresAt: toIsoDateFromExpiresAt(expiresAt),
  };
}

async function resolveUserByEmail(email: string): Promise<AuthUser | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: admin } = await supabase
    .from('administradores')
    .select('id, nome, email, status')
    .eq('status', 'ativo')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (admin) {
    return { role: 'admin', adminId: admin.id, nome: admin.nome, email: admin.email };
  }

  const { data: paroquia } = await supabase
    .from('paroquias')
    .select('id, nome, email, email_login_secretaria, status')
    .eq('status', 'ativa')
    .or(`email.ilike.${normalizedEmail},email_login_secretaria.ilike.${normalizedEmail}`)
    .maybeSingle();

  if (paroquia) {
    return {
      role: 'paroquial',
      paroquiaId: paroquia.id,
      nome: paroquia.nome,
      email: paroquia.email_login_secretaria ?? paroquia.email,
    };
  }

  const { data: ceb } = await supabase
    .from('cebs')
    .select('id, paroquia_id, nome, email_login, status')
    .eq('status', 'ativa')
    .ilike('email_login', normalizedEmail)
    .maybeSingle();

  if (ceb) {
    return {
      role: 'ceb',
      paroquiaId: ceb.paroquia_id,
      cebId: ceb.id,
      nome: ceb.nome,
      email: ceb.email_login ?? email,
    };
  }

  return null;
}

async function resolveParoquiaByIdentifier(identifier: string) {
  let { data, error } = await supabase
    .from('paroquias')
    .select('id, nome, email, email_login_secretaria, codigo_paroquia, status')
    .eq('codigo_paroquia', identifier)
    .eq('status', 'ativa')
    .maybeSingle();

  if (!data && !error) {
    ({ data, error } = await supabase
      .from('paroquias')
      .select('id, nome, email, email_login_secretaria, codigo_paroquia, status')
      .ilike('nome', `%${identifier}%`)
      .eq('status', 'ativa')
      .maybeSingle());
  }

  if (error || !data) return null;
  return data;
}

async function resolveCebByIdentifier(paroquiaId: string, identifier: string) {
  let { data, error } = await supabase
    .from('cebs')
    .select('id, nome, email_login, codigo_ceb, paroquia_id, status')
    .eq('paroquia_id', paroquiaId)
    .eq('codigo_ceb', identifier)
    .eq('status', 'ativa')
    .maybeSingle();

  if (!data && !error) {
    ({ data, error } = await supabase
      .from('cebs')
      .select('id, nome, email_login, codigo_ceb, paroquia_id, status')
      .eq('paroquia_id', paroquiaId)
      .ilike('nome', `%${identifier}%`)
      .eq('status', 'ativa')
      .maybeSingle());
  }

  if (error || !data) return null;
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    void supabase.auth.signOut();
  }, []);

  const applyAuthSession = useCallback(async (session: any) => {
    const email = session?.user?.email as string | undefined;
    if (!email) {
      setUser(null);
      return;
    }

    const resolved = await resolveUserByEmail(email);
    if (!resolved) {
      setUser(null);
      void supabase.auth.signOut();
      return;
    }

    setUser(withSessionMetadata(resolved, email, session?.expires_at ?? null));
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.expires_at && session.expires_at * 1000 <= Date.now()) {
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }

      if (session) {
        await applyAuthSession(session);
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    void bootstrap();

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (!session) {
        setUser(null);
        return;
      }

      await applyAuthSession(session);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [applyAuthSession]);

  useEffect(() => {
    if (!user?.sessionExpiresAt) return;

    const expiresAt = new Date(user.sessionExpiresAt).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      logout();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      logout();
    }, expiresAt - Date.now());

    return () => window.clearTimeout(timeoutId);
  }, [logout, user]);

  const isFirstAccess = useCallback(async () => {
    if (!hasSupabaseConfig) {
      console.warn('Supabase não configurado. Não é possível verificar o primeiro acesso.');
      return false;
    }

    const { count, error } = await supabase
      .from('administradores')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.warn('Erro ao verificar primeiro acesso:', error);
      return false;
    }
    return (count ?? 0) === 0;
  }, []);

  const loginAdmin = useCallback(async (email: string, senha: string): Promise<string | null> => {
    if (!hasSupabaseConfig) return 'Supabase não configurado no projeto';

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error || !data.session) return 'Email ou senha inválidos';

    const resolved = await resolveUserByEmail(email);
    if (!resolved || resolved.role !== 'admin') {
      await supabase.auth.signOut();
      return 'Administrador não encontrado';
    }

    setUser(withSessionMetadata(resolved, data.user.email ?? email, data.session.expires_at ?? null));
    return null;
  }, []);

  const loginParoquial = useCallback(async (codigoOuNome: string, senha: string): Promise<string | null> => {
    if (!hasSupabaseConfig) return 'Supabase não configurado no projeto';

    const paroquia = await resolveParoquiaByIdentifier(codigoOuNome);
    if (!paroquia) return 'Paróquia não encontrada';

    const loginEmail = paroquia.email_login_secretaria || paroquia.email;
    if (!loginEmail) return 'Paróquia sem email de login configurado';

    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: senha });
    if (error || !data.session) return 'Paróquia não encontrada ou senha inválida';

    setUser(withSessionMetadata({ role: 'paroquial', paroquiaId: paroquia.id, nome: paroquia.nome, email: loginEmail }, data.user.email ?? loginEmail, data.session.expires_at ?? null));
    return null;
  }, []);

  const loginCEB = useCallback(async (codigoOuNomeParoquia: string, codigoOuNomeCeb: string, senha: string): Promise<string | null> => {
    if (!hasSupabaseConfig) return 'Supabase não configurado no projeto';

    const paroquia = await resolveParoquiaByIdentifier(codigoOuNomeParoquia);
    if (!paroquia) return 'Paróquia não encontrada';

    const ceb = await resolveCebByIdentifier(paroquia.id, codigoOuNomeCeb);
    if (!ceb) return 'CEB não encontrada';

    const loginEmail = ceb.email_login;
    if (!loginEmail) return 'CEB sem email de login configurado';

    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: senha });
    if (error || !data.session) return 'CEB não encontrada ou senha inválida';

    setUser(withSessionMetadata({ role: 'ceb', paroquiaId: paroquia.id, cebId: ceb.id, nome: ceb.nome, email: loginEmail }, data.user.email ?? loginEmail, data.session.expires_at ?? null));
    return null;
  }, []);

  const setupAdminPassword = useCallback(async (email: string, senha: string) => {
    if (!hasSupabaseConfig) {
      console.warn('Supabase não configurado. Não é possível criar o administrador.');
      return;
    }

    const firstAccess = await isFirstAccess();
    if (!firstAccess) {
      console.warn('Setup do administrador só deve ser usado no primeiro acesso.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error || !data.user) {
      console.warn('Erro ao criar usuário Supabase Auth:', error);
      return;
    }

    const { error: insertError } = await supabase
      .from('administradores')
      .upsert([{ nome: 'Administrador', email, senha, status: 'ativo' }], { onConflict: 'email' });

    if (insertError) console.warn('Erro ao registrar administrador no banco:', insertError);

    if (data.session) {
      setUser(withSessionMetadata({ role: 'admin', adminId: data.user.id, nome: 'Administrador', email }, email, data.session.expires_at ?? null));
    }
  }, [isFirstAccess]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    loading,
    loginAdmin,
    loginParoquial,
    loginCEB,
    logout,
    isFirstAccess,
    setupAdminPassword,
  }), [user, loading, loginAdmin, loginParoquial, loginCEB, logout, isFirstAccess, setupAdminPassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { UserRole };
