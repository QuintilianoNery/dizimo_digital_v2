// ============================================================================
// PÁGINAS CEBs
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Gift, Users, UserCheck, Calendar, DollarSign } from 'lucide-react';
import { getCebDashboardStats, type CebDashboardStats } from '@/services/ceb.service';
import {
  listDoacoes, createDoacao, updateDoacao, deleteDoacao,
} from '@/services/doacao.service';
import {
  listDizimistas, createDizimista, updateDizimista, deleteDizimista,
  getAniversariantesMes,
} from '@/services/dizimista.service';
import {
  listConselheiros, createConselheiro, updateConselheiro, deleteConselheiro,
  listPastorais,
} from '@/services/conselheiro.service';
import type {
  Doacao, Dizimista, ConselheiroComunitario, PastoralMovimento,
  TipoDoacao, FormaPagamento,
} from '@/types';
import {
  Button, Modal, Input, Badge, ConfirmDialog, EmptyState, Spinner,
  Card, useToast, Select, Textarea,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const TIPOS_DOACAO: { value: TipoDoacao; label: string }[] = [
  { value: 'dizimo', label: 'Dízimo' },
  { value: 'oferta', label: 'Oferta' },
  { value: 'doacao', label: 'Doação' },
];
const FORMAS: { value: FormaPagamento; label: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' },
  { value: 'transferencia', label: 'Transferência' },
];

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function formatData(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</div>
      </div>
    </Card>
  );
}

// ── Dashboard CEB ─────────────────────────────────────────────────────────────

export function DashboardCEB() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CebDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.cebId) return;
    getCebDashboardStats(user.cebId)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.cebId]);

  return (
    <div>
      <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Dashboard</h1>
      <p style={{ margin: '0 0 24px', color: 'var(--text-3)', fontSize: 13 }}>{user?.nome}</p>
      {loading ? <Spinner size={28} /> : stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          <StatCard icon={<Users size={20} />} label="Dizimistas Ativos" value={stats.totalDizimistas} color="var(--blue)" />
          <StatCard icon={<Gift size={20} />} label="Lançamentos do Mês" value={stats.totalDoacoesMes} color="var(--brand)" />
          <StatCard icon={<DollarSign size={20} />} label="Arrecadado no Mês" value={formatCurrency(stats.valorTotalMes)} color="var(--green)" />
          <StatCard icon={<UserCheck size={20} />} label="Conselheiros Ativos" value={stats.totalConselheiros} color="var(--amber)" />
        </div>
      ) : null}
    </div>
  );
}

// ── Doacoes Page ──────────────────────────────────────────────────────────────

type DoacaoForm = {
  dizimista_id: string;
  valor: string;
  competencia_mes: number;
  competencia_ano: number;
  tipo_doacao: TipoDoacao;
  forma_pagamento: FormaPagamento;
  observacoes: string;
};

const EMPTY_DOACAO: DoacaoForm = {
  dizimista_id: '',
  valor: '',
  competencia_mes: new Date().getMonth() + 1,
  competencia_ano: new Date().getFullYear(),
  tipo_doacao: 'dizimo',
  forma_pagamento: 'dinheiro',
  observacoes: '',
};

