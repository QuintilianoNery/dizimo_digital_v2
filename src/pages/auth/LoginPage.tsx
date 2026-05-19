import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, EyeOff, Building2, Home, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Alert } from '../../components/ui/index';
import { LogoMark } from '../../components/ui/LogoMark';
import { storageGetOne, storageSet } from '../../utils/storage';
import type { Paroquia, CEB } from '../../types';

// ── ADMIN LOGIN ────────────────────────────────────────────────────────────
export function AdminLoginPage() {
  const { loginAdmin, isFirstAccess, setupAdminPassword, isAuthenticated, user } = useAuth();
  const { getAdministrador } = useData();
  const navigate = useNavigate();
  const admin = getAdministrador();
  const [email, setEmail] = useState('admin@dizimo.com');
  const [senha, setSenha] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [isFirst, setIsFirst] = useState(false);
  const [senhaConfirm, setSenhaConfirm] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (isAuthenticated && user?.role === 'admin') navigate('/admin/dashboard');

    const checkFirstAccess = async () => {
      const first = await isFirstAccess();
      if (!cancelled) setIsFirst(first);
    };
    checkFirstAccess();

    return () => { cancelled = true; };
  }, [isAuthenticated, user, isFirstAccess, navigate]);

  const handleSubmit = async () => {
    setError('');
    if (isFirst) {
      if (!email || !senha) { setError('Preencha todos os campos'); return; }
      if (senha !== senhaConfirm) { setError('As senhas não coincidem'); return; }
      if (senha.length < 6) { setError('Senha deve ter ao menos 6 caracteres'); return; }
      await setupAdminPassword(email, senha);
      const err = await loginAdmin(email, senha);
      if (!err) navigate('/admin/dashboard');
    } else {
      const err = await loginAdmin(email, senha);
      if (err) setError(err);
      else navigate('/admin/dashboard');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <LogoMark
          src={admin?.logoUrl}
          alt="Logo administrativa"
          size={72}
          radius={20}
          fallback={<Heart size={32} color="white" fill="white" />}
          background={admin?.logoUrl ? 'transparent' : 'var(--accent)'}
        />
        <h1>Dízimo Digital</h1>
        <p>Sistema de gestão de dízimos, doações e ofertas das comunidades eclesiais.</p>
        <div style={{ marginTop: 40, padding: '16px', background: 'rgba(255,255,255,.08)', borderRadius: 10, width: '100%' }}>
          <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 12, marginBottom: 8, fontWeight: 500, letterSpacing: '.05em', textTransform: 'uppercase' }}>Área Administrativa</div>
          <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 13 }}>Acesso exclusivo para gerenciamento global do sistema, cadastro de paróquias e relatórios administrativos.</div>
        </div>
      </div>
      <div className="auth-form-area">
        <div className="auth-form-card">
          <div className="auth-card-mobile-logo">
            <LogoMark
              src={admin?.logoUrl}
              alt="Logo administrativa"
              size={120}
              radius={22}
              fallback={<Heart size={40} color="white" fill="white" />}
              background={admin?.logoUrl ? 'transparent' : 'var(--accent)'}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: 'var(--primary-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, margin: 0 }}>{isFirst ? 'Primeiro acesso' : 'Área Administrativa'}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                {isFirst ? 'Crie a senha do administrador' : 'Acesso restrito ao administrador'}
              </p>
            </div>
          </div>

          {isFirst && (
            <Alert
              variant="info"
              title="Primeiro acesso"
              message="Este é o primeiro acesso ao sistema. Crie as credenciais do administrador para continuar."
              icon={<Shield size={16} />}
            />
          )}

          {error && <Alert variant="danger" title="Erro" message={error} />}

          <div className="form-group">
            <label className="form-label">Email do administrador</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showPwd ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder="••••••••" style={{ paddingRight: 40 }} />
              <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {isFirst && (
            <div className="form-group">
              <label className="form-label">Confirmar senha</label>
              <input className="form-input" type="password" value={senhaConfirm} onChange={(e) => setSenhaConfirm(e.target.value)} placeholder="••••••••" />
            </div>
          )}
          <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit}>
            {isFirst ? 'Criar conta e entrar' : 'Entrar'}
          </button>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <a href="/login" style={{ fontSize: 13, color: 'var(--text-3)' }}>← Acesso Paroquial / CEBs</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PAROQUIAL / CEB LOGIN ──────────────────────────────────────────────────
