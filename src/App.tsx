import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { ToastProvider } from '@/components/ui';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage, AdminLoginPage } from '@/pages/auth/LoginPage';
import { AdminDashboard, ParoquiasPage, ConfiguracoesAdminPage } from '@/pages/admin';
import {
  DashboardParoquial, CEBsPage, PastoraisPage,
  ConfiguracoesParoquialPage, RelatoriosParoquialPage,
  ConfiguracoesCEBPage,
} from '@/pages/paroquial/pages';
import { AniversariantesPage } from '@/pages/paroquial/aniversariantes';
import {
  DashboardCEB, DoacoesPage, DizimistasPage,
  ConselheirosPage, AniversariantesCEBPage,
} from '@/pages/cebs';
import type { UserRole } from '@/types';

// ── Auth Guard ────────────────────────────────────────────────────────────────

function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: UserRole | UserRole[];
}) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="15" />
          </svg>
          <p style={{ marginTop: 12, color: 'var(--text-3)', fontSize: 13 }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roles = role ? (Array.isArray(role) ? role : [role]) : null;
  if (roles && user && !roles.includes(user.role)) {
    // Redireciona para o dashboard correto do role do usuário
    const redirectMap: Record<UserRole, string> = {
      admin: '/admin/dashboard',
      paroquial: '/paroquial/dashboard',
      ceb: '/cebs/dashboard',
    };
    return <Navigate to={redirectMap[user.role]} replace />;
  }

  return <>{children}</>;
}

// ── Shell Wrapper ─────────────────────────────────────────────────────────────

function ShellRoute({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}

// ── Root Redirect ─────────────────────────────────────────────────────────────

function RootRedirect() {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const map: Record<UserRole, string> = {
    admin: '/admin/dashboard',
    paroquial: '/paroquial/dashboard',
    ceb: '/cebs/dashboard',
  };
  return <Navigate to={map[user!.role]} replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <>
      <GlobalStyles />
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <DataProvider>
              <Routes>
                {/* Raiz */}
                <Route path="/" element={<RootRedirect />} />

                {/* Auth */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />

                {/* ── ADMIN ── */}
                <Route path="/admin/dashboard" element={
                  <RequireAuth role="admin"><ShellRoute><AdminDashboard /></ShellRoute></RequireAuth>
                } />
                <Route path="/admin/paroquias" element={
                  <RequireAuth role="admin"><ShellRoute><ParoquiasPage /></ShellRoute></RequireAuth>
                } />
                <Route path="/admin/configuracoes" element={
                  <RequireAuth role="admin"><ShellRoute><ConfiguracoesAdminPage /></ShellRoute></RequireAuth>
                } />

                {/* ── PAROQUIAL ── */}
                <Route path="/paroquial/dashboard" element={
                  <RequireAuth role="paroquial"><ShellRoute><DashboardParoquial /></ShellRoute></RequireAuth>
                } />
                <Route path="/paroquial/cebs" element={
                  <RequireAuth role="paroquial"><ShellRoute><CEBsPage /></ShellRoute></RequireAuth>
                } />
                <Route path="/paroquial/pastorais" element={
                  <RequireAuth role="paroquial"><ShellRoute><PastoraisPage /></ShellRoute></RequireAuth>
                } />
                <Route path="/paroquial/aniversariantes" element={
                  <RequireAuth role="paroquial"><ShellRoute><AniversariantesPage /></ShellRoute></RequireAuth>
                } />
                <Route path="/paroquial/relatorios" element={
                  <RequireAuth role="paroquial"><ShellRoute><RelatoriosParoquialPage /></ShellRoute></RequireAuth>
                } />
                <Route path="/paroquial/configuracoes" element={
                  <RequireAuth role="paroquial"><ShellRoute><ConfiguracoesParoquialPage /></ShellRoute></RequireAuth>
                } />

                {/* ── CEBs ── */}
                <Route path="/cebs/dashboard" element={
                  <RequireAuth role="ceb"><ShellRoute><DashboardCEB /></ShellRoute></RequireAuth>
                } />
                <Route path="/cebs/doacoes" element={
                  <RequireAuth role="ceb"><ShellRoute><DoacoesPage /></ShellRoute></RequireAuth>
                } />
                <Route path="/cebs/dizimistas" element={
                  <RequireAuth role="ceb"><ShellRoute><DizimistasPage /></ShellRoute></RequireAuth>
                } />
                <Route path="/cebs/conselheiros" element={
                  <RequireAuth role="ceb"><ShellRoute><ConselheirosPage /></ShellRoute></RequireAuth>
                } />
                <Route path="/cebs/aniversariantes" element={
                  <RequireAuth role="ceb"><ShellRoute><AniversariantesCEBPage /></ShellRoute></RequireAuth>
                } />
                <Route path="/cebs/configuracoes" element={
                  <RequireAuth role="ceb"><ShellRoute><ConfiguracoesCEBPage /></ShellRoute></RequireAuth>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </DataProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </>
  );
}

// ── Global CSS Variables & Styles ─────────────────────────────────────────────

function GlobalStyles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :root {
        /* Cores base — modo claro */
        --bg:           #f5f6fa;
        --surface:      #ffffff;
        --surface-2:    #f8f9fc;
        --border:       #e5e7eb;
        --text-1:       #111827;
        --text-2:       #374151;
        --text-3:       #9ca3af;

        /* Marca */
        --brand:        #4f46e5;
        --brand-dark:   #312e81;
        --brand-light:  #eef2ff;

        /* Semânticas */
        --green:        #16a34a;
        --red:          #dc2626;
        --amber:        #d97706;
        --blue:         #2563eb;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --bg:           #0f1117;
          --surface:      #1a1d27;
          --surface-2:    #141620;
          --border:       #2a2d3e;
          --text-1:       #f1f5f9;
          --text-2:       #cbd5e1;
          --text-3:       #64748b;
          --brand-light:  #1e1b4b;
        }
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--bg);
        color: var(--text-1);
        font-size: 14px;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
      }

      input, select, textarea, button {
        font-family: inherit;
      }

      input:focus, select:focus, textarea:focus {
        outline: 2px solid var(--brand);
        outline-offset: 0;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @keyframes slideIn {
        from { transform: translateX(20px); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
      }

      /* Scrollbar */
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: var(--text-3); }
    `}</style>
  );
}
