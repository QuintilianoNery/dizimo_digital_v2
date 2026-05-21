// ============================================================================
// CONSELHEIRO SERVICE — CRUD para Conselheiros Comunitários
// ============================================================================

import { supabase } from '@/lib/supabase';
import type { ConselheiroComunitario, PastoralMovimento } from '@/types';

export async function listConselheiros(cebId: string): Promise<ConselheiroComunitario[]> {
  const { data, error } = await supabase
    .from('conselheiros_comunitarios')
    .select('*, pastorais_movimentos(id, nome, tipo), cebs(id, nome)')
    .eq('ceb_id', cebId)
    .order('nome');
  if (error) throw new Error(error.message);
  return (data as ConselheiroComunitario[]) ?? [];
}

export async function createConselheiro(
  payload: Omit<ConselheiroComunitario, 'id' | 'created_at' | 'updated_at' | 'pastorais_movimentos' | 'cebs'>
): Promise<ConselheiroComunitario> {
  const { data, error } = await supabase
    .from('conselheiros_comunitarios')
    .insert(payload)
    .select('*, pastorais_movimentos(id, nome, tipo)')
    .single();
  if (error) throw new Error(error.message);
  return data as ConselheiroComunitario;
}

export async function updateConselheiro(
  id: string,
  updates: Partial<Omit<ConselheiroComunitario, 'id' | 'created_at' | 'pastorais_movimentos' | 'cebs'>>
): Promise<ConselheiroComunitario> {
  const { data, error } = await supabase
    .from('conselheiros_comunitarios')
    .update(updates)
    .eq('id', id)
    .select('*, pastorais_movimentos(id, nome, tipo)')
    .single();
  if (error) throw new Error(error.message);
  return data as ConselheiroComunitario;
}

export async function deleteConselheiro(id: string): Promise<void> {
  const { error } = await supabase
    .from('conselheiros_comunitarios')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// ============================================================================
// PASTORAL SERVICE — CRUD para Pastorais e Movimentos
// ============================================================================

export async function listPastorais(): Promise<PastoralMovimento[]> {
  const { data, error } = await supabase
    .from('pastorais_movimentos')
    .select('*')
    .order('nome');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPastoral(
  payload: Omit<PastoralMovimento, 'id' | 'created_at' | 'updated_at'>
): Promise<PastoralMovimento> {
  const { data, error } = await supabase
    .from('pastorais_movimentos')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updatePastoral(
  id: string,
  updates: Partial<Omit<PastoralMovimento, 'id' | 'created_at'>>
): Promise<PastoralMovimento> {
  const { data, error } = await supabase
    .from('pastorais_movimentos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deletePastoral(id: string): Promise<void> {
  const { error } = await supabase
    .from('pastorais_movimentos')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
