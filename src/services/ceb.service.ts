// ============================================================================
// CEB SERVICE — CRUD para CEBs
// ============================================================================

import { supabase } from '@/lib/supabase';
import type { Ceb } from '@/types';

export async function listCebs(paroquiaId: string): Promise<Ceb[]> {
  let query = supabase.from('cebs').select('*').order('nome');
  query = query.eq('paroquia_id', paroquiaId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCeb(id: string): Promise<Ceb | null> {
  const { data, error } = await supabase
    .from('cebs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createCeb(
  payload: Omit<Ceb, 'id' | 'created_at' | 'updated_at'>
): Promise<Ceb> {
  const { data, error } = await supabase
    .from('cebs')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateCeb(
  id: string,
  updates: Partial<Omit<Ceb, 'id' | 'created_at'>>
): Promise<Ceb> {
  const { data, error } = await supabase
    .from('cebs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCeb(id: string): Promise<void> {
  const { error } = await supabase.from('cebs').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export interface CebDashboardStats {
  totalDizimistas: number;
  totalDoacoesMes: number;
  valorTotalMes: number;
  totalConselheiros: number;
}

export async function getCebDashboardStats(
  cebId: string
): Promise<CebDashboardStats> {
  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();

  const [dizimistas, doacoesMes, conselheiros] = await Promise.all([
    supabase
      .from('dizimistas')
      .select('id', { count: 'exact' })
      .eq('ceb_id', cebId)
      .eq('status', 'ativo'),
    supabase
      .from('doacoes')
      .select('valor')
      .eq('ceb_id', cebId)
      .eq('competencia_mes', mes)
      .eq('competencia_ano', ano),
    supabase
      .from('conselheiros_comunitarios')
      .select('id', { count: 'exact' })
      .eq('ceb_id', cebId)
      .eq('status', 'ativo'),
  ]);

  const valorTotal = (doacoesMes.data ?? []).reduce(
    (acc, d) => acc + Number(d.valor),
    0
  );

  return {
    totalDizimistas: dizimistas.count ?? 0,
    totalDoacoesMes: doacoesMes.data?.length ?? 0,
    valorTotalMes: valorTotal,
    totalConselheiros: conselheiros.count ?? 0,
  };
}