export function DoacoesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [dizimistas, setDizimistas] = useState<Dizimista[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Doacao | null>(null);
  const [form, setForm] = useState<DoacaoForm>(EMPTY_DOACAO);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Doacao | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!user?.cebId) return;
    setLoading(true);
    try {
      const [d, diz] = await Promise.all([
        listDoacoes({ cebId: user.cebId, mes, ano }),
        listDizimistas(user.cebId),
      ]);
      setDoacoes(d);
      setDizimistas(diz);
    } catch (e: unknown) {
      toast.error('Erro ao carregar', e instanceof Error ? e.message : '');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [mes, ano, user?.cebId]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_DOACAO, competencia_mes: mes, competencia_ano: ano });
    setModalOpen(true);
  };

  const openEdit = (d: Doacao) => {
    setEditTarget(d);
    setForm({
      dizimista_id: d.dizimista_id ?? '',
      valor: String(d.valor),
      competencia_mes: d.competencia_mes,
      competencia_ano: d.competencia_ano,
      tipo_doacao: d.tipo_doacao,
      forma_pagamento: d.forma_pagamento,
      observacoes: d.observacoes ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.valor || isNaN(parseFloat(form.valor))) { toast.warning('Informe um valor válido'); return; }
    setSaving(true);
    try {
      const payload = {
        ceb_id: user!.cebId!,
        dizimista_id: form.dizimista_id || null,
        valor: parseFloat(form.valor),
        competencia_mes: form.competencia_mes,
        competencia_ano: form.competencia_ano,
        tipo_doacao: form.tipo_doacao,
        forma_pagamento: form.forma_pagamento,
        observacoes: form.observacoes || null,
        data_lancamento: new Date().toISOString(),
      };
      if (editTarget) await updateDoacao(editTarget.id, payload);
      else await createDoacao(payload);
      toast.success(editTarget ? 'Lançamento atualizado!' : 'Lançamento registrado!');
      setModalOpen(false);
      await load();
    } catch (e: unknown) {
      toast.error('Erro ao salvar', e instanceof Error ? e.message : '');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoacao(deleteTarget.id);
      toast.success('Lançamento removido');
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      toast.error('Erro', e instanceof Error ? e.message : '');
    } finally { setDeleting(false); }
  };

  const total = doacoes.reduce((a, d) => a + Number(d.valor), 0);

  const tipoBadge = (t: TipoDoacao) =>
    t === 'dizimo' ? 'blue' : t === 'oferta' ? 'green' : 'amber';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Doações e Dízimos</h1>
          {!loading && <p style={{ margin: '4px 0 0', color: 'var(--text-3)', fontSize: 13 }}>
            {doacoes.length} lançamento(s) · {formatCurrency(total)} no período
          </p>}
        </div>
        <Button icon={<Plus size={14} />} onClick={openCreate}>Novo Lançamento</Button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Select label="" value={String(mes)} onChange={(e) => setMes(Number(e.target.value))}
          options={MESES.map((m, i) => ({ value: String(i + 1), label: MESES_FULL[i] }))} />
        <Select label="" value={String(ano)} onChange={(e) => setAno(Number(e.target.value))}
          options={[2023, 2024, 2025, 2026].map((y) => ({ value: String(y), label: String(y) }))} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
      ) : doacoes.length === 0 ? (
        <EmptyState icon={<Gift size={40} />} title="Nenhum lançamento no período" description="Clique em 'Novo Lançamento' para registrar." />
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['Dizimista', 'Tipo', 'Forma', 'Competência', 'Valor', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doacoes.map((d) => (
                <tr key={d.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>
                    {(d.dizimistas as Dizimista | undefined)?.nome ?? <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Anônimo</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Badge color={tipoBadge(d.tipo_doacao)}>{TIPOS_DOACAO.find((t) => t.value === d.tipo_doacao)?.label}</Badge>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>
                    {FORMAS.find((f) => f.value === d.forma_pagamento)?.label}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-3)' }}>
                    {MESES[d.competencia_mes - 1]}/{d.competencia_ano}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--green)' }}>
                    {formatCurrency(Number(d.valor))}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button variant="ghost" size="sm" icon={<Pencil size={12} />} onClick={() => openEdit(d)} />
                      <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} onClick={() => setDeleteTarget(d)} style={{ color: 'var(--red)' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface-2)' }}>
                <td colSpan={4} style={{ padding: '12px 14px', fontWeight: 700, fontSize: 13 }}>Total do período</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--green)' }}>{formatCurrency(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar Lançamento' : 'Novo Lançamento'} width={520}
        footer={<><Button variant="secondary" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button><Button size="sm" onClick={handleSave} loading={saving}>Salvar</Button></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select label="Dizimista (opcional)" value={form.dizimista_id}
            onChange={(e) => setForm({ ...form, dizimista_id: e.target.value })}
            options={[{ value: '', label: 'Anônimo' }, ...dizimistas.map((d) => ({ value: d.id, label: d.nome }))]}
            style={{ gridColumn: '1/-1' }} />
          <Input label="Valor (R$) *" type="number" min="0" step="0.01" value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })} />
          <Select label="Tipo *" value={form.tipo_doacao}
            onChange={(e) => setForm({ ...form, tipo_doacao: e.target.value as TipoDoacao })}
            options={TIPOS_DOACAO} />
          <Select label="Forma de Pagamento *" value={form.forma_pagamento}
            onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value as FormaPagamento })}
            options={FORMAS} />
          <Select label="Mês Competência" value={String(form.competencia_mes)}
            onChange={(e) => setForm({ ...form, competencia_mes: Number(e.target.value) })}
            options={MESES_FULL.map((m, i) => ({ value: String(i + 1), label: m }))} />
          <Select label="Ano Competência" value={String(form.competencia_ano)}
            onChange={(e) => setForm({ ...form, competencia_ano: Number(e.target.value) })}
            options={[2023, 2024, 2025, 2026].map((y) => ({ value: String(y), label: String(y) }))} />
          <Textarea label="Observações" value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            style={{ gridColumn: '1/-1' }} />
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Remover Lançamento"
        message="Confirma a remoção deste lançamento? Esta ação não pode ser desfeita."
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}

