import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, UserRole } from '../types';
import { storageGet, storageGetOne, storageSet, KEYS } from '../utils/storage';
import type { Administrador, Paroquia, CEB } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  loginAdmin: (email: string, senha: string) => string | null;
  loginParoquial: (codigoOuNome: string, senha: string) => string | null;
  loginCEB: (codigoOuNomeParoquia: string, codigoOuNomeCeb: string, senha: string) => string | null;
  logout: () => void;
  isFirstAccess: () => boolean;
  setupAdminPassword: (email: string, senha: string) => void;
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

  const isFirstAccess = useCallback(() => {
    const admins = storageGet<Administrador>(KEYS.ADMIN);
    return admins.length === 0 || admins[0].senha === '';
  }, []);

  const loginAdmin = useCallback((email: string, senha: string): string | null => {
    const admins = storageGet<Administrador>(KEYS.ADMIN);
    const admin = admins.find((a) => a.email === email && a.senha === senha && a.status === 'ativo');
    if (!admin) return 'Email ou senha inválidos';
    const u: AuthUser = { role: 'admin', adminId: admin.id, nome: admin.nome };
    setUser(u);
    storageSet(KEYS.AUTH_SESSION, u);
    return null;
  }, []);

  const loginParoquial = useCallback((codigoOuNome: string, senha: string): string | null => {
    const paroquias = storageGet<Paroquia>(KEYS.PAROQUIAS);
    const paroquia = paroquias.find(
      (p) =>
        (p.codigoParoquia === codigoOuNome ||
          p.nome.toLowerCase().includes(codigoOuNome.toLowerCase())) &&
        p.senha === senha &&
        p.status === 'ativa',
    );
    if (!paroquia) return 'Paróquia não encontrada ou senha inválida';
    const u: AuthUser = { role: 'paroquial', paroquiaId: paroquia.id, nome: paroquia.nome };
    setUser(u);
    storageSet(KEYS.AUTH_SESSION, u);
    return null;
  }, []);

  const loginCEB = useCallback(
    (codigoOuNomeParoquia: string, codigoOuNomeCeb: string, senha: string): string | null => {
      const paroquias = storageGet<Paroquia>(KEYS.PAROQUIAS);
      const paroquia = paroquias.find(
        (p) =>
          p.codigoParoquia === codigoOuNomeParoquia ||
          p.nome.toLowerCase().includes(codigoOuNomeParoquia.toLowerCase()),
      );
      if (!paroquia) return 'Paróquia não encontrada';

      const cebs = storageGet<CEB>(KEYS.CEBS);
      const ceb = cebs.find(
        (c) =>
          c.paroquiaId === paroquia.id &&
          (c.codigoCeb === codigoOuNomeCeb ||
            c.nome.toLowerCase().includes(codigoOuNomeCeb.toLowerCase())) &&
          c.senha === senha &&
          c.status === 'ativa',
      );
      if (!ceb) return 'CEB não encontrada ou senha inválida';

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

  const setupAdminPassword = useCallback((email: string, senha: string) => {
    const admins = storageGet<Administrador>(KEYS.ADMIN);
    const now = new Date().toISOString();
    if (admins.length === 0) {
      const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      storageSet(KEYS.ADMIN, [
        { id, nome: 'Administrador', email, senha, status: 'ativo', createdAt: now, updatedAt: now },
      ]);
    } else {
      admins[0].email = email;
      admins[0].senha = senha;
      admins[0].updatedAt = now;
      storageSet(KEYS.ADMIN, admins);
    }
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
