// ============================================================================
// DIZIMISTA SERVICE — CRUD para Dizimistas
// ============================================================================

import { supabase } from '@/lib/supabase';
import type { Dizimista } from '@/types';

export async function listDizimistas(cebId: string): Promise<Dizimista[]> {
  const { data, error } = await (supabase as any)
    .from('dizimistas')
    .select('*, cebs(id, nome)')
    .eq('ceb_id', cebId)
    .order('nome');
  if (error) throw new Error(error.message);
  return (data as Dizimista[]) ?? [];
}

export async function getDizimista(id: string): Promise<Dizimista | null> {
  const { data, error } = await (supabase as any)
    .from('dizimistas')
    .select('*, cebs(id, nome)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Dizimista | null;
}

export async function createDizimista(
  payload: Omit<Dizimista, 'id' | 'created_at' | 'updated_at' | 'cebs'>
): Promise<Dizimista> {
  const { data, error } = await (supabase as any)
    .from('dizimistas')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateDizimista(
  id: string,
  updates: Partial<Omit<Dizimista, 'id' | 'created_at' | 'cebs'>>
): Promise<Dizimista> {
  const { data, error } = await (supabase as any)
    .from('dizimistas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteDizimista(id: string): Promise<void> {
  const { error } = await supabase.from('dizimistas').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Aniversariantes do mês atual ou de um mês específico */
export async function getAniversariantesMes(
  cebId: string,
  mes?: number
): Promise<Dizimista[]> {
  const targetMes = mes ?? new Date().getMonth() + 1;
  const { data, error } = await supabase
    .from('dizimistas')
    .select('*')
    .eq('ceb_id', cebId)
    .eq('status', 'ativo')
    .not('data_nascimento', 'is', null);
  if (error) throw new Error(error.message);

  // Filtra pelo mês de nascimento no client (extrai mês da string ISO)
  return (data ?? []).filter((d) => {
    if (!d.data_nascimento) return false;
    const mes = new Date(d.data_nascimento).getUTCMonth() + 1;
    return mes === targetMes;
  }) as Dizimista[];
}

/** Aniversariantes da paróquia (todos os CEBs) */
export async function getAniversariantesParoquia(
  paroquiaId: string,
  mes?: number
): Promise<Dizimista[]> {
  const targetMes = mes ?? new Date().getMonth() + 1;

  const { data, error } = await supabase
    .from('dizimistas')
    .select('*, cebs!inner(id, nome, paroquia_id)')
    .eq('cebs.paroquia_id', paroquiaId)
    .eq('status', 'ativo')
    .not('data_nascimento', 'is', null);

  if (error) throw new Error(error.message);

  return (data ?? []).filter((d) => {
    if (!d.data_nascimento) return false;
    const m = new Date(d.data_nascimento).getUTCMonth() + 1;
    return m === targetMes;
  }) as Dizimista[];
}
