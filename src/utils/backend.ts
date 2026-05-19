import { supabase, mapSupabaseParoquiaToApp, mapSupabaseCEBToApp, testConnection } from './supabase';
import { storageGet, storageSet, KEYS } from './storage';
import type { Administrador, Paroquia, CEB } from '../types';

let USE_SUPABASE = false;
// Permite forçar o backend via variáveis de ambiente Vite:
const FORCE_SUPABASE = import.meta.env.VITE_FORCE_SUPABASE === 'true';
const FORCE_LOCALSTORAGE = import.meta.env.VITE_FORCE_LOCALSTORAGE === 'true';

// Detecta se Supabase está configurado
export async function initializeBackend(): Promise<boolean> {
  // Se o modo forçado estiver definido, respeitar sem checar conexão
  if (FORCE_LOCALSTORAGE) {
    USE_SUPABASE = false;
    console.warn('Backend forçado: LocalStorage (VITE_FORCE_LOCALSTORAGE=true)');
    return false;
  }

  if (FORCE_SUPABASE) {
    USE_SUPABASE = true;
    console.warn('Backend forçado: Supabase (VITE_FORCE_SUPABASE=true)');
    return true;
  }

  try {
    const connected = await testConnection();
    USE_SUPABASE = connected;
    return connected;
  } catch {
    USE_SUPABASE = false;
    return false;
  }
}

// ============================================================================
// ADMINISTRADORES
// ============================================================================

export async function getAdministradores(): Promise<Administrador[]> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase
      .from('administradores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao buscar admins do Supabase:', error);
      return storageGet<Administrador>(KEYS.ADMIN);
    }
    return (data || []).map((a: any) => ({
      id: a.id,
      nome: a.nome,
      email: a.email,
      senha: a.senha,
      logoUrl: a.logo_url,
      status: a.status,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    })) as Administrador[];
  }
  return storageGet<Administrador>(KEYS.ADMIN);
}

export async function getAdministrador(id: string): Promise<Administrador | null> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase
      .from('administradores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn('Erro ao buscar admin:', error);
      return null;
    }
    return {
      id: data.id,
      nome: data.nome,
      email: data.email,
      senha: data.senha,
      logoUrl: data.logo_url,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Administrador;
  }
  const admins = storageGet<Administrador>(KEYS.ADMIN);
  return admins.find((a) => a.id === id) || null;
}

export async function createAdministrador(admin: Omit<Administrador, 'createdAt' | 'updatedAt'>): Promise<Administrador | null> {
  if (USE_SUPABASE) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('administradores')
      .insert([{
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        senha: admin.senha,
        logo_url: (admin as any).logoUrl,
        status: admin.status,
        created_at: now,
        updated_at: now,
      }])
      .select()
      .single();

    if (error) {
      console.warn('Erro ao criar admin:', error);
      return null;
    }
    return {
      id: data.id,
      nome: data.nome,
      email: data.email,
      senha: data.senha,
      logoUrl: data.logo_url,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Administrador;
  }
  const newAdmin = { ...admin, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const admins = storageGet<Administrador>(KEYS.ADMIN);
  admins.push(newAdmin);
  storageSet(KEYS.ADMIN, admins);
  return newAdmin;
}

// ============================================================================
// PARÓQUIAS
// ============================================================================

export async function getParoquias(): Promise<Paroquia[]> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase
      .from('paroquias')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.warn('Erro ao buscar paróquias:', error);
      return storageGet<Paroquia>(KEYS.PAROQUIAS);
    }

    // Mapear de snake_case para camelCase
    return (data || []).map((p: any) => ({
      id: p.id,
      administradorCriouId: p.administrador_criou_id,
      codigoParoquia: p.codigo_paroquia,
      logoUrl: p.logo_url,
      nome: p.nome,
      email: p.email,
      telefone: p.telefone,
      endereco: p.endereco,
      fundacao: p.fundacao,
      cnpj: p.cnpj,
      parocoNome: p.paroco_nome,
      emailLoginSecretaria: p.email_login_secretaria,
      senha: p.senha,
      status: p.status,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })) as Paroquia[];
  }
  return storageGet<Paroquia>(KEYS.PAROQUIAS);
}

export async function getParoquia(id: string): Promise<Paroquia | null> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase
      .from('paroquias')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn('Erro ao buscar paróquia:', error);
      return null;
    }

    if (!data) return null;
    return {
      id: data.id,
      administradorCriouId: data.administrador_criou_id,
      codigoParoquia: data.codigo_paroquia,
      logoUrl: data.logo_url,
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      endereco: data.endereco,
      fundacao: data.fundacao,
      cnpj: data.cnpj,
      parocoNome: data.paroco_nome,
      emailLoginSecretaria: data.email_login_secretaria,
      senha: data.senha,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Paroquia;
  }
  const paroquias = storageGet<Paroquia>(KEYS.PAROQUIAS);
  return paroquias.find((p) => p.id === id) || null;
}

