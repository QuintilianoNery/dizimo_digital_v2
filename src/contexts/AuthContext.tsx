import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, UserRole } from '../types';
import { storageGetOne, storageSet, KEYS } from '../utils/storage';
import { supabase } from '../utils/supabase';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = storageGetOne<AuthUser>(KEYS.AUTH_SESSION);
    if (session) setUser(session);
    setLoading(false);
  }, []);

  const isFirstAccess = useCallback(async () => {
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
    const { data, error } = await supabase
      .from('administradores')
      .select('*')
      .eq('email', email)
      .eq('senha', senha)
      .eq('status', 'ativo')
      .maybeSingle();

    if (error || !data) return 'Email ou senha inválidos';
    const u: AuthUser = { role: 'admin', adminId: data.id, nome: data.nome };
    setUser(u);
    storageSet(KEYS.AUTH_SESSION, u);
    return null;
  }, []);

  const loginParoquial = useCallback(async (codigoOuNome: string, senha: string): Promise<string | null> => {
    let { data, error } = await supabase
      .from('paroquias')
      .select('*')
      .eq('codigo_paroquia', codigoOuNome)
      .eq('senha', senha)
      .eq('status', 'ativa')
      .limit(1)
      .maybeSingle();

    if (!data && !error) {
      ({ data, error } = await supabase
        .from('paroquias')
        .select('*')
        .ilike('nome', `%${codigoOuNome}%`)
        .eq('senha', senha)
        .eq('status', 'ativa')
        .limit(1)
        .maybeSingle());
    }

    if (error || !data) return 'Paróquia não encontrada ou senha inválida';
    const u: AuthUser = { role: 'paroquial', paroquiaId: data.id, nome: data.nome };
    setUser(u);
    storageSet(KEYS.AUTH_SESSION, u);
    return null;
  }, []);

  const loginCEB = useCallback(
    async (codigoOuNomeParoquia: string, codigoOuNomeCeb: string, senha: string): Promise<string | null> => {
      let { data: paroquia, error } = await supabase
        .from('paroquias')
        .select('id, nome, codigo_paroquia, status')
        .eq('codigo_paroquia', codigoOuNomeParoquia)
        .eq('status', 'ativa')
        .limit(1)
        .maybeSingle();

      if (!paroquia && !error) {
        ({ data: paroquia, error } = await supabase
          .from('paroquias')
          .select('id, nome, codigo_paroquia, status')
          .ilike('nome', `%${codigoOuNomeParoquia}%`)
          .eq('status', 'ativa')
          .limit(1)
          .maybeSingle());
      }

      if (error || !paroquia) return 'Paróquia não encontrada';

      let { data: ceb, error: cebError } = await supabase
        .from('cebs')
        .select('*')
        .eq('paroquia_id', paroquia.id)
        .eq('codigo_ceb', codigoOuNomeCeb)
        .eq('senha', senha)
        .eq('status', 'ativa')
        .limit(1)
        .maybeSingle();

      if (!ceb && !cebError) {
        ({ data: ceb, error: cebError } = await supabase
          .from('cebs')
          .select('*')
          .eq('paroquia_id', paroquia.id)
          .ilike('nome', `%${codigoOuNomeCeb}%`)
          .eq('senha', senha)
          .eq('status', 'ativa')
          .limit(1)
          .maybeSingle());
      }

      if (cebError || !ceb) return 'CEB não encontrada ou senha inválida';

      const u: AuthUser = {
        role: 'ceb',
        paroquiaId: paroquia.id,
        cebId: ceb.id,
        nome: ceb.nome,
      };
      setUser(u);
      storageSet(KEYS.AUTH_SESSION, u);
      return null;
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('dizimo_digital_' + KEYS.AUTH_SESSION);
  }, []);

  const setupAdminPassword = useCallback(async (email: string, senha: string) => {
    const { data: admin, error } = await supabase
      .from('administradores')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Erro ao carregar administrador:', error);
      return;
    }

    if (!admin) {
      const { error: insertError } = await supabase
        .from('administradores')
        .insert([
          { nome: 'Administrador', email, senha, status: 'ativo' },
        ]);
      if (insertError) console.warn('Erro ao criar administrador:', insertError);
      return;
    }

    const { error: updateError } = await supabase
      .from('administradores')
      .update({ email, senha })
      .eq('id', admin.id);

    if (updateError) console.warn('Erro ao atualizar administrador:', updateError);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, loginAdmin, loginParoquial, loginCEB, logout, isFirstAccess, setupAdminPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { UserRole };
