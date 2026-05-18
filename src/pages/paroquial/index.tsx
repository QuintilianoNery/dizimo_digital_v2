import { useMemo, useState } from 'react';
import {
  LayoutDashboard, Home, Plus, Pencil, Trash2, KeyRound, Settings,
  TrendingUp, DollarSign, Heart, Users, ArrowUpRight, FileText,
  BookOpen, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useToast, Alert, Modal, ConfirmDialog, PageHeader, SearchBar, StatusBadge, StatCard, SectionCard, EmptyState } from '../../components/ui/index';
import { formatCurrency, calcularRepasse, filtrarDoacoes, agruparPorMes, getMesNome } from '../../utils/calculations';
import { readFileAsDataUrl } from '../../utils/files';
import type { CEB, PastoralMovimento, ConfiguracaoParoquia } from '../../types';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ── DASHBOARD PAROQUIAL ────────────────────────────────────────────────────
export function DashboardParoquial() {
  const { user } = useAuth();
  const { getDoacoesParoquia, getConfiguracaoVigente, getCEBs, getParoquia } = useData();
  const paroquiaId = user!.paroquiaId!;
  const paroquia = getParoquia(paroquiaId);
  const config = getConfiguracaoVigente(paroquiaId);
  const cebs = getCEBs(paroquiaId);

  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [filtroCeb, setFiltroCeb] = useState('');

  const doacoes = useMemo(() => {
    const all = getDoacoesParoquia(paroquiaId);
    return filtrarDoacoes(all, { ano: filtroAno, tipo: 'anual', cebId: filtroCeb || undefined });
  }, [filtroAno, filtroCeb]);

  const stats = calcularRepasse(doacoes, config);
  const porMes = agruparPorMes(doacoes);
  const maxTotal = Math.max(...porMes.map((m) => m.total), 1);

  return (
    <div>
      <PageHeader
        title={`Dashboard — ${paroquia?.nome ?? 'Paróquia'}`}
        subtitle="Visão consolidada de arrecadação e repasses"
      />

      {config && (
        <Alert
          variant="info"
          title="Configuração vigente"
          message={`Dízimo ${config.percentualDizimoCebs}% · Oferta ${config.percentualOfertaCebs}% · Cúria ${config.percentualCuriaDiocesana}% · Diocese ${config.percentualDiocese}%`}
          icon={<Settings size={16} />}
        />
      )}

      {/* Filters */}
      <div className="filter-bar">
        <select className="form-select" value={filtroAno} onChange={(e) => setFiltroAno(Number(e.target.value))}>
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="form-select" value={filtroCeb} onChange={(e) => setFiltroCeb(e.target.value)}>
          <option value="">Todas as CEBs</option>
          {cebs.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      <div className="grid-stats">
        <StatCard label="Total dízimo" value={formatCurrency(stats.totalDizimo)} icon={<DollarSign size={20} />} color="var(--primary)" />
        <StatCard label="Total oferta" value={formatCurrency(stats.totalOferta)} icon={<Heart size={20} />} color="var(--accent)" />
        <StatCard label="Total doações" value={formatCurrency(stats.totalDoacao)} icon={<ArrowUpRight size={20} />} color="var(--info)" />
        <StatCard label="Total arrecadado" value={formatCurrency(stats.totalArrecadado)} icon={<TrendingUp size={20} />} color="var(--success)" />
        <StatCard label="Repasse dízimo" value={formatCurrency(stats.repasseDizimo)} sub={`${config?.percentualDizimoCebs ?? 0}% do dízimo`} icon={<ArrowUpRight size={20} />} color="var(--warning)" />
        <StatCard label="Repasse oferta" value={formatCurrency(stats.repasseOferta)} sub={`${config?.percentualOfertaCebs ?? 0}% da oferta`} icon={<ArrowUpRight size={20} />} color="var(--warning)" />
        <StatCard label="Total repasse" value={formatCurrency(stats.totalRepasse)} sub="para a paróquia" icon={<TrendingUp size={20} />} color="var(--danger)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <SectionCard title="Arrecadação por mês" subtitle={`Ano ${filtroAno}`}>
          {porMes.length === 0 ? (
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Nenhum dado para o período</p>
          ) : porMes.map((m) => (
            <div key={`${m.ano}-${m.mes}`} className="chart-bar-row">
              <span className="chart-bar-label">{getMesNome(m.mes).slice(0,3)}</span>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${(m.total / maxTotal) * 100}%` }} />
              </div>
              <span className="chart-bar-value">{formatCurrency(m.total)}</span>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Arrecadação por CEB">
          {cebs.length === 0 ? (
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Nenhuma CEB cadastrada</p>
          ) : cebs.map((ceb) => {
            const cebDoacoes = filtrarDoacoes(getDoacoesParoquia(paroquiaId).filter((d) => d.cebId === ceb.id), { ano: filtroAno, tipo: 'anual' });
            const cebStats = calcularRepasse(cebDoacoes, config);
            return (
              <div key={ceb.id} className="chart-bar-row">
                <span className="chart-bar-label" style={{ width: 120 }}>{ceb.nome.replace('CEB ', '')}</span>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ width: `${(cebStats.totalArrecadado / Math.max(stats.totalArrecadado, 1)) * 100}%`, background: 'var(--accent)' }} />
                </div>
                <span className="chart-bar-value">{formatCurrency(cebStats.totalArrecadado)}</span>
              </div>
            );
          })}
        </SectionCard>
      </div>
    </div>
  );
}

// ── CEBs PAGE ──────────────────────────────────────────────────────────────
export function CEBsPage() {
  const { user } = useAuth();
  const { getCEBs, saveCEB, deleteCEB, resetSenhaCEB } = useData();
  const { showToast } = useToast();
  const paroquiaId = user!.paroquiaId!;
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<CEB | null>(null);
  const [form, setForm] = useState<Partial<CEB>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newSenha, setNewSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');

  const cebs = getCEBs(paroquiaId).filter(
    (c) => c.nome.toLowerCase().includes(search.toLowerCase()) || c.codigoCeb.includes(search),
  );

  const openNew = () => { setForm({ status: 'ativa', paroquiaId }); setErrors({}); setSelected(null); setModalOpen(true); };
  const openEdit = (c: CEB) => { setForm({ ...c }); setErrors({}); setSelected(c); setModalOpen(true); };
  const openReset = (c: CEB) => { setSelected(c); setNewSenha(''); setConfirmSenha(''); setResetOpen(true); };
  const openDelete = (c: CEB) => { setSelected(c); setDeleteOpen(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nome?.trim()) e.nome = 'Nome obrigatório';
    if (!form.emailLogin?.trim()) e.emailLogin = 'Email obrigatório';
    if (!selected && !form.senha?.trim()) e.senha = 'Senha obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    saveCEB({ ...form, paroquiaId } as CEB);
    setModalOpen(false);
    showToast(selected ? 'CEB atualizada!' : 'CEB cadastrada!');
  };

  const handleReset = () => {
    if (!newSenha || newSenha !== confirmSenha) { showToast('Senhas não conferem', 'error'); return; }
    resetSenhaCEB(selected!.id, newSenha);
    setResetOpen(false);
    showToast('Senha da CEB resetada!');
  };

  const handleLogoUpload = async (file?: File | null) => {
    if (!file) return;
    const logoUrl = await readFileAsDataUrl(file);
    setForm((prev) => ({ ...prev, logoUrl }));
  };

  const f = (field: keyof CEB, val: string) => setForm((p) => ({ ...p, [field]: val }));

  return (
    <div>
      <PageHeader
        title="CEBs"
        subtitle="Comunidades Eclesiais de Base vinculadas à paróquia"
        action={<button className="btn btn-primary" onClick={openNew}><Plus size={16} />Nova CEB</button>}
      />
      <SectionCard>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar CEB..." />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th><th>Nome</th><th>Email login</th><th>Telefone</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cebs.length === 0 ? (
                <tr><td colSpan={6}><EmptyState title="Nenhuma CEB cadastrada" icon={<Home size={36} />} action={<button className="btn btn-primary btn-sm" onClick={openNew}><Plus size={14} />Cadastrar CEB</button>} /></td></tr>
              ) : cebs.map((c) => (
                <tr key={c.id}>
                  <td><span className="badge badge-neutral">{c.codigoCeb}</span></td>
                  <td style={{ fontWeight: 500 }}>{c.nome}</td>
                  <td style={{ color: 'var(--text-3)' }}>{c.emailLogin}</td>
                  <td>{c.telefone}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openReset(c)} title="Reset senha"><KeyRound size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => openDelete(c)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Editar CEB' : 'Nova CEB'}
        footer={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Salvar</button></>}
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-input" value={form.nome ?? ''} onChange={(e) => f('nome', e.target.value)} />
            {errors.nome && <span className="form-error">{errors.nome}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Código CEB</label>
            <input className="form-input" value={form.codigoCeb ?? ''} onChange={(e) => f('codigoCeb', e.target.value)} placeholder="Gerado automaticamente" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email de login *</label>
            <input className="form-input" type="email" value={form.emailLogin ?? ''} onChange={(e) => f('emailLogin', e.target.value)} />
            {errors.emailLogin && <span className="form-error">{errors.emailLogin}</span>}
          </div>
          {!selected && (
            <div className="form-group">
              <label className="form-label">Senha *</label>
              <input className="form-input" type="password" value={form.senha ?? ''} onChange={(e) => f('senha', e.target.value)} />
              {errors.senha && <span className="form-error">{errors.senha}</span>}
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Logomarca</label>
          <input className="form-input" type="file" accept="image/*" onChange={(e) => handleLogoUpload(e.target.files?.[0] ?? null)} />
          <div style={{ marginTop: 10 }}>
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Prévia da logo" style={{ height: 72, width: 'auto', borderRadius: 12, objectFit: 'contain', border: '1px solid var(--border)' }} />
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Selecione uma imagem para a CEB.</div>
            )}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input className="form-input" value={form.telefone ?? ''} onChange={(e) => f('telefone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status ?? 'ativa'} onChange={(e) => f('status', e.target.value)}>
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title={`Reset de senha — ${selected?.nome}`}
        footer={<><button className="btn btn-ghost" onClick={() => setResetOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleReset}>Confirmar</button></>}
      >
        <Alert variant="warning" title="Atenção" message="Esta ação irá redefinir a senha da CEB." icon={<KeyRound size={16} />} />
        <div className="form-group">
          <label className="form-label">Nova senha</label>
          <input className="form-input" type="password" value={newSenha} onChange={(e) => setNewSenha(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Confirmar nova senha</label>
          <input className="form-input" type="password" value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)} />
        </div>
      </Modal>

      <ConfirmDialog open={deleteOpen} title="Excluir CEB" message={`Excluir "${selected?.nome}"?`} confirmLabel="Excluir" danger onConfirm={() => { deleteCEB(selected!.id); setDeleteOpen(false); showToast('CEB excluída'); }} onCancel={() => setDeleteOpen(false)} />
    </div>
  );
}

// ── PASTORAIS PAGE ─────────────────────────────────────────────────────────
export function PastoraisPage() {
  const { getPastorais, savePastoral, deletePastoral } = useData();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<PastoralMovimento | null>(null);
  const [form, setForm] = useState<Partial<PastoralMovimento>>({});

  const pastorais = getPastorais().filter((p) => p.nome.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setForm({ tipo: 'pastoral', status: 'ativo' }); setSelected(null); setModalOpen(true); };
  const openEdit = (p: PastoralMovimento) => { setForm({ ...p }); setSelected(p); setModalOpen(true); };

  const handleSave = () => {
    if (!form.nome?.trim()) { showToast('Nome obrigatório', 'error'); return; }
    savePastoral(form as PastoralMovimento);
    setModalOpen(false);
    showToast(selected ? 'Atualizado!' : 'Cadastrado!');
  };

  return (
    <div>
      <PageHeader title="Pastorais e Movimentos" subtitle="Lista utilizada no cadastro de conselheiros comunitários"
        action={<button className="btn btn-primary" onClick={openNew}><Plus size={16} />Novo</button>}
      />
      <SectionCard>
        <div style={{ marginBottom: 16 }}><SearchBar value={search} onChange={setSearch} /></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Tipo</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
            <tbody>
              {pastorais.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.nome}</td>
                  <td><span className={`badge ${p.tipo === 'pastoral' ? 'badge-info' : 'badge-neutral'}`}>{p.tipo}</span></td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><Pencil size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => { setSelected(p); setDeleteOpen(true); }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Editar' : 'Nova pastoral/movimento'}
        footer={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Salvar</button></>}
      >
        <div className="form-group">
          <label className="form-label">Nome</label>
          <input className="form-input" value={form.nome ?? ''} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-select" value={form.tipo ?? 'pastoral'} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as any }))}>
              <option value="pastoral">Pastoral</option>
              <option value="movimento">Movimento</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status ?? 'ativo'} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={deleteOpen} title="Excluir" message={`Excluir "${selected?.nome}"?`} confirmLabel="Excluir" danger
        onConfirm={() => { deletePastoral(selected!.id); setDeleteOpen(false); showToast('Excluído!'); }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

// ── CONFIGURAÇÕES PAROQUIAL ────────────────────────────────────────────────
export function ConfiguracoesParoquialPage() {
  const { user } = useAuth();
  const { getParoquia, getConfiguracaoVigente, getConfiguracoes, saveConfiguracao, updateParoquiaConta } = useData();
  const { showToast } = useToast();
  const paroquiaId = user!.paroquiaId!;
  const paroquia = getParoquia(paroquiaId);
  const config = getConfiguracaoVigente(paroquiaId);
  const historico = getConfiguracoes(paroquiaId);
  const [form, setForm] = useState({
    percentualDizimoCebs: config?.percentualDizimoCebs ?? 30,
    percentualOfertaCebs: config?.percentualOfertaCebs ?? 20,
    percentualCuriaDiocesana: config?.percentualCuriaDiocesana ?? 5,
    percentualDiocese: config?.percentualDiocese ?? 10,
    vigenteDesde: new Date().toISOString().split('T')[0],
  });
  const [profileForm, setProfileForm] = useState({
    logoUrl: paroquia?.logoUrl ?? '',
    senhaAtual: '',
    senhaNova: '',
    confirmSenha: '',
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSave = () => {
    saveConfiguracao({ ...form, paroquiaId });
    setConfirmOpen(false);
    showToast('Percentuais atualizados! Alertas enviados para as CEBs.');
  };

  const handleProfileSave = async () => {
    if (!profileForm.senhaAtual.trim()) {
      showToast('Informe a senha atual para salvar as alterações', 'error');
      return;
    }
    if (profileForm.senhaNova && profileForm.senhaNova !== profileForm.confirmSenha) {
      showToast('As novas senhas não conferem', 'error');
      return;
    }
    const err = updateParoquiaConta(paroquiaId, profileForm.senhaAtual, {
      logoUrl: profileForm.logoUrl || undefined,
      senhaNova: profileForm.senhaNova || undefined,
    });
    if (err) { showToast(err, 'error'); return; }
    setProfileForm((p) => ({ ...p, senhaAtual: '', senhaNova: '', confirmSenha: '' }));
    showToast('Perfil da paróquia atualizado!');
  };

  const handleProfileLogoUpload = async (file?: File | null) => {
    if (!file) return;
    const logoUrl = await readFileAsDataUrl(file);
    setProfileForm((p) => ({ ...p, logoUrl }));
  };

  const f = (k: string, v: number) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Percentuais de repasse e configurações da paróquia" />

      <SectionCard title="Perfil da paróquia" subtitle="Atualize a logomarca e a sua senha de acesso">
        <div className="form-group">
          <label className="form-label">Logomarca da paróquia</label>
          <input className="form-input" type="file" accept="image/*" onChange={(e) => handleProfileLogoUpload(e.target.files?.[0] ?? null)} />
          <div style={{ marginTop: 10 }}>
            {profileForm.logoUrl ? (
              <img src={profileForm.logoUrl} alt="Logo da paróquia" style={{ height: 72, width: 'auto', borderRadius: 12, objectFit: 'contain', border: '1px solid var(--border)' }} />
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Nenhuma logo cadastrada.</div>
            )}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Senha atual</label>
            <input className="form-input" type="password" value={profileForm.senhaAtual} onChange={(e) => setProfileForm((p) => ({ ...p, senhaAtual: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Nova senha</label>
            <input className="form-input" type="password" value={profileForm.senhaNova} onChange={(e) => setProfileForm((p) => ({ ...p, senhaNova: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Confirmar nova senha</label>
          <input className="form-input" type="password" value={profileForm.confirmSenha} onChange={(e) => setProfileForm((p) => ({ ...p, confirmSenha: e.target.value }))} />
        </div>
        <button className="btn btn-primary" onClick={handleProfileSave}>Salvar perfil da paróquia</button>
      </SectionCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <SectionCard title="Percentuais de repasse vigentes" subtitle="Alterar cria nova versão e notifica as CEBs">
          <div className="percentual-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Dízimo → CEBs', key: 'percentualDizimoCebs' },
              { label: 'Oferta → CEBs', key: 'percentualOfertaCebs' },
              { label: 'Cúria Diocesana', key: 'percentualCuriaDiocesana' },
              { label: 'Diocese', key: 'percentualDiocese' },
            ].map((item) => (
              <div key={item.key} className="percentual-card">
                <div className="percentual-label">{item.label}</div>
                <div className="percentual-value">{form[item.key as keyof typeof form]}%</div>
                <input
                  type="range"
                  min={0} max={100}
                  value={form[item.key as keyof typeof form] as number}
                  onChange={(e) => f(item.key, Number(e.target.value))}
                  style={{ width: '100%', marginTop: 8, accentColor: 'var(--primary)' }}
                />
                <input
                  type="number" min={0} max={100}
                  className="form-input" style={{ marginTop: 4, padding: '4px 8px', fontSize: 13 }}
                  value={form[item.key as keyof typeof form] as number}
                  onChange={(e) => f(item.key, Number(e.target.value))}
                />
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">Vigente a partir de</label>
            <input type="date" className="form-input" value={form.vigenteDesde} onChange={(e) => setForm((p) => ({ ...p, vigenteDesde: e.target.value }))} />
          </div>
          <Alert
            variant="warning"
            title="Atenção"
            message="Salvar irá criar uma nova versão. Os meses anteriores não serão recalculados."
            icon={<RefreshCw size={14} />}
          />
          <button className="btn btn-primary" onClick={() => setConfirmOpen(true)}>Salvar e notificar CEBs</button>
        </SectionCard>

        <SectionCard title="Histórico de configurações">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Vigente desde</th><th>Dízimo %</th><th>Oferta %</th><th>Status</th></tr></thead>
              <tbody>
                {historico.map((c) => (
                  <tr key={c.id}>
                    <td>{c.vigenteDesde}</td>
                    <td>{c.percentualDizimoCebs}%</td>
                    <td>{c.percentualOfertaCebs}%</td>
                    <td><span className={`badge ${c.ativa ? 'badge-success' : 'badge-neutral'}`}>{c.ativa ? 'Vigente' : 'Encerrada'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <ConfirmDialog open={confirmOpen} title="Confirmar alteração" message="Ao salvar, uma nova configuração será criada e todas as CEBs serão notificadas sobre a mudança dos percentuais. Continuar?" confirmLabel="Salvar" onConfirm={handleSave} onCancel={() => setConfirmOpen(false)} />
    </div>
  );
}

export function ConfiguracoesCEBPage() {
  const { user } = useAuth();
  const { getParoquia, getCEB, updateCEBConta } = useData();
  const { showToast } = useToast();
  const paroquiaId = user!.paroquiaId!;
  const cebId = user!.cebId!;
  const paroquia = getParoquia(paroquiaId);
  const ceb = getCEB(cebId);
  const [form, setForm] = useState({
    logoUrl: ceb?.logoUrl ?? '',
    senhaAtual: '',
    senhaNova: '',
    confirmSenha: '',
  });

  const handleSave = () => {
    if (!form.senhaAtual.trim()) {
      showToast('Informe a senha atual para salvar as alterações', 'error');
      return;
    }
    if (form.senhaNova && form.senhaNova !== form.confirmSenha) {
      showToast('As novas senhas não conferem', 'error');
      return;
    }
    const err = updateCEBConta(cebId, form.senhaAtual, {
      logoUrl: form.logoUrl || undefined,
      senhaNova: form.senhaNova || undefined,
    });
    if (err) { showToast(err, 'error'); return; }
    setForm((p) => ({ ...p, senhaAtual: '', senhaNova: '', confirmSenha: '' }));
    showToast('Configurações da CEB atualizadas!');
  };

  const handleLogoUpload = async (file?: File | null) => {
    if (!file) return;
    const logoUrl = await readFileAsDataUrl(file);
    setForm((p) => ({ ...p, logoUrl }));
  };

  return (
    <div>
      <PageHeader title="Configurações da CEB" subtitle={`Atualize a logo e a senha da CEB ${ceb?.nome ?? ''}`} />
      <SectionCard title="Perfil da CEB" subtitle={`Paróquia: ${paroquia?.nome ?? ''}`}>
        <div className="form-group">
          <label className="form-label">Logomarca da CEB</label>
          <input className="form-input" type="file" accept="image/*" onChange={(e) => handleLogoUpload(e.target.files?.[0] ?? null)} />
          <div style={{ marginTop: 10 }}>
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo da CEB" style={{ height: 72, width: 'auto', borderRadius: 12, objectFit: 'contain', border: '1px solid var(--border)' }} />
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Nenhuma logo cadastrada.</div>
            )}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Senha atual</label>
            <input className="form-input" type="password" value={form.senhaAtual} onChange={(e) => setForm((p) => ({ ...p, senhaAtual: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Nova senha</label>
            <input className="form-input" type="password" value={form.senhaNova} onChange={(e) => setForm((p) => ({ ...p, senhaNova: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Confirmar nova senha</label>
          <input className="form-input" type="password" value={form.confirmSenha} onChange={(e) => setForm((p) => ({ ...p, confirmSenha: e.target.value }))} />
        </div>
        <button className="btn btn-primary" onClick={handleSave}>Salvar configurações da CEB</button>
      </SectionCard>
    </div>
  );
}

// ── RELATÓRIOS PAROQUIAL ───────────────────────────────────────────────────
export function RelatoriosParoquialPage() {
  const { user } = useAuth();
  const { getDoacoesParoquia, getConfiguracaoVigente, getCEBs, getDizimistas } = useData();
  const paroquiaId = user!.paroquiaId!;
  const config = getConfiguracaoVigente(paroquiaId);
  const cebs = getCEBs(paroquiaId);
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroTipo, setFiltroTipo] = useState<'mensal' | 'trimestral' | 'semestral' | 'anual'>('mensal');
  const [filtroCeb, setFiltroCeb] = useState('');

  const doacoes = useMemo(() => {
    const all = getDoacoesParoquia(paroquiaId);
    return filtrarDoacoes(all, { ano: filtroAno, mes: filtroMes, tipo: filtroTipo, cebId: filtroCeb || undefined });
  }, [filtroAno, filtroMes, filtroTipo, filtroCeb]);

  const stats = calcularRepasse(doacoes, config);

  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Visualize e exporte os dados de arrecadação" />
      <div className="filter-bar">
        <select className="form-select" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as any)}>
          <option value="mensal">Mensal</option>
          <option value="trimestral">Trimestral</option>
          <option value="semestral">Semestral</option>
          <option value="anual">Anual</option>
        </select>
        {filtroTipo !== 'anual' && (
          <select className="form-select" value={filtroMes} onChange={(e) => setFiltroMes(Number(e.target.value))}>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        )}
        <select className="form-select" value={filtroAno} onChange={(e) => setFiltroAno(Number(e.target.value))}>
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="form-select" value={filtroCeb} onChange={(e) => setFiltroCeb(e.target.value)}>
          <option value="">Todas as CEBs</option>
          {cebs.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      <div className="grid-stats" style={{ marginBottom: 20 }}>
        <StatCard label="Dízimo" value={formatCurrency(stats.totalDizimo)} icon={<DollarSign size={20} />} color="var(--primary)" />
        <StatCard label="Oferta" value={formatCurrency(stats.totalOferta)} icon={<Heart size={20} />} color="var(--accent)" />
        <StatCard label="Doações" value={formatCurrency(stats.totalDoacao)} icon={<ArrowUpRight size={20} />} color="var(--info)" />
        <StatCard label="Total" value={formatCurrency(stats.totalArrecadado)} icon={<TrendingUp size={20} />} color="var(--success)" />
        <StatCard label="Repasse total" value={formatCurrency(stats.totalRepasse)} icon={<ArrowUpRight size={20} />} color="var(--warning)" />
      </div>

      <SectionCard title={`Lançamentos — ${doacoes.length} registros`}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Data</th><th>CEB</th><th>Tipo</th><th>Forma</th><th>Competência</th><th style={{ textAlign: 'right' }}>Valor</th></tr>
            </thead>
            <tbody>
              {doacoes.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-3)' }}>Nenhum registro no período selecionado</td></tr>
              ) : doacoes.slice(0, 50).map((d) => {
                const ceb = cebs.find((c) => c.id === d.cebId);
                return (
                  <tr key={d.id}>
                    <td>{d.dataLancamento}</td>
                    <td>{ceb?.nome ?? '-'}</td>
                    <td><span className={`badge ${d.tipoDoacao === 'dizimo' ? 'badge-info' : d.tipoDoacao === 'oferta' ? 'badge-warning' : 'badge-neutral'}`}>{d.tipoDoacao}</span></td>
                    <td>{d.formaPagamento}</td>
                    <td>{getMesNome(d.competenciaMes).slice(0,3)}/{d.competenciaAno}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(d.valor)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {doacoes.length > 50 && <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)' }}>Exibindo 50 de {doacoes.length} registros.</p>}
      </SectionCard>
    </div>
  );
}
