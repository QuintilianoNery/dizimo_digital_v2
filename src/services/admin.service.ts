// ============================================================================
// ADMIN SERVICE — CRUD para Administradores e Paróquias
// Todas as operações passam pelo Supabase (banco de dados).
// ============================================================================

import { supabase } from '@/lib/supabase';
import type { Administrador, Paroquia, ConfiguracaoParoquia } from '@/types';

// ── Administradores ───────────────────────────────────────────────────────────

export async function getAdministrador(id: string): Promise<Administrador | null> {
  const { data, error } = await supabase
    .from('administradores')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateAdministrador(
  id: string,
  updates: Partial<Pick<Administrador, 'nome' | 'logo_url' | 'status'>>
): Promise<Administrador> {
  const { data, error } = await supabase
    .from('administradores')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Paróquias ─────────────────────────────────────────────────────────────────

export async function listParoquias(): Promise<Paroquia[]> {
  const { data, error } = await supabase
    .from('paroquias')
    .select('*')
    .order('nome');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getParoquia(id: string): Promise<Paroquia | null> {
  const { data, error } = await supabase
    .from('paroquias')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createParoquia(
  payload: Omit<Paroquia, 'id' | 'created_at' | 'updated_at'>
): Promise<Paroquia> {
  const { data, error } = await supabase
    .from('paroquias')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateParoquia(
  id: string,
  updates: Partial<Omit<Paroquia, 'id' | 'created_at'>>
): Promise<Paroquia> {
  const { data, error } = await supabase
    .from('paroquias')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteParoquia(id: string): Promise<void> {
  const { error } = await supabase.from('paroquias').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Configurações Paróquias ───────────────────────────────────────────────────

export async function getConfiguracaoParoquia(
  paroquiaId: string
): Promise<ConfiguracaoParoquia | null> {
  const { data, error } = await supabase
    .from('configuracoes_paroquias')
    .select('*')
    .eq('paroquia_id', paroquiaId)
    .eq('ativa', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function upsertConfiguracaoParoquia(
  paroquiaId: string,
  config: Omit<ConfiguracaoParoquia, 'id' | 'paroquia_id' | 'created_at' | 'updated_at'>
): Promise<ConfiguracaoParoquia> {
  const { data, error } = await supabase
    .from('configuracoes_paroquias')
    .upsert({ ...config, paroquia_id: paroquiaId }, { onConflict: 'paroquia_id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Dashboard Admin ───────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalParoquias: number;
  paroquiasAtivas: number;
  totalCebs: number;
  totalDizimistas: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [paroquias, cebs, dizimistas] = await Promise.all([
    supabase.from('paroquias').select('id, status', { count: 'exact' }),
    supabase.from('cebs').select('id', { count: 'exact' }),
    supabase.from('dizimistas').select('id', { count: 'exact' }).eq('status', 'ativo'),
  ]);

  const paroquiasData = paroquias.data ?? [];
  return {
    totalParoquias: paroquias.count ?? 0,
    paroquiasAtivas: paroquiasData.filter((p) => p.status === 'ativa').length,
    totalCebs: cebs.count ?? 0,
    totalDizimistas: dizimistas.count ?? 0,
  };
}
