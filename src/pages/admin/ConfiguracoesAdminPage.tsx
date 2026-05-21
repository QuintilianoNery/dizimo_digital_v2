import React, { useEffect, useState } from 'react';
import { getAdministrador, updateAdministrador } from '@/services/admin.service';
import { Input, Button, Card, useToast, Spinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import type { Administrador } from '@/types';

export function ConfiguracoesAdminPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [admin, setAdmin] = useState<Administrador | null>(null);
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getAdministrador(user.id)
      .then((a) => { setAdmin(a); setNome(a?.nome ?? ''); })
      .catch((e) => toast.error('Erro ao carregar', e.message))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSave = async () => {
    if (!admin) return;
    setSaving(true);
    try {
      await updateAdministrador(admin.id, { nome });
      toast.success('Dados atualizados!');
    } catch (e: unknown) {
      toast.error('Erro ao salvar', e instanceof Error ? e.message : '');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>;

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Configurações</h1>
      <Card style={{ maxWidth: 480 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Dados do Administrador</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input label="E-mail" value={admin?.email ?? ''} disabled hint="Para alterar o e-mail, acesse o painel do Supabase" />
          <Button onClick={handleSave} loading={saving} style={{ alignSelf: 'flex-start' }}>Salvar Alterações</Button>
        </div>
      </Card>
    </div>
  );
}
