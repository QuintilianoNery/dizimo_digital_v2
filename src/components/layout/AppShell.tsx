import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, BookOpen, Heart, Settings,
  LogOut, Bell, FileText, Home, UserCheck, Cake, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { LogoMark } from '../ui/LogoMark';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

function NavGroup({ title, items, onNavigate }: { title: string; items: NavItem[]; onNavigate?: () => void }) {
  return (
    <>
      <div className="sidebar-section-title">{title}</div>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to.endsWith('dashboard')} onClick={onNavigate}>
          {item.icon}
          <span style={{ flex: 1 }}>{item.label}</span>
          {item.badge ? (
            <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '1px 6px', fontSize: 11, fontWeight: 600 }}>
              {item.badge}
            </span>
          ) : null}
        </NavLink>
      ))}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { getAdministrador, getParoquia, getCEB, getAlertas } = useData();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const admin = getAdministrador();
  const paroquia = user?.paroquiaId ? getParoquia(user.paroquiaId) : null;
  const ceb = user?.cebId ? getCEB(user.cebId) : null;
  const alertas = user?.cebId ? getAlertas(user.cebId) : [];

  const handleLogout = () => {
    logout();
    navigate(user?.role === 'admin' ? '/admin/login' : '/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const adminItems: NavItem[] = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
    { to: '/admin/paroquias', icon: <Building2 size={17} />, label: 'Paróquias' },
    { to: '/admin/configuracoes', icon: <Settings size={17} />, label: 'Configurações' },
  ];

  const paroquialItems: NavItem[] = [
    { to: '/paroquial/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
    { to: '/paroquial/cebs', icon: <Home size={17} />, label: 'CEBs' },
    { to: '/paroquial/aniversariantes', icon: <Cake size={17} />, label: 'Aniversariantes' },
    { to: '/paroquial/pastorais', icon: <BookOpen size={17} />, label: 'Pastorais e Movimentos' },
    { to: '/paroquial/configuracoes', icon: <Settings size={17} />, label: 'Configurações' },
    { to: '/paroquial/relatorios', icon: <FileText size={17} />, label: 'Relatórios' },
  ];

  const cebItems: NavItem[] = [
    { to: '/cebs/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard', badge: alertas.length || undefined },
    { to: '/cebs/doacoes', icon: <Heart size={17} />, label: 'Doações' },
    { to: '/cebs/dizimistas', icon: <Users size={17} />, label: 'Dizimistas' },
    { to: '/cebs/aniversariantes', icon: <Cake size={17} />, label: 'Aniversariantes' },
    { to: '/cebs/conselheiros', icon: <UserCheck size={17} />, label: 'Conselheiros' },
    { to: '/cebs/configuracoes', icon: <Settings size={17} />, label: 'Configurações' },
  ];

  const navItems = user?.role === 'admin' ? adminItems : user?.role === 'paroquial' ? paroquialItems : cebItems;
  const sectionTitle = user?.role === 'admin' ? 'Administração' : user?.role === 'paroquial' ? 'Área Paroquial' : 'Área CEB';

  const userLabel = user?.role === 'admin' ? 'Administrador' : user?.role === 'paroquial' ? paroquia?.nome ?? 'Paróquia' : ceb?.nome ?? 'CEB';
  const adminLogo = admin?.logoUrl;
  const paroquiaLogo = paroquia?.logoUrl;
  const cebLogo = ceb?.logoUrl;
  const shellLogo = user?.role === 'admin' ? adminLogo : paroquiaLogo;
  const avatarLogo = user?.role === 'admin' ? adminLogo : user?.role === 'paroquial' ? paroquiaLogo : cebLogo;
  const initials = userLabel.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="app-shell">
      <div className={`sidebar-backdrop${sidebarOpen ? ' open' : ''}`} onClick={closeSidebar} />
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <LogoMark
            src={shellLogo}
            alt={sectionTitle}
            size={36}
            radius={8}
            fallback={<Heart size={18} color="white" fill="white" />}
            background={user?.role === 'admin' ? 'rgba(255,255,255,.15)' : 'var(--accent)'}
          />
          <div>
            {paroquia?.logoUrl ? (
              <img src={paroquia.logoUrl} alt="Logo" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', marginBottom: 2 }} />
            ) : null}
            <div className="sidebar-logo-text">Dízimo Digital</div>
            <div className="sidebar-logo-sub">{user?.role === 'admin' ? 'Admin do Sistema' : paroquia?.nome ?? ''}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavGroup title={sectionTitle} items={navItems} onNavigate={closeSidebar} />
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', marginBottom: 4 }}>
            <div className="user-avatar" style={{ background: 'rgba(255,255,255,.15)', color: 'white' }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userLabel}</div>
              <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 11 }}>
                {user?.role === 'admin' ? 'Admin' : user?.role === 'paroquial' ? 'Paroquial' : 'CEB'}
              </div>
            </div>
          </div>
          <button className="nav-link logout-button" onClick={handleLogout}>
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="top-bar">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="top-bar-title">{sectionTitle}</div>
          <div className="top-bar-user">
            {alertas.length > 0 && (
              <div style={{ position: 'relative', marginRight: 4 }}>
                <Bell size={18} color="var(--warning)" />
                <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--danger)', color: 'white', borderRadius: '50%', width: 14, height: 14, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {alertas.length}
                </span>
              </div>
            )}
            <LogoMark
              src={avatarLogo}
              alt={userLabel}
              size={30}
              radius={999}
              fallback={<span>{initials}</span>}
              border="1px solid rgba(0,0,0,.06)"
              background="var(--primary-light)"
            />
            <span>{userLabel}</span>
          </div>
        </div>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
