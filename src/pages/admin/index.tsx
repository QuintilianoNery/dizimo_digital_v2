import { useState } from 'react';
import { Building2, Plus, Pencil, Trash2, KeyRound, TrendingUp, Users, Heart, FileText } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../components/ui/index';
import { Modal, ConfirmDialog, PageHeader, SearchBar, StatusBadge, StatCard, SectionCard, EmptyState } from '../../components/ui/index';
import { formatCurrency } from '../../utils/calculations';
import type { Paroquia } from '../../types';

// ── ADMIN DASHBOARD ────────────────────────────────────────────────────────
export function AdminDashboard() {
  const { getParoquias, getCEBs, getDoacoes } = useData();
  const paroquias = getParoquias();
  const allCebs = paroquias.flatMap((p) => getCEBs(p.id));
  const allDoacoes = getDoacoes();
  const totalArrecadado = allDoacoes.reduce((s, d) => s + d.valor, 0);

  return (
    <div>
      <PageHeader title="Dashboard Administrativo" subtitle="Visão geral do sistema" />
      <div className="grid-stats">
        <StatCard label="Paróquias" value={String(paroquias.length)} sub="cadastradas" icon={<Building2 size={20} />} color="var(--primary)" />
        <StatCard label="CEBs" value={String(allCebs.length)} sub="ativas" icon={<Users size={20} />} color="var(--accent)" />
        <StatCard label="Total arrecadado" value={formatCurrency(totalArrecadado)} sub="todos os períodos" icon={<Heart size={20} />} color="var(--success)" />
        <StatCard label="Registros de doação" value={String(allDoacoes.length)} sub="lançamentos" icon={<FileText size={20} />} color="var(--info)" />
      </div>

      <SectionCard title="Paróquias cadastradas">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Pároco</th>
                <th>CEBs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paroquias.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>Nenhuma paróquia cadastrada</td></tr>
              ) : paroquias.map((p) => (
                <tr key={p.id}>
                  <td><span className="badge badge-neutral">{p.codigoParoquia}</span></td>
                  <td style={{ fontWeight: 500 }}>{p.nome}</td>
                  <td>{p.parocoNome}</td>
                  <td>{getCEBs(p.id).length}</td>
                  <td><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ── PAROQUIAS PAGE ─────────────────────────────────────────────────────────
export function ParoquiasPage() {
  const { getParoquias, saveParoquia, deleteParoquia, resetSenhaParoquia, getCEBs } = useData();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Paroquia | null>(null);
  const [newSenha, setNewSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [form, setForm] = useState<Partial<Paroquia>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const paroquias = getParoquias().filter(
    (p) => p.nome.toLowerCase().includes(search.toLowerCase()) || p.codigoParoquia.includes(search),
  );

  const openNew = () => { setForm({ status: 'ativa' }); setErrors({}); setSelected(null); setModalOpen(true); };
  const openEdit = (p: Paroquia) => { setForm({ ...p }); setErrors({}); setSelected(p); setModalOpen(true); };
  const openReset = (p: Paroquia) => { setSelected(p); setNewSenha(''); setConfirmSenha(''); setResetOpen(true); };
  const openDelete = (p: Paroquia) => { setSelected(p); setDeleteOpen(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nome?.trim()) e.nome = 'Nome obrigatório';
    if (!form.email?.trim()) e.email = 'Email obrigatório';
    if (!form.emailLoginSecretaria?.trim()) e.emailLoginSecretaria = 'Email da secretaria obrigatório';
    if (!selected && !form.senha?.trim()) e.senha = 'Senha obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    saveParoquia(form as Paroquia);
    setModalOpen(false);
    showToast(selected ? 'Paróquia atualizada!' : 'Paróquia cadastrada!');
  };

  const handleReset = () => {
    if (!newSenha || newSenha !== confirmSenha) { showToast('Senhas não conferem', 'error'); return; }
    resetSenhaParoquia(selected!.id, newSenha);
    setResetOpen(false);
    showToast('Senha resetada com sucesso!');
  };

  const handleDelete = () => {
    deleteParoquia(selected!.id);
    setDeleteOpen(false);
    showToast('Paróquia excluída');
  };

  const f = (field: keyof Paroquia, val: string) => setForm((prev) => ({ ...prev, [field]: val }));

  return (
    <div>
      <PageHeader
        title="Paróquias"
        subtitle="Gerencie as paróquias cadastradas no sistema"
        action={<button className="btn btn-primary" onClick={openNew}><Plus size={16} />Nova paróquia</button>}
      />

      <SectionCard>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome ou código..." />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th><th>Nome</th><th>Pároco</th><th>Email secretaria</th><th>CEBs</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paroquias.length === 0 ? (
                <tr><td colSpan={7}><EmptyState title="Nenhuma paróquia encontrada" icon={<Building2 size={40} />} /></td></tr>
              ) : paroquias.map((p) => (
                <tr key={p.id}>
                  <td><span className="badge badge-neutral">{p.codigoParoquia}</span></td>
                  <td style={{ fontWeight: 500 }}>{p.nome}</td>
                  <td>{p.parocoNome}</td>
                  <td style={{ color: 'var(--text-3)' }}>{p.emailLoginSecretaria}</td>
                  <td>{getCEBs(p.id).length}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openReset(p)} title="Reset senha"><KeyRound size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title="Editar"><Pencil size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => openDelete(p)} title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Editar paróquia' : 'Nova paróquia'}
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>Salvar</button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-input" value={form.nome ?? ''} onChange={(e) => f('nome', e.target.value)} />
            {errors.nome && <span className="form-error">{errors.nome}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Código da paróquia</label>
            <input className="form-input" value={form.codigoParoquia ?? ''} onChange={(e) => f('codigoParoquia', e.target.value)} placeholder="Gerado automaticamente" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Pároco</label>
            <input className="form-input" value={form.parocoNome ?? ''} onChange={(e) => f('parocoNome', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" value={form.email ?? ''} onChange={(e) => f('email', e.target.value)} />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input className="form-input" value={form.telefone ?? ''} onChange={(e) => f('telefone', e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="form-group">
            <label className="form-label">CNPJ</label>
            <input className="form-input" value={form.cnpj ?? ''} onChange={(e) => f('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Endereço</label>
          <input className="form-input" value={form.endereco ?? ''} onChange={(e) => f('endereco', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Data de fundação</label>
            <input className="form-input" type="date" value={form.fundacao ?? ''} onChange={(e) => f('fundacao', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status ?? 'ativa'} onChange={(e) => f('status', e.target.value)}>
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email da secretaria (login) *</label>
            <input className="form-input" type="email" value={form.emailLoginSecretaria ?? ''} onChange={(e) => f('emailLoginSecretaria', e.target.value)} />
            {errors.emailLoginSecretaria && <span className="form-error">{errors.emailLoginSecretaria}</span>}
          </div>
          {!selected && (
            <div className="form-group">
              <label className="form-label">Senha *</label>
              <input className="form-input" type="password" value={form.senha ?? ''} onChange={(e) => f('senha', e.target.value)} />
              {errors.senha && <span className="form-error">{errors.senha}</span>}
            </div>
          )}
        </div>
      </Modal>

      {/* Reset senha */}
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title={`Reset de senha — ${selected?.nome}`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setResetOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleReset}>Confirmar reset</button>
          </>
        }
      >
        <div className="alert alert-warning"><span>Esta ação irá redefinir a senha de acesso paroquial.</span></div>
        <div className="form-group">
          <label className="form-label">Nova senha</label>
          <input className="form-input" type="password" value={newSenha} onChange={(e) => setNewSenha(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Confirmar nova senha</label>
          <input className="form-input" type="password" value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)} />
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Excluir paróquia"
        message={`Tem certeza que deseja excluir "${selected?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
