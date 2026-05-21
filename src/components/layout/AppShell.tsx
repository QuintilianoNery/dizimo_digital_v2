import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Church, Users, Heart, Settings, BarChart3,
  LogOut, Menu, X, ChevronRight, Gift, UserCheck, Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
    { label: 'Paróquias', path: '/admin/paroquias', icon: <Church size={16} /> },
    { label: 'Configurações', path: '/admin/configuracoes', icon: <Settings size={16} /> },
  ],
  paroquial: [
    { label: 'Dashboard', path: '/paroquial/dashboard', icon: <LayoutDashboard size={16} /> },
    { label: 'CEBs', path: '/paroquial/cebs', icon: <Users size={16} /> },
    { label: 'Pastorais', path: '/paroquial/pastorais', icon: <Heart size={16} /> },
    { label: 'Aniversariantes', path: '/paroquial/aniversariantes', icon: <Calendar size={16} /> },
    { label: 'Relatórios', path: '/paroquial/relatorios', icon: <BarChart3 size={16} /> },
    { label: 'Configurações', path: '/paroquial/configuracoes', icon: <Settings size={16} /> },
  ],
  ceb: [
    { label: 'Dashboard', path: '/cebs/dashboard', icon: <LayoutDashboard size={16} /> },
    { label: 'Doações', path: '/cebs/doacoes', icon: <Gift size={16} /> },
    { label: 'Dizimistas', path: '/cebs/dizimistas', icon: <Users size={16} /> },
    { label: 'Conselheiros', path: '/cebs/conselheiros', icon: <UserCheck size={16} /> },
    { label: 'Aniversariantes', path: '/cebs/aniversariantes', icon: <Calendar size={16} /> },
    { label: 'Configurações', path: '/cebs/configuracoes', icon: <Settings size={16} /> },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  paroquial: 'Secretaria Paroquial',
  ceb: 'Comunidade (CEB)',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = NAV_BY_ROLE[user?.role ?? ''] ?? [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 220 : 56,
        minWidth: sidebarOpen ? 220 : 56,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .2s, min-width .2s',
        overflow: 'hidden',
      }}>
        {/* Logo/Header */}
        <div style={{ padding: '16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--brand)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <Church size={18} color="#fff" />
          </div>
          {sidebarOpen && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap' }}>Dízimo Digital</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{ROLE_LABELS[user?.role ?? '']}</div>
            </div>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-end' : 'center', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
        >
          {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
        </button>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={!sidebarOpen ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 6, border: 'none',
                  background: active ? 'var(--brand-light)' : 'transparent',
                  color: active ? 'var(--brand)' : 'var(--text-2)',
                  cursor: 'pointer', fontWeight: active ? 600 : 400,
                  fontSize: 13, textAlign: 'left', whiteSpace: 'nowrap',
                  transition: 'background .15s',
                }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && active && <ChevronRight size={12} style={{ marginLeft: 'auto' }} />}
              </button>
            );
          })}
        </nav>

        {/* User/Logout */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
          {sidebarOpen && user && (
            <div style={{ padding: '8px 10px', marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.nome}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'Sair' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 6, border: 'none',
              background: 'transparent', color: 'var(--red)',
              cursor: 'pointer', fontSize: 13, width: '100%',
              fontWeight: 500, whiteSpace: 'nowrap',
            }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {sidebarOpen && 'Sair'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
