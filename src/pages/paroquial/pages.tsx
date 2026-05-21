// ============================================================================
// PÁGINAS PAROQUIAL
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, BarChart3 } from 'lucide-react';
import { listCebs, createCeb, updateCeb, deleteCeb } from '@/services/ceb.service';
import { getResumoParoquial } from '@/services/doacao.service';
import {
  listPastorais, createPastoral, updatePastoral, deletePastoral,
} from '@/services/conselheiro.service';
import { getConfiguracaoParoquia, upsertConfiguracaoParoquia } from '@/services/admin.service';
import { createAuthUser } from '@/services/auth.service';
import type { Ceb, PastoralMovimento, ConfiguracaoParoquia } from '@/types';
import {
  Button, Modal, Input, Badge, ConfirmDialog, EmptyState, Spinner, Card, useToast, Select,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

// ── Dashboard Paroquial ───────────────────────────────────────────────────────

export function DashboardParoquial() {
  const { user } = useAuth();
  const [cebs, setCebs] = useState<Ceb[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.paroquiaId) return;
    listCebs(user.paroquiaId)
      .then(setCebs)
      .finally(() => setLoading(false));
  }, [user?.paroquiaId]);

  return (
    <div>
      <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>
        Painel Paroquial
      </h1>
      <p style={{ margin: '0 0 24px', color: 'var(--text-3)', fontSize: 13 }}>Bem-vindo, {user?.nome}</p>

      {loading ? <Spinner size={28} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-1)' }}>{cebs.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>CEBs Cadastradas</div>
          </Card>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--green)' }}>
              {cebs.filter((c) => c.status === 'ativa').length}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>CEBs Ativas</div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── CEBs Page ─────────────────────────────────────────────────────────────────

type CebForm = { codigo_ceb: string; nome: string; email_login: string; senha: string; telefone: string };
const EMPTY_CEB: CebForm = { codigo_ceb: '', nome: '', email_login: '', senha: '', telefone: '' };

