import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, BookOpen, Heart, Settings,
  LogOut, ChevronRight, Bell, FileText, Home, UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <>
      <div className="sidebar-section-title">{title}</div>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to.endsWith('dashboard')}>
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
  const { getParoquia, getCEB, getAlertas } = useData();
  const navigate = useNavigate();

  const paroquia = user?.paroquiaId ? getParoquia(user.paroquiaId) : null;
  const ceb = user?.cebId ? getCEB(user.cebId) : null;
  const alertas = user?.cebId ? getAlertas(user.cebId) : [];

  const handleLogout = () => {
    logout();
    navigate(user?.role === 'admin' ? '/admin/login' : '/login');
  };

  const adminItems: NavItem[] = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
    { to: '/admin/paroquias', icon: <Building2 size={17} />, label: 'Paróquias' },
  ];

  const paroquialItems: NavItem[] = [
    { to: '/paroquial/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
    { to: '/paroquial/cebs', icon: <Home size={17} />, label: 'CEBs' },
    { to: '/paroquial/pastorais', icon: <BookOpen size={17} />, label: 'Pastorais e Movimentos' },
    { to: '/paroquial/configuracoes', icon: <Settings size={17} />, label: 'Configurações' },
    { to: '/paroquial/relatorios', icon: <FileText size={17} />, label: 'Relatórios' },
  ];

  const cebItems: NavItem[] = [
    { to: '/cebs/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard', badge: alertas.length || undefined },
    { to: '/cebs/doacoes', icon: <Heart size={17} />, label: 'Doações' },
    { to: '/cebs/dizimistas', icon: <Users size={17} />, label: 'Dizimistas' },
    { to: '/cebs/conselheiros', icon: <UserCheck size={17} />, label: 'Conselheiros' },
  ];

  const navItems = user?.role === 'admin' ? adminItems : user?.role === 'paroquial' ? paroquialItems : cebItems;
  const sectionTitle = user?.role === 'admin' ? 'Administração' : user?.role === 'paroquial' ? 'Área Paroquial' : 'Área CEB';

  const userLabel = user?.role === 'admin' ? 'Administrador' : user?.role === 'paroquial' ? paroquia?.nome ?? 'Paróquia' : ceb?.nome ?? 'CEB';
  const initials = userLabel.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Heart size={18} color="white" fill="white" />
          </div>
          <div>
            {paroquia?.logoUrl ? (
              <img src={paroquia.logoUrl} alt="Logo" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', marginBottom: 2 }} />
            ) : null}
            <div className="sidebar-logo-text">Dízimo Digital</div>
            <div className="sidebar-logo-sub">{user?.role === 'admin' ? 'Admin do Sistema' : paroquia?.nome ?? ''}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavGroup title={sectionTitle} items={navItems} />
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
          <div className="top-bar-title" />
          <div className="top-bar-user">
            {alertas.length > 0 && (
              <div style={{ position: 'relative', marginRight: 4 }}>
                <Bell size={18} color="var(--warning)" />
                <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--danger)', color: 'white', borderRadius: '50%', width: 14, height: 14, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {alertas.length}
                </span>
              </div>
            )}
            <div className="user-avatar">{initials}</div>
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
