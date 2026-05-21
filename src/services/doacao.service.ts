// ============================================================================
// DOACAO SERVICE — CRUD para Doações/Dízimos
// ============================================================================

import { supabase } from '@/lib/supabase';
import type { Doacao, TipoDoacao, FormaPagamento } from '@/types';

export interface DoacaoFiltros {
  cebId?: string;
  mes?: number;
  ano?: number;
  tipo?: TipoDoacao;
  forma?: FormaPagamento;
}

export async function listDoacoes(filtros: DoacaoFiltros): Promise<Doacao[]> {
  let query = (supabase as any)
    .from('doacoes')
    .select('*, dizimistas(id, nome), cebs(id, nome)')
    .order('data_lancamento', { ascending: false });

  if (filtros.cebId) query = query.eq('ceb_id', filtros.cebId);
  if (filtros.mes) query = query.eq('competencia_mes', filtros.mes);
  if (filtros.ano) query = query.eq('competencia_ano', filtros.ano);
  if (filtros.tipo) query = query.eq('tipo_doacao', filtros.tipo);
  if (filtros.forma) query = query.eq('forma_pagamento', filtros.forma);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Doacao[]) ?? [];
}

export async function createDoacao(
  payload: Omit<Doacao, 'id' | 'created_at' | 'updated_at' | 'dizimistas' | 'cebs'>
): Promise<Doacao> {
  const { data, error } = await (supabase as any)
    .from('doacoes')
    .insert(payload)
    .select('*, dizimistas(id, nome), cebs(id, nome)')
    .single();
  if (error) throw new Error(error.message);
  return data as Doacao;
}

export async function updateDoacao(
  id: string,
  updates: Partial<Omit<Doacao, 'id' | 'created_at' | 'dizimistas' | 'cebs'>>
): Promise<Doacao> {
  const { data, error } = await (supabase as any)
    .from('doacoes')
    .update(updates)
    .eq('id', id)
    .select('*, dizimistas(id, nome), cebs(id, nome)')
    .single();
  if (error) throw new Error(error.message);
  return data as Doacao;
}

export async function deleteDoacao(id: string): Promise<void> {
  const { error } = await supabase.from('doacoes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Relatórios ────────────────────────────────────────────────────────────────

export interface ResumoMensal {
  mes: number;
  ano: number;
  totalDizimo: number;
  totalOferta: number;
  totalDoacao: number;
  total: number;
  quantidadeLancamentos: number;
}

export async function getResumoMensalCeb(
  cebId: string,
  ano: number
): Promise<ResumoMensal[]> {
  const { data, error } = await (supabase as any)
    .from('doacoes')
    .select('competencia_mes, competencia_ano, valor, tipo_doacao')
    .eq('ceb_id', cebId)
    .eq('competencia_ano', ano);

  if (error) throw new Error(error.message);

  // Agrupa por mês no client
  const meses = new Map<number, ResumoMensal>();
  const rows = (data ?? []) as any[];
  rows.forEach((d: any) => {
    if (!meses.has(d.competencia_mes)) {
      meses.set(d.competencia_mes, {
        mes: d.competencia_mes,
        ano: d.competencia_ano,
        totalDizimo: 0,
        totalOferta: 0,
        totalDoacao: 0,
        total: 0,
        quantidadeLancamentos: 0,
      });
    }
    const resumo = meses.get(d.competencia_mes)!;
    const valor = Number(d.valor);
    if (d.tipo_doacao === 'dizimo') resumo.totalDizimo += valor;
    if (d.tipo_doacao === 'oferta') resumo.totalOferta += valor;
    if (d.tipo_doacao === 'doacao') resumo.totalDoacao += valor;
    resumo.total += valor;
    resumo.quantidadeLancamentos++;
  });

  return Array.from(meses.values()).sort((a, b) => a.mes - b.mes);
}

export async function getResumoParoquial(
  paroquiaId: string,
  mes: number,
  ano: number
): Promise<{ cebId: string; cebNome: string; total: number; devolucao: number }[]> {
  const { data: cebs, error: cebErr } = await (supabase as any)
    .from('cebs')
    .select('id, nome')
    .eq('paroquia_id', paroquiaId)
    .eq('status', 'ativa');
  if (cebErr) throw new Error(cebErr.message);

  const { data: config } = await (supabase as any)
    .from('configuracoes_paroquias')
    .select('percentual_dizimo_cebs')
    .eq('paroquia_id', paroquiaId)
    .eq('ativa', true)
    .maybeSingle();

  const pct = config?.percentual_dizimo_cebs ?? 30;

  const results = await Promise.all(
    ((cebs ?? []) as any[]).map(async (ceb: any) => {
      const { data: doacoes } = await (supabase as any)
        .from('doacoes')
        .select('valor')
        .eq('ceb_id', ceb.id)
        .eq('competencia_mes', mes)
        .eq('competencia_ano', ano);

      const total = ((doacoes ?? []) as any[]).reduce(
        (a: number, d: any) => a + Number(d.valor),
        0
      );
      return {
        cebId: ceb.id,
        cebNome: ceb.nome,
        total,
        devolucao: (total * pct) / 100,
      };
    })
  );

  return results;
}
