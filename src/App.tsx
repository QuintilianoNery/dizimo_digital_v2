import { useEffect } from 'react';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ToastProvider } from './components/ui/index';
import { AppShell } from './components/layout/AppShell';
import { AdminLoginPage, LoginPage } from './pages/auth/LoginPage';
import { AdminDashboard, ParoquiasPage, ConfiguracoesAdminPage } from './pages/admin/index';
import { DashboardParoquial, CEBsPage, PastoraisPage, ConfiguracoesParoquialPage, ConfiguracoesCEBPage, RelatoriosParoquialPage } from './pages/paroquial/pages';
import { AniversariantesPage } from './pages/paroquial/aniversariantes';
import { DashboardCEB, DoacoesPage, DizimistasPage, AniversariantesCEBPage, ConselheirosPage } from './pages/cebs/index';
import { seedInitialData } from './utils/seed';
import { initializeBackend, getBackendType } from './utils/backend';
import './index.css';

// Inicializa o backend (Supabase ou LocalStorage)
initializeBackend().then((connected) => {
  const backend = getBackendType();
  console.log(`✓ Backend inicializado: ${backend}`);
});

// Se Supabase não estiver configurado, usa dados locais
seedInitialData();

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: 'admin' | 'paroquial' | 'ceb' }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div style={{ fontSize: 14, color: 'var(--text-3)' }}>Carregando...</div></div>;
  if (!isAuthenticated) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} />;
  if (user?.role !== role) return <Navigate to="/login" />;
  return <AppShell>{children}</AppShell>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/paroquias" element={<ProtectedRoute role="admin"><ParoquiasPage /></ProtectedRoute>} />
      <Route path="/admin/configuracoes" element={<ProtectedRoute role="admin"><ConfiguracoesAdminPage /></ProtectedRoute>} />

      {/* Paroquial */}
      <Route path="/paroquial/dashboard" element={<ProtectedRoute role="paroquial"><DashboardParoquial /></ProtectedRoute>} />
      <Route path="/paroquial/cebs" element={<ProtectedRoute role="paroquial"><CEBsPage /></ProtectedRoute>} />
      <Route path="/paroquial/aniversariantes" element={<ProtectedRoute role="paroquial"><AniversariantesPage /></ProtectedRoute>} />
      <Route path="/paroquial/pastorais" element={<ProtectedRoute role="paroquial"><PastoraisPage /></ProtectedRoute>} />
      <Route path="/paroquial/configuracoes" element={<ProtectedRoute role="paroquial"><ConfiguracoesParoquialPage /></ProtectedRoute>} />
      <Route path="/paroquial/relatorios" element={<ProtectedRoute role="paroquial"><RelatoriosParoquialPage /></ProtectedRoute>} />

      {/* CEBs */}
      <Route path="/cebs/dashboard" element={<ProtectedRoute role="ceb"><DashboardCEB /></ProtectedRoute>} />
      <Route path="/cebs/doacoes" element={<ProtectedRoute role="ceb"><DoacoesPage /></ProtectedRoute>} />
      <Route path="/cebs/dizimistas" element={<ProtectedRoute role="ceb"><DizimistasPage /></ProtectedRoute>} />
      <Route path="/cebs/aniversariantes" element={<ProtectedRoute role="ceb"><AniversariantesCEBPage /></ProtectedRoute>} />
      <Route path="/cebs/conselheiros" element={<ProtectedRoute role="ceb"><ConselheirosPage /></ProtectedRoute>} />
      <Route path="/cebs/configuracoes" element={<ProtectedRoute role="ceb"><ConfiguracoesCEBPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function SeedWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => { seedInitialData(); }, []);
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <BrowserRouter>
        <DataProvider>
          <SeedWrapper>
            <AuthProvider>
              <ToastProvider>
                <AppRoutes />
              </ToastProvider>
            </AuthProvider>
          </SeedWrapper>
        </DataProvider>
      </BrowserRouter>
      <SpeedInsights />
    </>
  );
}
