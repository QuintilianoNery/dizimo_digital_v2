import React, { useEffect, useState } from 'react';
import isEmail from 'validator/lib/isEmail';
import { cnpj as cnpjValidator } from 'cpf-cnpj-validator';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { Plus, Pencil, Trash2, Church } from 'lucide-react';
import {
  listParoquias, createParoquia, updateParoquia, deleteParoquia,
} from '@/services/admin.service';
import { createAuthUser } from '@/services/auth.service';
import type { Paroquia } from '@/types';
import {
  Button, Modal, Input, Badge, ConfirmDialog, EmptyState, Spinner, useToast,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { usePersistentModalDraft } from '@/hooks/usePersistentModalDraft';

type FormData = {
  codigo_paroquia: string;
  nome: string;
  email: string;
  email_login_secretaria: string;
  senha: string;
  telefone: string;
  endereco: string;
  paroco_nome: string;
  cnpj: string;
};

const EMPTY_FORM: FormData = {
  codigo_paroquia: '', nome: '', email: '', email_login_secretaria: '',
  senha: '', telefone: '', endereco: '', paroco_nome: '', cnpj: '',
};

export function ParoquiasPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [paroquias, setParoquias] = useState<Paroquia[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    modalOpen,
    setModalOpen,
    editTarget,
    setEditTarget,
    form,
    setForm,
    clearDraft,
  } = usePersistentModalDraft<FormData, Paroquia>('dizimo-digital:admin:paroquias:draft', EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Paroquia | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setParoquias(await listParoquias());
    } catch (e: unknown) {
      toast.error('Erro ao carregar paróquias', e instanceof Error ? e.message : '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: Paroquia) => {
    setEditTarget(p);
    setForm({
      codigo_paroquia: p.codigo_paroquia,
      nome: p.nome,
      email: p.email,
      email_login_secretaria: p.email_login_secretaria ?? '',
      senha: '',
      telefone: p.telefone ?? '',
      endereco: p.endereco ?? '',
      paroco_nome: p.paroco_nome ?? '',
      cnpj: p.cnpj ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome || !form.email || !form.codigo_paroquia) {
      toast.warning('Preencha os campos obrigatórios');
      return;
    }
    setSaving(true);
    try {
      // format/validate fields
      if (form.email && !isEmail(form.email)) { toast.warning('E-mail da paróquia inválido'); return; }
      if (form.email_login_secretaria && !isEmail(form.email_login_secretaria)) { toast.warning('E-mail da secretaria inválido'); return; }
      if (form.cnpj) {
        if (!cnpjValidator.isValid(form.cnpj.replace(/\D/g, ''))) { toast.warning('CNPJ inválido'); return; }
      }
      if (form.telefone) {
        try {
          const pn = parsePhoneNumberFromString(form.telefone, 'BR');
          if (!pn || !pn.isValid()) { toast.warning('Telefone inválido'); return; }
        } catch (e) { toast.warning('Telefone inválido'); return; }
      }
      if (editTarget) {
        await updateParoquia(editTarget.id, {
          nome: form.nome,
          email: form.email,
          email_login_secretaria: form.email_login_secretaria || null,
          telefone: form.telefone || null,
          endereco: form.endereco || null,
          paroco_nome: form.paroco_nome || null,
          cnpj: form.cnpj || null,
        });
        toast.success('Paróquia atualizada!');
      } else {
        if (!form.senha) { toast.warning('Informe a senha'); setSaving(false); return; }
        // Cria usuário no Supabase Auth para a secretaria
        if (form.email_login_secretaria) {
          await createAuthUser(form.email_login_secretaria, form.senha);
        }
        await createParoquia({
          administrador_criou_id: user!.id,
          codigo_paroquia: form.codigo_paroquia,
          nome: form.nome,
          email: form.email,
          email_login_secretaria: form.email_login_secretaria || null,
          telefone: form.telefone || null,
          endereco: form.endereco || null,
          paroco_nome: form.paroco_nome || null,
          cnpj: form.cnpj || null,
          logo_url: null,
          status: 'ativa',
          fundacao: null,
        });
        toast.success('Paróquia criada!');
      }
      setModalOpen(false);
      clearDraft();
      await load();
    } catch (e: unknown) {
      toast.error('Erro ao salvar', e instanceof Error ? e.message : '');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteParoquia(deleteTarget.id);
      toast.success('Paróquia removida');
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      toast.error('Erro ao remover', e instanceof Error ? e.message : '');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Paróquias</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-3)', fontSize: 13 }}>Gerencie as paróquias da plataforma</p>
        </div>
        <Button icon={<Plus size={14} />} onClick={openCreate}>Nova Paróquia</Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
      ) : paroquias.length === 0 ? (
        <EmptyState icon={<Church size={40} />} title="Nenhuma paróquia cadastrada" description="Clique em 'Nova Paróquia' para começar." />
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['Código', 'Nome', 'E-mail', 'Pároco', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paroquias.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px', color: 'var(--text-3)' }}>{p.codigo_paroquia}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--text-1)' }}>{p.nome}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>{p.email}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>{p.paroco_nome ?? '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <Badge color={p.status === 'ativa' ? 'green' : 'red'}>
                      {p.status === 'ativa' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button variant="ghost" size="sm" icon={<Pencil size={12} />} onClick={() => openEdit(p)}>Editar</Button>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} onClick={() => setDeleteTarget(p)} style={{ color: 'var(--red)' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de formulário */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Editar Paróquia' : 'Nova Paróquia'}
        width={560}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} loading={saving}>Salvar</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Código *" value={form.codigo_paroquia} onChange={(e) => setForm({ ...form, codigo_paroquia: e.target.value })} disabled={!!editTarget} />
          <Input label="Nome *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <Input label="E-mail da Paróquia *" mask="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ gridColumn: '1/-1' }} />
          <Input label="E-mail Login Secretaria" value={form.email_login_secretaria} onChange={(e) => setForm({ ...form, email_login_secretaria: e.target.value })} />
          {!editTarget && <Input label="Senha *" type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} hint="Será criado no Supabase Auth" />}
          <Input label="Pároco" value={form.paroco_nome} onChange={(e) => setForm({ ...form, paroco_nome: e.target.value })} />
          <Input label="Telefone" mask="phone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          <Input label="CNPJ" mask="cnpj" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          <Input label="Endereço" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} style={{ gridColumn: '1/-1' }} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remover Paróquia"
        message={`Tem certeza que deseja remover "${deleteTarget?.nome}"? Todos os CEBs, dizimistas e doações serão excluídos.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