// ── Dizimistas Page ───────────────────────────────────────────────────────────

type DizForm = { nome: string; telefone: string; email: string; endereco: string; data_nascimento: string };
const EMPTY_DIZ: DizForm = { nome: '', telefone: '', email: '', endereco: '', data_nascimento: '' };

export function DizimistasPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [dizimistas, setDizimistas] = useState<Dizimista[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Dizimista | null>(null);
  const [form, setForm] = useState<DizForm>(EMPTY_DIZ);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Dizimista | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!user?.cebId) return;
    setLoading(true);
    try { setDizimistas(await listDizimistas(user.cebId)); }
    catch (e: unknown) { toast.error('Erro', e instanceof Error ? e.message : ''); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.cebId]);

  const filtered = dizimistas.filter((d) =>
    d.nome.toLowerCase().includes(search.toLowerCase()) ||
    (d.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.nome) { toast.warning('Informe o nome'); return; }
    setSaving(true);
    try {
      const payload = {
        ceb_id: user!.cebId!,
        nome: form.nome,
        telefone: form.telefone || null,
        email: form.email || null,
        endereco: form.endereco || null,
        data_nascimento: form.data_nascimento || null,
        status: 'ativo' as const,
      };
      if (editTarget) await updateDizimista(editTarget.id, payload);
      else await createDizimista(payload);
      toast.success(editTarget ? 'Dizimista atualizado!' : 'Dizimista cadastrado!');
      setModalOpen(false);
      await load();
    } catch (e: unknown) {
      toast.error('Erro', e instanceof Error ? e.message : '');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDizimista(deleteTarget.id);
      toast.success('Dizimista removido');
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      toast.error('Erro', e instanceof Error ? e.message : '');
    } finally { setDeleting(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>
          Dizimistas <span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 400 }}>({dizimistas.length})</span>
        </h1>
        <Button icon={<Plus size={14} />} onClick={() => { setEditTarget(null); setForm(EMPTY_DIZ); setModalOpen(true); }}>
          Novo Dizimista
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input placeholder="Buscar por nome ou e-mail..." value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={40} />} title={search ? 'Nenhum resultado encontrado' : 'Nenhum dizimista cadastrado'} />
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['Nome', 'Telefone', 'E-mail', 'Nascimento', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--text-1)' }}>{d.nome}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>{d.telefone ?? '—'}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>{d.email ?? '—'}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-3)' }}>
                    {d.data_nascimento ? formatData(d.data_nascimento) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Badge color={d.status === 'ativo' ? 'green' : 'red'}>{d.status}</Badge>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button variant="ghost" size="sm" icon={<Pencil size={12} />}
                        onClick={() => { setEditTarget(d); setForm({ nome: d.nome, telefone: d.telefone ?? '', email: d.email ?? '', endereco: d.endereco ?? '', data_nascimento: d.data_nascimento ?? '' }); setModalOpen(true); }} />
                      <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} onClick={() => setDeleteTarget(d)} style={{ color: 'var(--red)' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar Dizimista' : 'Novo Dizimista'} width={480}
        footer={<><Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button><Button size="sm" onClick={handleSave} loading={saving}>Salvar</Button></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Nome *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={{ gridColumn: '1/-1' }} />
          <Input label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Data de Nascimento" type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
          <Input label="Endereço" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} style={{ gridColumn: '1/-1' }} />
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Remover Dizimista"
        message={`Remover "${deleteTarget?.nome}"? Os lançamentos vinculados serão mantidos como anônimos.`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}

// ── Conselheiros Page ─────────────────────────────────────────────────────────

type ConselForm = { nome: string; telefone: string; email: string; cargo: string; pastoral_movimento_id: string };
const EMPTY_CON: ConselForm = { nome: '', telefone: '', email: '', cargo: '', pastoral_movimento_id: '' };

export function ConselheirosPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [conselheiros, setConselheiros] = useState<ConselheiroComunitario[]>([]);
  const [pastorais, setPastorais] = useState<PastoralMovimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConselheiroComunitario | null>(null);
  const [form, setForm] = useState<ConselForm>(EMPTY_CON);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConselheiroComunitario | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!user?.cebId) return;
    setLoading(true);
    try {
      const [c, p] = await Promise.all([listConselheiros(user.cebId), listPastorais()]);
      setConselheiros(c);
      setPastorais(p);
    } catch (e: unknown) {
      toast.error('Erro', e instanceof Error ? e.message : '');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.cebId]);

  const handleSave = async () => {
    if (!form.nome) { toast.warning('Informe o nome'); return; }
    setSaving(true);
    try {
      const payload = {
        ceb_id: user!.cebId!,
        nome: form.nome,
        telefone: form.telefone || null,
        email: form.email || null,
        cargo: form.cargo || null,
        pastoral_movimento_id: form.pastoral_movimento_id || null,
        status: 'ativo' as const,
      };
      if (editTarget) await updateConselheiro(editTarget.id, payload);
      else await createConselheiro(payload);
      toast.success(editTarget ? 'Atualizado!' : 'Conselheiro cadastrado!');
      setModalOpen(false);
      await load();
    } catch (e: unknown) {
      toast.error('Erro', e instanceof Error ? e.message : '');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteConselheiro(deleteTarget.id);
      toast.success('Conselheiro removido');
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      toast.error('Erro', e instanceof Error ? e.message : '');
    } finally { setDeleting(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>
          Conselheiros <span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 400 }}>({conselheiros.length})</span>
        </h1>
        <Button icon={<Plus size={14} />} onClick={() => { setEditTarget(null); setForm(EMPTY_CON); setModalOpen(true); }}>
          Novo Conselheiro
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
      ) : conselheiros.length === 0 ? (
        <EmptyState icon={<UserCheck size={40} />} title="Nenhum conselheiro cadastrado" />
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['Nome', 'Cargo', 'Pastoral/Mov.', 'Telefone', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conselheiros.map((c) => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--text-1)' }}>{c.nome}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>{c.cargo ?? '—'}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>
                    {(c.pastorais_movimentos as PastoralMovimento | undefined)?.nome ?? '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-3)' }}>{c.telefone ?? '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <Badge color={c.status === 'ativo' ? 'green' : 'red'}>{c.status}</Badge>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button variant="ghost" size="sm" icon={<Pencil size={12} />}
                        onClick={() => { setEditTarget(c); setForm({ nome: c.nome, telefone: c.telefone ?? '', email: c.email ?? '', cargo: c.cargo ?? '', pastoral_movimento_id: c.pastoral_movimento_id ?? '' }); setModalOpen(true); }} />
                      <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} onClick={() => setDeleteTarget(c)} style={{ color: 'var(--red)' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar Conselheiro' : 'Novo Conselheiro'} width={480}
        footer={<><Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button><Button size="sm" onClick={handleSave} loading={saving}>Salvar</Button></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Nome *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={{ gridColumn: '1/-1' }} />
          <Input label="Cargo" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
          <Input label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select label="Pastoral/Movimento" value={form.pastoral_movimento_id}
            onChange={(e) => setForm({ ...form, pastoral_movimento_id: e.target.value })}
            options={[{ value: '', label: '— Nenhum —' }, ...pastorais.map((p) => ({ value: p.id, label: p.nome }))]}
            style={{ gridColumn: '1/-1' }} />
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Remover Conselheiro"
        message={`Remover "${deleteTarget?.nome}"?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}

// ── Aniversariantes CEB ───────────────────────────────────────────────────────

export function AniversariantesCEBPage() {
  const { user } = useAuth();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [lista, setLista] = useState<Dizimista[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.cebId) return;
    setLoading(true);
    getAniversariantesMes(user.cebId, mes)
      .then(setLista)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [mes, user?.cebId]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Aniversariantes</h1>
        <Select label="" value={String(mes)} onChange={(e) => setMes(Number(e.target.value))}
          options={MESES_FULL.map((m, i) => ({ value: String(i + 1), label: m }))} style={{ minWidth: 140 }} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
      ) : lista.length === 0 ? (
        <EmptyState icon={<Calendar size={40} />} title={`Nenhum aniversariante em ${MESES_FULL[mes - 1]}`} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {lista
            .sort((a, b) => new Date(a.data_nascimento!).getUTCDate() - new Date(b.data_nascimento!).getUTCDate())
            .map((d) => (
              <Card key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-light)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                  {formatData(d.data_nascimento!)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{d.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.telefone ?? 'Sem telefone'}</div>
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
