// ============================================================================
// AUTH SERVICE
// Usa Supabase Auth (signInWithPassword) para autenticar.
// Após o login, detecta o papel (role) consultando as tabelas de perfil.
// NENHUM dado de sessão é salvo manualmente no localStorage –
// o SDK do Supabase gerencia o token JWT automaticamente.
// ============================================================================

import { supabase } from '@/lib/supabase';
import type { AppUser, UserRole } from '@/types';

/** Detecta o papel do usuário e retorna seu perfil completo */
async function detectUserRole(email: string): Promise<AppUser | null> {
  const emailLower = email.toLowerCase();

  // 1. Admin?
  const { data: admin } = await supabase
    .from('administradores')
    .select('id, nome, email')
    .ilike('email', emailLower)
    .eq('status', 'ativo')
    .maybeSingle();

  if (admin) {
    return { id: admin.id, email: admin.email, nome: admin.nome, role: 'admin' };
  }

  // 2. Secretaria parroquial?
  const { data: paroquia } = await supabase
    .from('paroquias')
    .select('id, nome, email, email_login_secretaria')
    .or(`email.ilike.${emailLower},email_login_secretaria.ilike.${emailLower}`)
    .eq('status', 'ativa')
    .maybeSingle();

  if (paroquia) {
    return {
      id: paroquia.id,
      email: emailLower,
      nome: paroquia.nome,
      role: 'paroquial',
      paroquiaId: paroquia.id,
    };
  }

  // 3. CEB?
  const { data: ceb } = await supabase
    .from('cebs')
    .select('id, nome, email_login, paroquia_id')
    .ilike('email_login', emailLower)
    .eq('status', 'ativa')
    .maybeSingle();

  if (ceb) {
    return {
      id: ceb.id,
      email: emailLower,
      nome: ceb.nome,
      role: 'ceb',
      cebId: ceb.id,
      paroquiaId: ceb.paroquia_id,
    };
  }

  return null;
}

// ============================================================================
// FUNÇÕES PÚBLICAS
// ============================================================================

export async function signIn(
  email: string,
  password: string
): Promise<{ user: AppUser; role: UserRole }> {
  // 1. Autentica com Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (error) {
    // Mensagens amigáveis em PT-BR
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('E-mail ou senha incorretos.');
    }
    if (error.message.includes('Email not confirmed')) {
      throw new Error('Confirme seu e-mail antes de continuar.');
    }
    throw new Error(error.message);
  }

  if (!data.user) throw new Error('Falha na autenticação.');

  // 2. Detecta papel
  const appUser = await detectUserRole(data.user.email!);
  if (!appUser) {
    await supabase.auth.signOut();
    throw new Error('Usuário sem perfil cadastrado. Contate o administrador.');
  }

  return { user: appUser, role: appUser.role };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email) return null;
  return detectUserRole(session.user.email);
}

export async function refreshSession(): Promise<void> {
  await supabase.auth.refreshSession();
}

/**
 * Cria um usuário no Supabase Auth para um email/senha existente na aplicação.
 * Use apenas para migração inicial ou ao criar novos usuários.
 */
export async function createAuthUser(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email: email.toLowerCase().trim(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });
  if (error) throw new Error(error.message);
}
