import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente (configure no .env.local)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!hasSupabaseConfig) {
  console.warn(
    'Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY no .env.local',
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tipos de banco de dados
export interface SupabaseAdministrador {
  id: string;
  nome: string;
  email: string;
  senha: string;
  logo_url?: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface SupabaseParoquia {
  id: string;
  administrador_criou_id: string;
  codigo_paroquia: string;
  logo_url?: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  fundacao?: string;
  cnpj?: string;
  paroco_nome?: string;
  email_login_secretaria?: string;
  senha: string;
  status: 'ativa' | 'inativa';
  created_at: string;
  updated_at: string;
}

export interface SupabaseConfiguracaoParoquia {
  id: string;
  paroquia_id: string;
  percentual_dizimo_cebs: number;
  percentual_oferta_cebs: number;
  percentual_curia_diocesana: number;
  percentual_diocese: number;
  vigente_desde: string;
  vigente_ate?: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseCEB {
  id: string;
  paroquia_id: string;
  codigo_ceb: string;
  logo_url?: string;
  nome: string;
  email_login?: string;
  senha: string;
  telefone?: string;
  status: 'ativa' | 'inativa';
  created_at: string;
  updated_at: string;
}

export interface SupabasePastoralMovimento {
  id: string;
  nome: string;
  tipo: 'pastoral' | 'movimento';
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface SupabaseConselheiroComunitario {
  id: string;
  ceb_id: string;
  pastoral_movimento_id?: string;
  nome: string;
  telefone?: string;
  email?: string;
  cargo?: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface SupabaseDizimista {
  id: string;
  ceb_id: string;
  nome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  data_nascimento?: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface SupabaseDoacao {
  id: string;
  ceb_id: string;
  dizimista_id?: string;
  valor: number;
  competencia_mes: number;
  competencia_ano: number;
  tipo_doacao: 'dizimo' | 'oferta' | 'doacao';
  forma_pagamento: 'dinheiro' | 'pix' | 'transferencia';
  observacoes?: string;
  data_lancamento: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseAlertaPercentual {
  id: string;
  paroquia_id: string;
  ceb_id: string;
  configuracao_paroquia_id: string;
  percentual_dizimo_anterior?: number;
  percentual_dizimo_novo?: number;
  percentual_oferta_anterior?: number;
  percentual_oferta_novo?: number;
  mensagem: string;
  lido_em?: string;
  created_at: string;
  updated_at: string;
}

// Funções auxiliares

export async function testConnection(): Promise<boolean> {
  if (!hasSupabaseConfig) return false;

  try {
    const { data, error } = await supabase.from('administradores').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function mapSupabaseParoquiaToApp(sp: SupabaseParoquia) {
  return {
    id: sp.id,
    administradorCriouId: sp.administrador_criou_id,
    codigoParoquia: sp.codigo_paroquia,
    logoUrl: sp.logo_url,
    nome: sp.nome,
    email: sp.email,
    telefone: sp.telefone,
    endereco: sp.endereco,
    fundacao: sp.fundacao,
    cnpj: sp.cnpj,
    parocoNome: sp.paroco_nome,
    emailLoginSecretaria: sp.email_login_secretaria,
    senha: sp.senha,
    status: sp.status,
    createdAt: sp.created_at,
    updatedAt: sp.updated_at,
  };
}

export async function mapAppParoquiaToSupabase(p: any): Promise<Partial<SupabaseParoquia>> {
  return {
    codigo_paroquia: p.codigoParoquia,
    logo_url: p.logoUrl,
    nome: p.nome,
    email: p.email,
    telefone: p.telefone,
    endereco: p.endereco,
    fundacao: p.fundacao,
    cnpj: p.cnpj,
    paroco_nome: p.parocoNome,
    email_login_secretaria: p.emailLoginSecretaria,
    senha: p.senha,
    status: p.status,
  };
}

export async function mapSupabaseCEBToApp(sc: SupabaseCEB) {
  return {
    id: sc.id,
    paroquiaId: sc.paroquia_id,
    codigoCeb: sc.codigo_ceb,
    logoUrl: sc.logo_url,
    nome: sc.nome,
    emailLogin: sc.email_login,
    senha: sc.senha,
    telefone: sc.telefone,
    status: sc.status,
    createdAt: sc.created_at,
    updatedAt: sc.updated_at,
  };
}

export async function mapAppCEBToSupabase(c: any): Promise<Partial<SupabaseCEB>> {
  return {
    codigo_ceb: c.codigoCeb,
    logo_url: c.logoUrl,
    nome: c.nome,
    email_login: c.emailLogin,
    senha: c.senha,
    telefone: c.telefone,
    status: c.status,
  };
}