export function CEBsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [cebs, setCebs] = useState<Ceb[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Ceb | null>(null);
  const [form, setForm] = useState<CebForm>(EMPTY_CEB);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ceb | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!user?.paroquiaId) return;
    setLoading(true);
    try { setCebs(await listCebs(user.paroquiaId)); }
    catch (e: unknown) { toast.error('Erro ao carregar CEBs', e instanceof Error ? e.message : ''); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.paroquiaId]);

  const handleSave = async () => {
    if (!form.nome || !form.codigo_ceb) { toast.warning('Preencha os campos obrigatórios'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await updateCeb(editTarget.id, { nome: form.nome, email_login: form.email_login || null, telefone: form.telefone || null });
      } else {
        if (!form.senha) { toast.warning('Informe a senha'); setSaving(false); return; }
        if (form.email_login) await createAuthUser(form.email_login, form.senha);
        await createCeb({
          paroquia_id: user!.paroquiaId!,
          codigo_ceb: form.codigo_ceb,
          nome: form.nome,
          email_login: form.email_login || null,
          telefone: form.telefone || null,
          logo_url: null,
          status: 'ativa',
        });
      }
      toast.success(editTarget ? 'CEB atualizada!' : 'CEB criada!');
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
      await deleteCeb(deleteTarget.id);
      toast.success('CEB removida');
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      toast.error('Erro ao remover', e instanceof Error ? e.message : '');
    } finally { setDeleting(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>CEBs</h1>
        <Button icon={<Plus size={14} />} onClick={() => { setEditTarget(null); setForm(EMPTY_CEB); setModalOpen(true); }}>
          Nova CEB
        </Button>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
        : cebs.length === 0 ? <EmptyState icon={<Users size={40} />} title="Nenhuma CEB cadastrada" />
        : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  {['Código', 'Nome', 'E-mail Login', 'Status', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cebs.map((c) => (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px', color: 'var(--text-3)' }}>{c.codigo_ceb}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--text-1)' }}>{c.nome}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>{c.email_login ?? '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge color={c.status === 'ativa' ? 'green' : 'red'}>{c.status === 'ativa' ? 'Ativa' : 'Inativa'}</Badge>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button variant="ghost" size="sm" icon={<Pencil size={12} />}
                          onClick={() => { setEditTarget(c); setForm({ codigo_ceb: c.codigo_ceb, nome: c.nome, email_login: c.email_login ?? '', senha: '', telefone: c.telefone ?? '' }); setModalOpen(true); }} />
                        <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} onClick={() => setDeleteTarget(c)} style={{ color: 'var(--red)' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar CEB' : 'Nova CEB'}
        footer={<><Button variant="secondary" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button><Button size="sm" onClick={handleSave} loading={saving}>Salvar</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Código *" value={form.codigo_ceb} onChange={(e) => setForm({ ...form, codigo_ceb: e.target.value })} disabled={!!editTarget} />
          <Input label="Nome *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <Input label="E-mail Login" value={form.email_login} onChange={(e) => setForm({ ...form, email_login: e.target.value })} />
          {!editTarget && <Input label="Senha" type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />}
          <Input label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Remover CEB" message={`Remover "${deleteTarget?.nome}"? Os dados vinculados serão excluídos.`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}

// ── Pastorais Page ────────────────────────────────────────────────────────────

export function PastoraisPage() {
  const toast = useToast();
  const [pastorais, setPastorais] = useState<PastoralMovimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PastoralMovimento | null>(null);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'pastoral' | 'movimento'>('pastoral');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PastoralMovimento | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setPastorais(await listPastorais()); }
    catch (e: unknown) { toast.error('Erro', e instanceof Error ? e.message : ''); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!nome) { toast.warning('Informe o nome'); return; }
    setSaving(true);
    try {
      if (editTarget) await updatePastoral(editTarget.id, { nome, tipo });
      else await createPastoral({ nome, tipo, status: 'ativo' });
      toast.success(editTarget ? 'Atualizado!' : 'Criado!');
      setModalOpen(false);
      await load();
    } catch (e: unknown) {
      toast.error('Erro', e instanceof Error ? e.message : '');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Pastorais e Movimentos</h1>
        <Button icon={<Plus size={14} />} onClick={() => { setEditTarget(null); setNome(''); setTipo('pastoral'); setModalOpen(true); }}>Novo</Button>
      </div>

      {loading ? <Spinner size={28} /> : pastorais.length === 0 ? <EmptyState title="Nenhuma pastoral cadastrada" /> : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['Nome', 'Tipo', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pastorais.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--text-1)' }}>{p.nome}</td>
                  <td style={{ padding: '12px 14px' }}><Badge color={p.tipo === 'pastoral' ? 'blue' : 'amber'}>{p.tipo}</Badge></td>
                  <td style={{ padding: '12px 14px' }}><Badge color={p.status === 'ativo' ? 'green' : 'red'}>{p.status}</Badge></td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button variant="ghost" size="sm" icon={<Pencil size={12} />}
                        onClick={() => { setEditTarget(p); setNome(p.nome); setTipo(p.tipo); setModalOpen(true); }} />
                      <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} onClick={() => setDeleteTarget(p)} style={{ color: 'var(--red)' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar' : 'Nova Pastoral/Movimento'}
        footer={<><Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button><Button size="sm" onClick={handleSave} loading={saving}>Salvar</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Nome *" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as 'pastoral' | 'movimento')}
            options={[{ value: 'pastoral', label: 'Pastoral' }, { value: 'movimento', label: 'Movimento' }]} />
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Remover" message={`Remover "${deleteTarget?.nome}"?`}
        onConfirm={async () => { setDeleting(true); try { await deletePastoral(deleteTarget!.id); toast.success('Removido'); setDeleteTarget(null); await load(); } catch (e: unknown) { toast.error('Erro', e instanceof Error ? e.message : ''); } finally { setDeleting(false); } }}
        onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}

// ── Configurações Paroquial ───────────────────────────────────────────────────

export function ConfiguracoesParoquialPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [config, setConfig] = useState<Partial<ConfiguracaoParoquia>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.paroquiaId) return;
    getConfiguracaoParoquia(user.paroquiaId)
      .then((c) => { if (c) setConfig(c); })
      .finally(() => setLoading(false));
  }, [user?.paroquiaId]);

  const handleSave = async () => {
    if (!user?.paroquiaId) return;
    setSaving(true);
    try {
      await upsertConfiguracaoParoquia(user.paroquiaId, {
        percentual_dizimo_cebs: config.percentual_dizimo_cebs ?? 30,
        percentual_oferta_cebs: config.percentual_oferta_cebs ?? 20,
        percentual_curia_diocesana: config.percentual_curia_diocesana ?? 5,
        percentual_diocese: config.percentual_diocese ?? 10,
        vigente_desde: config.vigente_desde ?? new Date().toISOString().split('T')[0],
        vigente_ate: config.vigente_ate ?? null,
        ativa: true,
      });
      toast.success('Configurações salvas!');
    } catch (e: unknown) {
      toast.error('Erro', e instanceof Error ? e.message : '');
    } finally { setSaving(false); }
  };

  if (loading) return <Spinner size={28} />;

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Configurações Paroquiais</h1>
      <Card style={{ maxWidth: 480 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Percentuais de Distribuição</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([
            ['percentual_dizimo_cebs', '% Dízimo para CEBs'],
            ['percentual_oferta_cebs', '% Oferta para CEBs'],
            ['percentual_curia_diocesana', '% Cúria Diocesana'],
            ['percentual_diocese', '% Diocese'],
          ] as [keyof ConfiguracaoParoquia, string][]).map(([field, label]) => (
            <Input key={field} label={label} type="number" min="0" max="100" step="0.5"
              value={String(config[field] ?? '')}
              onChange={(e) => setConfig({ ...config, [field]: parseFloat(e.target.value) })} />
          ))}
          <Input label="Vigente desde" type="date" value={config.vigente_desde ?? ''}
            onChange={(e) => setConfig({ ...config, vigente_desde: e.target.value })} style={{ gridColumn: '1/-1' }} />
        </div>
        <Button onClick={handleSave} loading={saving} style={{ marginTop: 16 }}>Salvar</Button>
      </Card>
    </div>
  );
}

// ── Configurações CEB ─────────────────────────────────────────────────────────

export function ConfiguracoesCEBPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [ceb, setCeb] = useState<{ nome: string; email_login: string; telefone: string }>({ nome: '', email_login: '', telefone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.cebId) return;
    import('@/services/ceb.service').then(({ getCeb }) =>
      getCeb(user.cebId!).then((c) => { if (c) setCeb({ nome: c.nome, email_login: c.email_login ?? '', telefone: c.telefone ?? '' }); })
    ).finally(() => setLoading(false));
  }, [user?.cebId]);

  const handleSave = async () => {
    if (!user?.cebId) return;
    setSaving(true);
    try {
      const { updateCeb: upd } = await import('@/services/ceb.service');
      await upd(user.cebId, { nome: ceb.nome, telefone: ceb.telefone || null });
      toast.success('Configurações salvas!');
    } catch (e: unknown) {
      toast.error('Erro', e instanceof Error ? e.message : '');
    } finally { setSaving(false); }
  };

  if (loading) return <Spinner size={28} />;

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Configurações da Comunidade</h1>
      <Card style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Nome da CEB" value={ceb.nome} onChange={(e) => setCeb({ ...ceb, nome: e.target.value })} />
          <Input label="E-mail de Login" value={ceb.email_login} disabled hint="Para alterar, contate a secretaria paroquial" />
          <Input label="Telefone" value={ceb.telefone} onChange={(e) => setCeb({ ...ceb, telefone: e.target.value })} />
          <Button onClick={handleSave} loading={saving} style={{ alignSelf: 'flex-start' }}>Salvar</Button>
        </div>
      </Card>
    </div>
  );
}

// ── Relatórios Paroquial ──────────────────────────────────────────────────────

export function RelatoriosParoquialPage() {
  const { user } = useAuth();
  const toast = useToast();
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [resumo, setResumo] = useState<{ cebId: string; cebNome: string; total: number; devolucao: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user?.paroquiaId) return;
    setLoading(true);
    try { setResumo(await getResumoParoquial(user.paroquiaId, mes, ano)); }
    catch (e: unknown) { toast.error('Erro', e instanceof Error ? e.message : ''); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [mes, ano, user?.paroquiaId]);

  const totalGeral = resumo.reduce((a, r) => a + r.total, 0);
  const totalDevolucao = resumo.reduce((a, r) => a + r.devolucao, 0);
  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Relatórios</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Select label="Mês" value={String(mes)} onChange={(e) => setMes(Number(e.target.value))}
          options={MESES.map((m, i) => ({ value: String(i + 1), label: m }))} />
        <Select label="Ano" value={String(ano)} onChange={(e) => setAno(Number(e.target.value))}
          options={[2023, 2024, 2025, 2026].map((y) => ({ value: String(y), label: String(y) }))} />
      </div>

      {loading ? <Spinner size={28} /> : resumo.length === 0 ? <EmptyState title="Nenhum dado para o período" /> : (
        <>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  {['CEB', 'Total Arrecadado', 'Devolução à CEB'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resumo.map((r) => (
                  <tr key={r.cebId} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--text-1)' }}>{r.cebNome}</td>
                    <td style={{ padding: '12px 14px' }}>R$ {r.total.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--green)', fontWeight: 600 }}>R$ {r.devolucao.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface-2)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700 }}>Total</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700 }}>R$ {totalGeral.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--green)' }}>R$ {totalDevolucao.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
            <BarChart3 size={12} style={{ marginRight: 4 }} />
            Competência: {MESES[mes - 1]} / {ano}
          </p>
        </>
      )}
    </div>
  );
}