export function LoginPage() {
  const { loginParoquial, loginCEB, isAuthenticated, user } = useAuth();
  const { getParoquias, getCEBs, getAdministrador } = useData();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'paroquial' | 'ceb'>('paroquial');

  // Paroquial state
  const [pSearch, setPSearch] = useState('');
  const [pSelected, setPSelected] = useState<Paroquia | null>(null);
  const [pSenha, setPSenha] = useState('');
  const [pRemember, setPRemember] = useState(false);
  const [pDropOpen, setPDropOpen] = useState(false);

  // CEB state
  const [cPSearch, setCPSearch] = useState('');
  const [cPSelected, setCPSelected] = useState<Paroquia | null>(null);
  const [cSearch, setCSearch] = useState('');
  const [cSelected, setCSelected] = useState<CEB | null>(null);
  const [cSenha, setCSenha] = useState('');
  const [cRemember, setCRemember] = useState(false);
  const [cPDropOpen, setCPDropOpen] = useState(false);
  const [cDropOpen, setCDropOpen] = useState(false);

  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const paroquias = getParoquias().filter((p) => p.status === 'ativa');
  const cebsForParoquia = cPSelected ? getCEBs(cPSelected.id).filter((c) => c.status === 'ativa') : [];

  const filteredPar = paroquias.filter((p) =>
    p.nome.toLowerCase().includes(pSearch.toLowerCase()) || p.codigoParoquia.includes(pSearch),
  );
  const filteredCPar = paroquias.filter((p) =>
    p.nome.toLowerCase().includes(cPSearch.toLowerCase()) || p.codigoParoquia.includes(cPSearch),
  );
  const filteredCebs = cebsForParoquia.filter((c) =>
    c.nome.toLowerCase().includes(cSearch.toLowerCase()) || c.codigoCeb.includes(cSearch),
  );

  const admin = getAdministrador();
  const selectedLoginLogo = tab === 'paroquial'
    ? (pSelected?.logoUrl ?? admin?.logoUrl)
    : (cSelected?.logoUrl ?? cPSelected?.logoUrl ?? admin?.logoUrl);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'paroquial') navigate('/paroquial/dashboard');
      else if (user?.role === 'ceb') navigate('/cebs/dashboard');
    }
    // Load remembered login
    const rem = storageGetOne<{ type: string; paroquiaId?: string; cebId?: string }>('remember_login');
    if (rem) {
      if (rem.type === 'paroquial' && rem.paroquiaId) {
        const p = paroquias.find((x) => x.id === rem.paroquiaId);
        if (p) { setPSelected(p); setPSearch(p.nome); setPRemember(true); }
      } else if (rem.type === 'ceb' && rem.paroquiaId && rem.cebId) {
        const p = paroquias.find((x) => x.id === rem.paroquiaId);
        if (p) {
          setCPSelected(p); setCPSearch(p.nome);
          const cebs = getCEBs(p.id);
          const c = cebs.find((x) => x.id === rem.cebId);
          if (c) { setCSelected(c); setCSearch(c.nome); setCRemember(true); setTab('ceb'); }
        }
      }
    }
  }, [isAuthenticated, user, navigate, paroquias, getCEBs]);

  const handleParoquialLogin = async () => {
    setError('');
    if (!pSelected) { setError('Selecione a paróquia'); return; }
    if (!pSenha) { setError('Digite a senha'); return; }
    const err = await loginParoquial(pSelected.codigoParoquia, pSenha);
    if (err) { setError(err); return; }
    if (pRemember) storageSet('remember_login', { type: 'paroquial', paroquiaId: pSelected.id });
    else localStorage.removeItem('dizimo_digital_remember_login');
    navigate('/paroquial/dashboard');
  };

  const handleCEBLogin = async () => {
    setError('');
    if (!cPSelected) { setError('Selecione a paróquia'); return; }
    if (!cSelected) { setError('Selecione a CEB'); return; }
    if (!cSenha) { setError('Digite a senha'); return; }
    const err = await loginCEB(cPSelected.codigoParoquia, cSelected.codigoCeb, cSenha);
    if (err) { setError(err); return; }
    if (cRemember) storageSet('remember_login', { type: 'ceb', paroquiaId: cPSelected.id, cebId: cSelected.id });
    else localStorage.removeItem('dizimo_digital_remember_login');
    navigate('/cebs/dashboard');
  };

  function DropdownSearch({ value, onChange, onSelect, options, label, open, setOpen, placeholder }: {
    value: string; onChange: (v: string) => void; onSelect: (item: any) => void;
    options: { id: string; label: string; sub: string }[]; label: string;
    open: boolean; setOpen: (open: boolean) => void; placeholder: string;
  }) {
    return (
      <div className="form-group" style={{ position: 'relative' }}>
        <label className="form-label">{label}</label>
        <div style={{ position: 'relative' }}>
          <input
            className="form-input"
            value={value}
            onChange={(e) => { onChange(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            placeholder={placeholder}
            style={{ paddingRight: 32 }}
          />
          <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
        </div>
        {open && options.length > 0 && (
          <div style={{ position: 'absolute', zIndex: 100, top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)', maxHeight: 200, overflowY: 'auto', marginTop: 2 }}>
            {options.map((opt) => (
              <button type="button" key={opt.id} onClick={() => { onSelect(opt); onChange(opt.label); setOpen(false); }}
                style={{ width: '100%', padding: '10px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{opt.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{opt.sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <LogoMark
          src={pSelected?.logoUrl ?? cPSelected?.logoUrl ?? admin?.logoUrl}
          alt="Marca institucional"
          size={72}
          radius={20}
          fallback={<Building2 size={32} color="white" />}
          background={pSelected?.logoUrl || cPSelected?.logoUrl || admin?.logoUrl ? 'transparent' : 'var(--accent)'}
        />
        <h1>Dízimo Digital</h1>
        <p>Gestão de dízimos, doações e ofertas das comunidades eclesiais de base.</p>
        <div style={{ marginTop: 32, width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: <Building2 size={14} />, label: 'Área Paroquial', desc: 'Dashboard, CEBs e relatórios' },
            { icon: <Home size={14} />, label: 'Área CEBs', desc: 'Doações, dizimistas e conselheiros' },
          ].map((item) => (
            <div key={item.label} style={{ padding: '12px 14px', background: 'rgba(255,255,255,.08)', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,.6)' }}>{item.icon}</span>
              <div>
                <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form-area">
        <div className="auth-form-card">
          {selectedLoginLogo && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <LogoMark
                src={selectedLoginLogo}
                alt="Logo selecionada"
                size={120}
                radius={22}
                fallback={<Heart size={40} color="white" fill="white" />}
                background="transparent"
              />
            </div>
          )}
          <h2>Bem-vindo</h2>
          <p className="auth-subtitle">Selecione sua área de acesso e faça login</p>

          <div className="tab-switcher">
            <button className={tab === 'paroquial' ? 'active' : ''} onClick={() => { setTab('paroquial'); setError(''); }}>
              <Building2 size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Paroquial
            </button>
            <button className={tab === 'ceb' ? 'active' : ''} onClick={() => { setTab('ceb'); setError(''); }}>
              <Home size={13} style={{ marginRight: 5, verticalAlign: -2 }} />CEB
            </button>
          </div>

          {error && <Alert variant="danger" title="Erro" message={error} />}

          {tab === 'paroquial' ? (
            <>
              <DropdownSearch
                label="Paróquia"
                value={pSearch}
                onChange={setPSearch}
                onSelect={(opt) => {
                  const sel = paroquias.find((p) => p.id === opt.id) ?? null;
                  setPSelected(sel);
                  if (sel && pRemember) storageSet('remember_login', { type: 'paroquial', paroquiaId: sel.id });
                }}
                options={filteredPar.map((p) => ({ id: p.id, label: p.nome, sub: `Código: ${p.codigoParoquia}` }))}
                open={pDropOpen}
                setOpen={setPDropOpen}
                placeholder="Digite o nome ou código"
              />
              <div className="form-group">
                <label className="form-label">Senha</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={showPwd ? 'text' : 'password'} value={pSenha} onChange={(e) => setPSenha(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleParoquialLogin()} placeholder="••••••••" style={{ paddingRight: 40 }} />
                  <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <label className="form-check" style={{ marginBottom: 20 }}>
                <input type="checkbox" checked={pRemember} onChange={(e) => { setPRemember(e.target.checked); if (e.target.checked && pSelected) storageSet('remember_login', { type: 'paroquial', paroquiaId: pSelected.id }); }} />
                <span>Lembrar paróquia selecionada</span>
              </label>
              <button className="btn btn-primary btn-full btn-lg" onClick={handleParoquialLogin}>Entrar</button>
            </>
          ) : (
            <>
              <DropdownSearch
                label="Paróquia"
                value={cPSearch}
                onChange={setCPSearch}
                onSelect={(opt) => {
                  const sel = paroquias.find((p) => p.id === opt.id) ?? null;
                  setCPSelected(sel);
                  setCSelected(null);
                  setCSearch('');
                  if (sel && cRemember) storageSet('remember_login', { type: 'ceb', paroquiaId: sel.id });
                }}
                options={filteredCPar.map((p) => ({ id: p.id, label: p.nome, sub: `Código: ${p.codigoParoquia}` }))}
                open={cPDropOpen}
                setOpen={setCPDropOpen}
                placeholder="Digite o nome ou código"
              />
              <DropdownSearch
                label="Comunidade (CEB)"
                value={cSearch}
                onChange={setCSearch}
                onSelect={(opt) => {
                  const sel = cebsForParoquia.find((c) => c.id === opt.id) ?? null;
                  setCSelected(sel);
                  if (sel && cRemember && cPSelected) storageSet('remember_login', { type: 'ceb', paroquiaId: cPSelected.id, cebId: sel.id });
                }}
                options={filteredCebs.map((c) => ({ id: c.id, label: c.nome, sub: `Código: ${c.codigoCeb}` }))}
                open={cDropOpen}
                setOpen={(open) => { if (cPSelected) setCDropOpen(open); }}
                placeholder={cPSelected ? 'Selecione a CEB' : 'Primeiro selecione a paróquia'}
              />
              <div className="form-group">
                <label className="form-label">Senha</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={showPwd ? 'text' : 'password'} value={cSenha} onChange={(e) => setCSenha(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCEBLogin()} placeholder="••••••••" style={{ paddingRight: 40 }} />
                  <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <label className="form-check" style={{ marginBottom: 20 }}>
                <input type="checkbox" checked={cRemember} onChange={(e) => { setCRemember(e.target.checked); if (e.target.checked && cSelected && cPSelected) storageSet('remember_login', { type: 'ceb', paroquiaId: cPSelected.id, cebId: cSelected.id }); }} />
                <span>Lembrar paróquia e CEB selecionadas</span>
              </label>
              <button className="btn btn-primary btn-full btn-lg" onClick={handleCEBLogin}>Entrar</button>
            </>
          )}

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <a href="/admin/login" style={{ fontSize: 13, color: 'var(--text-3)' }}>Acesso Administrativo →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
