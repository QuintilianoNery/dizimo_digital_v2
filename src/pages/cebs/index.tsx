import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, DollarSign, Heart, ArrowUpRight,
  TrendingUp, Users, UserCheck, X, AlertTriangle, Cake, CalendarDays
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  useToast, Alert, Modal, ConfirmDialog, PageHeader, SearchBar,
  StatusBadge, StatCard, SectionCard, EmptyState,
} from '../../components/ui/index';
import { formatCurrency, calcularRepasse, filtrarDoacoes, getMesNome, filtrarAniversariantes, formatDate } from '../../utils/calculations';
import type { Dizimista, ConselheiroComunitario, Doacao } from '../../types';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ── CEB DASHBOARD ──────────────────────────────────────────────────────────
export function DashboardCEB() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getDoacoes, getConfiguracaoVigente, getAlertas, marcarAlertaLido, getCEB, getParoquia, getDizimistas } = useData();
  const { showToast } = useToast();
  const cebId = user!.cebId!;
  const paroquiaId = user!.paroquiaId!;
  const ceb = getCEB(cebId);
  const paroquia = getParoquia(paroquiaId);
  const config = getConfiguracaoVigente(paroquiaId);
  const alertas = getAlertas(cebId);
  const allDoacoes = getDoacoes(cebId);
  const dizimistasAtivos = getDizimistas(cebId).filter((d) => d.status === 'ativo');
  const birthdayToastShown = useRef(false);

  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroTipo, setFiltroTipo] = useState<'mensal' | 'trimestral' | 'semestral' | 'anual'>('mensal');

  const aniversariantesMes = useMemo(
    () => filtrarAniversariantes(dizimistasAtivos, { tipo: 'mes', mes: new Date().getMonth() + 1 }),
    [dizimistasAtivos],
  );

  const nomesAniversariantes = useMemo(() => {
    const nomes = aniversariantesMes.slice(0, 3).map((d) => d.nome.split(' ')[0]);
    const extras = aniversariantesMes.length > 3 ? ` e mais ${aniversariantesMes.length - 3}` : '';
    return `${nomes.join(', ')}${extras}`;
  }, [aniversariantesMes]);

  useEffect(() => {
    if (birthdayToastShown.current || aniversariantesMes.length === 0) return;

    showToast(nomesAniversariantes, 'success', { title: 'Aniversariantes do mês:', durationMs: 4000, icon: <Cake size={16} /> });
    birthdayToastShown.current = true;
  }, [aniversariantesMes.length, nomesAniversariantes, showToast]);

  const doacoes = useMemo(
    () => filtrarDoacoes(allDoacoes, { ano: filtroAno, mes: filtroMes, tipo: filtroTipo }),
    [allDoacoes, filtroAno, filtroMes, filtroTipo],
  );

  const stats = calcularRepasse(doacoes, config);
  const porMes = useMemo(() => {
    const byMonth: Record<string, number> = {};
    allDoacoes.filter((d) => d.competenciaAno === filtroAno).forEach((d) => {
      const k = String(d.competenciaMes);
      byMonth[k] = (byMonth[k] ?? 0) + d.valor;
    });
    return byMonth;
  }, [allDoacoes, filtroAno]);

  const maxVal = Math.max(...Object.values(porMes), 1);

  return (
    <div>
      {aniversariantesMes.length > 0 && (
        <Alert
          variant="success"
          message={`Há ${aniversariantesMes.length} aniversariante(s) neste mês na sua CEB.`}
          icon={<Cake size={16} />}
          action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/cebs/aniversariantes')}>Ver aniversariantes</button>}
        />
      )}

      {/* Alertas */}
      {alertas.map((alerta) => (
        <Alert
          key={alerta.id}
          variant="warning"
          title="Alteração de percentual"
          message={`${alerta.mensagem} (${new Date(alerta.createdAt).toLocaleDateString('pt-BR')})`}
          icon={<AlertTriangle size={16} />}
          onClose={() => marcarAlertaLido(alerta.id)}
        />
      ))}

      <PageHeader title={ceb?.nome ?? 'Dashboard'} subtitle={`Paróquia: ${paroquia?.nome ?? ''}`} />

      {config && (
        <Alert
          variant="info"
          title="Percentuais vigentes"
          message={`Dízimo ${config.percentualDizimoCebs}% · Oferta ${config.percentualOfertaCebs}%`}
        />
      )}

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
      </div>

      <div className="grid-stats">
        <StatCard label="Total dízimo" value={formatCurrency(stats.totalDizimo)} icon={<DollarSign size={20} />} color="var(--primary)" />
        <StatCard label="Total oferta" value={formatCurrency(stats.totalOferta)} icon={<Heart size={20} />} color="var(--accent)" />
        <StatCard label="Total doações" value={formatCurrency(stats.totalDoacao)} icon={<ArrowUpRight size={20} />} color="var(--info)" />
        <StatCard label="Total arrecadado" value={formatCurrency(stats.totalArrecadado)} icon={<TrendingUp size={20} />} color="var(--success)" />
        <StatCard label="Repasse dízimo" value={formatCurrency(stats.repasseDizimo)} sub={`${config?.percentualDizimoCebs ?? 0}%`} icon={<ArrowUpRight size={20} />} color="var(--warning)" />
        <StatCard label="Repasse oferta" value={formatCurrency(stats.repasseOferta)} sub={`${config?.percentualOfertaCebs ?? 0}%`} icon={<ArrowUpRight size={20} />} color="var(--warning)" />
        <StatCard label="Total repasse" value={formatCurrency(stats.totalRepasse)} icon={<TrendingUp size={20} />} color="var(--danger)" />
      </div>

      <SectionCard title={`Arrecadação mensal — ${filtroAno}`} subtitle="Total por mês">
        {Object.keys(porMes).length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Nenhum dado neste ano</p>
        ) : MESES.map((m, i) => {
          const val = porMes[String(i + 1)] ?? 0;
          return (
            <div key={i} className="chart-bar-row">
              <span className="chart-bar-label">{m}</span>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${(val / maxVal) * 100}%` }} />
              </div>
              <span className="chart-bar-value">{val > 0 ? formatCurrency(val) : '—'}</span>
            </div>
          );
        })}
      </SectionCard>
    </div>
  );
}

// ── DOAÇÕES PAGE ───────────────────────────────────────────────────────────
export function DoacoesPage() {
  const { user } = useAuth();
  const { getDoacoes, saveDoacao, deleteDoacao, getDizimistas } = useData();
  const { showToast } = useToast();
  const cebId = user!.cebId!;
  const dizimistas = getDizimistas(cebId);

  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Doacao | null>(null);
  const today = new Date();
  const [form, setForm] = useState<Partial<Doacao>>({
    tipoDoacao: 'dizimo', formaPagamento: 'dinheiro',
    competenciaMes: today.getMonth() + 1, competenciaAno: today.getFullYear(),
    dataLancamento: today.toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const doacoes = getDoacoes(cebId)
    .filter((d) => !filtroTipo || d.tipoDoacao === filtroTipo)
    .sort((a, b) => b.dataLancamento.localeCompare(a.dataLancamento));

  const openNew = () => {
    const now = new Date();
    setForm({ tipoDoacao: 'dizimo', formaPagamento: 'dinheiro', competenciaMes: now.getMonth() + 1, competenciaAno: now.getFullYear(), dataLancamento: now.toISOString().split('T')[0] });
    setErrors({}); setSelected(null); setModalOpen(true);
  };
  const openEdit = (d: Doacao) => { setForm({ ...d }); setErrors({}); setSelected(d); setModalOpen(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.valor || form.valor <= 0) e.valor = 'Valor obrigatório e positivo';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    saveDoacao({ ...form, cebId } as Doacao);
    setModalOpen(false);
    showToast(selected ? 'Doação atualizada!' : 'Doação registrada!');
  };

  const f = (k: keyof Doacao, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <PageHeader title="Doações" subtitle="Registre dízimos, ofertas e doações"
        action={<button className="btn btn-primary" onClick={openNew}><Plus size={16} />Nova doação</button>}
      />
      <div className="filter-bar">
        <select className="form-select" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="dizimo">Dízimo</option>
          <option value="oferta">Oferta</option>
          <option value="doacao">Doação</option>
        </select>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar..." />
      </div>
      <SectionCard>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Data</th><th>Tipo</th><th>Forma</th><th>Competência</th><th>Dizimista</th><th style={{ textAlign: 'right' }}>Valor</th><th style={{ textAlign: 'right' }}>Ações</th></tr>
            </thead>
            <tbody>
              {doacoes.length === 0 ? (
                <tr><td colSpan={7}><EmptyState title="Nenhuma doação registrada" icon={<Heart size={36} />} action={<button className="btn btn-primary btn-sm" onClick={openNew}><Plus size={14} />Registrar doação</button>} /></td></tr>
              ) : doacoes.map((d) => {
                const diz = dizimistas.find((x) => x.id === d.dizimistaId);
                return (
                  <tr key={d.id}>
                    <td>{d.dataLancamento}</td>
                    <td><span className={`badge ${d.tipoDoacao === 'dizimo' ? 'badge-info' : d.tipoDoacao === 'oferta' ? 'badge-warning' : 'badge-neutral'}`}>{d.tipoDoacao}</span></td>
                    <td>{d.formaPagamento}</td>
                    <td>{getMesNome(d.competenciaMes).slice(0,3)}/{d.competenciaAno}</td>
                    <td style={{ color: 'var(--text-3)' }}>{diz?.nome ?? 'Avulso'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(d.valor)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}><Pencil size={14} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => { setSelected(d); setDeleteOpen(true); }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Editar doação' : 'Registrar doação'}
        footer={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Salvar</button></>}
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tipo *</label>
            <select className="form-select" value={form.tipoDoacao} onChange={(e) => f('tipoDoacao', e.target.value)}>
              <option value="dizimo">Dízimo</option>
              <option value="oferta">Oferta</option>
              <option value="doacao">Doação</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Valor (R$) *</label>
            <input className="form-input" type="number" min="0" step="0.01" value={form.valor ?? ''} onChange={(e) => f('valor', parseFloat(e.target.value))} />
            {errors.valor && <span className="form-error">{errors.valor}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Forma de pagamento</label>
            <select className="form-select" value={form.formaPagamento} onChange={(e) => f('formaPagamento', e.target.value)}>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">Pix</option>
              <option value="transferencia">Transferência bancária</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Data de lançamento</label>
            <input className="form-input" type="date" value={form.dataLancamento ?? ''} onChange={(e) => f('dataLancamento', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Mês de competência</label>
            <select className="form-select" value={form.competenciaMes} onChange={(e) => f('competenciaMes', Number(e.target.value))}>
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Ano de competência</label>
            <select className="form-select" value={form.competenciaAno} onChange={(e) => f('competenciaAno', Number(e.target.value))}>
              {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Dizimista (opcional)</label>
          <select className="form-select" value={form.dizimistaId ?? ''} onChange={(e) => f('dizimistaId', e.target.value || undefined)}>
            <option value="">Avulso (sem vínculo)</option>
            {dizimistas.filter((d) => d.status === 'ativo').map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Observações</label>
          <textarea className="form-textarea" value={form.observacoes ?? ''} onChange={(e) => f('observacoes', e.target.value)} rows={2} />
        </div>
      </Modal>

      <ConfirmDialog open={deleteOpen} title="Excluir doação" message="Excluir este registro de doação?" confirmLabel="Excluir" danger
        onConfirm={() => { deleteDoacao(selected!.id); setDeleteOpen(false); showToast('Doação excluída'); }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

// ── DIZIMISTAS PAGE ────────────────────────────────────────────────────────
export function DizimistasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getDizimistas, saveDizimista, deleteDizimista } = useData();
  const { showToast } = useToast();
  const cebId = user!.cebId!;
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Dizimista | null>(null);
  const [form, setForm] = useState<Partial<Dizimista>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dizimistas = getDizimistas(cebId).filter(
    (d) => d.nome.toLowerCase().includes(search.toLowerCase()) || d.telefone.includes(search),
  );

  const openNew = () => { setForm({ status: 'ativo' }); setErrors({}); setSelected(null); setModalOpen(true); };
  const openEdit = (d: Dizimista) => { setForm({ ...d }); setErrors({}); setSelected(d); setModalOpen(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nome?.trim()) e.nome = 'Nome obrigatório';
    if (!form.telefone?.trim()) e.telefone = 'Telefone obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    saveDizimista({ ...form, cebId } as Dizimista);
    setModalOpen(false);
    showToast(selected ? 'Dizimista atualizado!' : 'Dizimista cadastrado!');
  };

  const f = (k: keyof Dizimista, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <PageHeader title="Dizimistas" subtitle="Cadastro de dizimistas da comunidade"
        action={(
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => navigate('/cebs/aniversariantes')}><Cake size={16} />Ver aniversariantes</button>
            <button className="btn btn-primary" onClick={openNew}><Plus size={16} />Novo dizimista</button>
          </div>
        )}
      />
      <SectionCard>
        <div style={{ marginBottom: 16 }}><SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome ou telefone..." /></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Telefone</th><th>Email</th><th>Nascimento</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
            <tbody>
              {dizimistas.length === 0 ? (
                <tr><td colSpan={6}><EmptyState title="Nenhum dizimista cadastrado" icon={<Users size={36} />} action={<button className="btn btn-primary btn-sm" onClick={openNew}><Plus size={14} />Cadastrar</button>} /></td></tr>
              ) : dizimistas.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 500 }}>{d.nome}</td>
                  <td>{d.telefone}</td>
                  <td style={{ color: 'var(--text-3)' }}>{d.email ?? '—'}</td>
                  <td>{d.dataNascimento ? new Date(d.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}><Pencil size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => { setSelected(d); setDeleteOpen(true); }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Editar dizimista' : 'Novo dizimista'}
        footer={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Salvar</button></>}
      >
        <div className="form-group">
          <label className="form-label">Nome *</label>
          <input className="form-input" value={form.nome ?? ''} onChange={(e) => f('nome', e.target.value)} />
          {errors.nome && <span className="form-error">{errors.nome}</span>}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Telefone *</label>
            <input className="form-input" value={form.telefone ?? ''} onChange={(e) => f('telefone', e.target.value)} placeholder="(00) 00000-0000" />
            {errors.telefone && <span className="form-error">{errors.telefone}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Email (opcional)</label>
            <input className="form-input" type="email" value={form.email ?? ''} onChange={(e) => f('email', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Endereço</label>
          <input className="form-input" value={form.endereco ?? ''} onChange={(e) => f('endereco', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Data de nascimento</label>
            <input className="form-input" type="date" value={form.dataNascimento ?? ''} onChange={(e) => f('dataNascimento', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status ?? 'ativo'} onChange={(e) => f('status', e.target.value)}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={deleteOpen} title="Excluir dizimista" message={`Excluir "${selected?.nome}"?`} confirmLabel="Excluir" danger
        onConfirm={() => { deleteDizimista(selected!.id); setDeleteOpen(false); showToast('Excluído!'); }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

// ── ANIVERSARIANTES CEB PAGE ──────────────────────────────────────────────
export function AniversariantesCEBPage() {
  const { user } = useAuth();
  const { getDizimistas, getCEB } = useData();
  const cebId = user!.cebId!;
  const ceb = getCEB(cebId);
  const baseDizimistas = getDizimistas(cebId).filter((d) => d.status === 'ativo');
  const hoje = new Date();

  const [modoFiltro, setModoFiltro] = useState<'mes' | 'periodo'>('mes');
  const [mesFiltro, setMesFiltro] = useState(hoje.getMonth() + 1);
  const [inicioFiltro, setInicioFiltro] = useState(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`);
  const [fimFiltro, setFimFiltro] = useState(hoje.toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  const base = useMemo(() => baseDizimistas, [baseDizimistas]);

  const aniversariantes = useMemo(() => {
    const filtrados = filtrarAniversariantes(base, modoFiltro === 'mes'
      ? { tipo: 'mes', mes: mesFiltro }
      : { tipo: 'periodo', inicio: inicioFiltro, fim: fimFiltro });

    const termo = search.toLowerCase();
    return filtrados.filter((d) => d.nome.toLowerCase().includes(termo) || d.telefone.toLowerCase().includes(termo));
  }, [base, fimFiltro, inicioFiltro, mesFiltro, modoFiltro, search]);

  const periodoLabel = modoFiltro === 'mes'
    ? `Mês selecionado: ${getMesNome(mesFiltro)}`
    : `Período: ${formatDate(inicioFiltro)} até ${formatDate(fimFiltro)}`;

  return (
    <div>
      <PageHeader
        title="Aniversariantes"
        subtitle={`Dizimistas da ${ceb?.nome ?? 'CEB'} com filtro por mês ou período de nascimento`}
      />

      <div className="grid-stats" style={{ marginBottom: 16 }}>
        <StatCard label="Aniversariantes" value={String(aniversariantes.length)} sub={periodoLabel} icon={<Cake size={20} />} color="var(--primary)" />
        <StatCard label="Filtro" value={modoFiltro === 'mes' ? 'Mês' : 'Período'} sub="Visualização personalizada" icon={<CalendarDays size={20} />} color="var(--info)" />
      </div>

      <SectionCard title="Filtros" subtitle="Escolha mês ou período para atualizar a lista">
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <select className="form-select" value={modoFiltro} onChange={(e) => setModoFiltro(e.target.value as 'mes' | 'periodo')}>
            <option value="mes">Mês específico</option>
            <option value="periodo">Período personalizado</option>
          </select>

          {modoFiltro === 'mes' ? (
            <select className="form-select" value={mesFiltro} onChange={(e) => setMesFiltro(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                <option key={mes} value={mes}>{getMesNome(mes)}</option>
              ))}
            </select>
          ) : (
            <>
              <input className="form-input" type="date" value={inicioFiltro} onChange={(e) => setInicioFiltro(e.target.value)} />
              <input className="form-input" type="date" value={fimFiltro} onChange={(e) => setFimFiltro(e.target.value)} />
            </>
          )}

          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome ou telefone" />
        </div>
      </SectionCard>

      <SectionCard title="Lista de aniversariantes" subtitle="A lista abaixo muda conforme o filtro selecionado">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Nome</th><th>Telefone</th><th>Nascimento</th><th>Status</th></tr>
            </thead>
            <tbody>
              {aniversariantes.length === 0 ? (
                <tr><td colSpan={4}><EmptyState title="Nenhum aniversariante no filtro" description="Altere o mês ou o período para consultar outros aniversariantes." icon={<Cake size={36} />} /></td></tr>
              ) : aniversariantes.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 500 }}>{d.nome}</td>
                  <td>{d.telefone}</td>
                  <td>{formatDate(d.dataNascimento)}</td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ── CONSELHEIROS PAGE ──────────────────────────────────────────────────────
export function ConselheirosPage() {
  const { user } = useAuth();
  const { getConselheiros, saveConselheiro, deleteConselheiro, getPastorais } = useData();
  const { showToast } = useToast();
  const cebId = user!.cebId!;
  const pastorais = getPastorais().filter((p) => p.status === 'ativo');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<ConselheiroComunitario | null>(null);
  const [form, setForm] = useState<Partial<ConselheiroComunitario>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const conselheiros = getConselheiros(cebId).filter(
    (c) => c.nome.toLowerCase().includes(search.toLowerCase()),
  );

  const openNew = () => { setForm({ status: 'ativo' }); setErrors({}); setSelected(null); setModalOpen(true); };
  const openEdit = (c: ConselheiroComunitario) => { setForm({ ...c }); setErrors({}); setSelected(c); setModalOpen(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nome?.trim()) e.nome = 'Nome obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    saveConselheiro({ ...form, cebId } as ConselheiroComunitario);
    setModalOpen(false);
    showToast(selected ? 'Conselheiro atualizado!' : 'Conselheiro cadastrado!');
  };

  const f = (k: keyof ConselheiroComunitario, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <PageHeader title="Conselheiros Comunitários" subtitle="Membros da liderança da CEB"
        action={<button className="btn btn-primary" onClick={openNew}><Plus size={16} />Novo conselheiro</button>}
      />
      <SectionCard>
        <div style={{ marginBottom: 16 }}><SearchBar value={search} onChange={setSearch} /></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Cargo</th><th>Pastoral/Movimento</th><th>Telefone</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
            <tbody>
              {conselheiros.length === 0 ? (
                <tr><td colSpan={6}><EmptyState title="Nenhum conselheiro cadastrado" icon={<UserCheck size={36} />} action={<button className="btn btn-primary btn-sm" onClick={openNew}><Plus size={14} />Cadastrar</button>} /></td></tr>
              ) : conselheiros.map((c) => {
                const pastoral = pastorais.find((p) => p.id === c.pastoralMovimentoId);
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.nome}</td>
                    <td>{c.cargo}</td>
                    <td style={{ color: 'var(--text-3)' }}>{pastoral?.nome ?? '—'}</td>
                    <td>{c.telefone}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => { setSelected(c); setDeleteOpen(true); }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Editar conselheiro' : 'Novo conselheiro'}
        footer={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Salvar</button></>}
      >
        <div className="form-group">
          <label className="form-label">Nome *</label>
          <input className="form-input" value={form.nome ?? ''} onChange={(e) => f('nome', e.target.value)} />
          {errors.nome && <span className="form-error">{errors.nome}</span>}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Cargo</label>
            <input className="form-input" value={form.cargo ?? ''} onChange={(e) => f('cargo', e.target.value)} placeholder="Ex: Coordenador" />
          </div>
          <div className="form-group">
            <label className="form-label">Pastoral / Movimento</label>
            <select className="form-select" value={form.pastoralMovimentoId ?? ''} onChange={(e) => f('pastoralMovimentoId', e.target.value || '')}>
              <option value="">Selecionar (opcional)</option>
              {pastorais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input className="form-input" value={form.telefone ?? ''} onChange={(e) => f('telefone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email ?? ''} onChange={(e) => f('email', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status ?? 'ativo'} onChange={(e) => f('status', e.target.value)}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </Modal>

      <ConfirmDialog open={deleteOpen} title="Excluir conselheiro" message={`Excluir "${selected?.nome}"?`} confirmLabel="Excluir" danger
        onConfirm={() => { deleteConselheiro(selected!.id); setDeleteOpen(false); showToast('Excluído!'); }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