export async function updateParoquia(id: string, updates: Partial<Paroquia>): Promise<Paroquia | null> {
  if (USE_SUPABASE) {
    const updateData: any = {};
    if (updates.codigoParoquia) updateData.codigo_paroquia = updates.codigoParoquia;
    if (updates.logoUrl) updateData.logo_url = updates.logoUrl;
    if (updates.nome) updateData.nome = updates.nome;
    if (updates.email) updateData.email = updates.email;
    if (updates.telefone) updateData.telefone = updates.telefone;
    if (updates.endereco) updateData.endereco = updates.endereco;
    if (updates.fundacao) updateData.fundacao = updates.fundacao;
    if (updates.cnpj) updateData.cnpj = updates.cnpj;
    if (updates.parocoNome) updateData.paroco_nome = updates.parocoNome;
    if (updates.emailLoginSecretaria) updateData.email_login_secretaria = updates.emailLoginSecretaria;
    if (updates.senha) updateData.senha = updates.senha;
    if (updates.status) updateData.status = updates.status;

    const { data, error } = await supabase
      .from('paroquias')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Erro ao atualizar paróquia:', error);
      return null;
    }

    if (!data) return null;
    return {
      id: data.id,
      administradorCriouId: data.administrador_criou_id,
      codigoParoquia: data.codigo_paroquia,
      logoUrl: data.logo_url,
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      endereco: data.endereco,
      fundacao: data.fundacao,
      cnpj: data.cnpj,
      parocoNome: data.paroco_nome,
      emailLoginSecretaria: data.email_login_secretaria,
      senha: data.senha,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Paroquia;
  }

  const paroquias = storageGet<Paroquia>(KEYS.PAROQUIAS);
  const idx = paroquias.findIndex((p) => p.id === id);
  if (idx >= 0) {
    paroquias[idx] = { ...paroquias[idx], ...updates, updatedAt: new Date().toISOString() };
    storageSet(KEYS.PAROQUIAS, paroquias);
    return paroquias[idx];
  }
  return null;
}

// ============================================================================
// CEBs
// ============================================================================

export async function getCEBs(): Promise<CEB[]> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase
      .from('cebs')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.warn('Erro ao buscar CEBs:', error);
      return storageGet<CEB>(KEYS.CEBS);
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      paroquiaId: c.paroquia_id,
      codigoCeb: c.codigo_ceb,
      logoUrl: c.logo_url,
      nome: c.nome,
      emailLogin: c.email_login,
      senha: c.senha,
      telefone: c.telefone,
      status: c.status,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    })) as CEB[];
  }
  return storageGet<CEB>(KEYS.CEBS);
}

export async function getCEB(id: string): Promise<CEB | null> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase
      .from('cebs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn('Erro ao buscar CEB:', error);
      return null;
    }

    if (!data) return null;
    return {
      id: data.id,
      paroquiaId: data.paroquia_id,
      codigoCeb: data.codigo_ceb,
      logoUrl: data.logo_url,
      nome: data.nome,
      emailLogin: data.email_login,
      senha: data.senha,
      telefone: data.telefone,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as CEB;
  }

  const cebs = storageGet<CEB>(KEYS.CEBS);
  return cebs.find((c) => c.id === id) || null;
}

export async function updateCEB(id: string, updates: Partial<CEB>): Promise<CEB | null> {
  if (USE_SUPABASE) {
    const updateData: any = {};
    if (updates.codigoCeb) updateData.codigo_ceb = updates.codigoCeb;
    if (updates.logoUrl) updateData.logo_url = updates.logoUrl;
    if (updates.nome) updateData.nome = updates.nome;
    if (updates.emailLogin) updateData.email_login = updates.emailLogin;
    if (updates.senha) updateData.senha = updates.senha;
    if (updates.telefone) updateData.telefone = updates.telefone;
    if (updates.status) updateData.status = updates.status;

    const { data, error } = await supabase
      .from('cebs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Erro ao atualizar CEB:', error);
      return null;
    }

    if (!data) return null;
    return {
      id: data.id,
      paroquiaId: data.paroquia_id,
      codigoCeb: data.codigo_ceb,
      logoUrl: data.logo_url,
      nome: data.nome,
      emailLogin: data.email_login,
      senha: data.senha,
      telefone: data.telefone,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as CEB;
  }

  const cebs = storageGet<CEB>(KEYS.CEBS);
  const idx = cebs.findIndex((c) => c.id === id);
  if (idx >= 0) {
    cebs[idx] = { ...cebs[idx], ...updates, updatedAt: new Date().toISOString() };
    storageSet(KEYS.CEBS, cebs);
    return cebs[idx];
  }
  return null;
}

export function isUsingSupabase(): boolean {
  return USE_SUPABASE;
}

export function getBackendType(): string {
  return USE_SUPABASE ? 'Supabase' : 'LocalStorage';
}
