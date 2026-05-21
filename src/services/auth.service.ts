// ============================================================================
// AUTH SERVICE
// Usa Supabase Auth (signInWithPassword) para autenticar.
// Após o login, detecta o papel (role) consultando as tabelas de perfil.
// NENHUM dado de sessão é salvo manualmente no localStorage –
// o SDK do Supabase gerencia o token JWT automaticamente.
// ============================================================================

import { supabase } from '@/lib/supabase';
import type { AppUser, UserRole } from '@/types';

function mapAuthErrorMessage(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Confirme seu e-mail antes de continuar.';
  }
  return message;
}

function isRlsOrPermissionError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('row-level security')
    || normalized.includes('permission denied')
    || normalized.includes('insufficient privilege')
  );
}

function throwIfQueryError(error: { message: string } | null, tableName: string): void {
  if (!error) return;

  console.error(`Erro ao consultar ${tableName}:`, error);

  if (isRlsOrPermissionError(error.message)) {
    throw new Error(
      `Acesso negado na tabela ${tableName}. Verifique as politicas RLS para usuarios autenticados.`
    );
  }

  throw new Error(error.message);
}

async function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/** Detecta o papel do usuário e retorna seu perfil completo */
async function detectUserRole(email: string): Promise<AppUser | null> {
  const emailLower = email.toLowerCase();

  // 1. Admin?
  const { data: admin, error: adminError } = await supabase
    .from('administradores')
    .select('id, nome, email')
    .ilike('email', emailLower)
    .eq('status', 'ativo')
    .maybeSingle();

  throwIfQueryError(adminError, 'administradores');

  const adminRow = admin as { id: string; nome: string; email: string } | null;

  if (adminRow) {
    return { id: adminRow.id, email: adminRow.email, nome: adminRow.nome, role: 'admin' };
  }

  // 2. Secretaria parroquial?
  const { data: paroquia, error: paroquiaError } = await supabase
    .from('paroquias')
    .select('id, nome, email, email_login_secretaria')
    .or(`email.ilike.${emailLower},email_login_secretaria.ilike.${emailLower}`)
    .eq('status', 'ativa')
    .maybeSingle();

  throwIfQueryError(paroquiaError, 'paroquias');

  const paroquiaRow = paroquia as { id: string; nome: string } | null;

  if (paroquiaRow) {
    return {
      id: paroquiaRow.id,
      email: emailLower,
      nome: paroquiaRow.nome,
      role: 'paroquial',
      paroquiaId: paroquiaRow.id,
    };
  }

  // 3. CEB?
  const { data: ceb, error: cebError } = await supabase
    .from('cebs')
    .select('id, nome, email_login, paroquia_id')
    .ilike('email_login', emailLower)
    .eq('status', 'ativa')
    .maybeSingle();

  throwIfQueryError(cebError, 'cebs');

  const cebRow = ceb as { id: string; nome: string; paroquia_id: string } | null;

  if (cebRow) {
    return {
      id: cebRow.id,
      email: emailLower,
      nome: cebRow.nome,
      role: 'ceb',
      cebId: cebRow.id,
      paroquiaId: cebRow.paroquia_id,
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
  console.log('1. Iniciando signIn com:', email);

  // 1. Autentica com Supabase Auth
  let data: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data'] | undefined;
  let error: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['error'] | undefined;

  try {
    const authResult = await withTimeout(
      supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      }),
      12000,
      'Tempo esgotado ao autenticar. Verifique conexao, configuracao do Supabase e politicas RLS.'
    );

    data = authResult.data;
    error = authResult.error;
    console.log('2. Resultado auth:', { data, error });
  } catch (authException) {
    console.error('2. Excecao no signInWithPassword:', authException);
    const message = authException instanceof Error
      ? authException.message
      : 'Erro inesperado ao conectar com o Supabase Auth.';
    throw new Error(mapAuthErrorMessage(message));
  }

  if (error) {
    throw new Error(mapAuthErrorMessage(error.message));
  }

  if (!data?.user) throw new Error('Falha na autenticação.');
  console.log('3. Chamando detectUserRole para:', data.user.email);

  // 2. Detecta papel
  const appUser = await withTimeout(
    detectUserRole(data.user.email!),
    12000,
    'Tempo esgotado ao carregar perfil do usuario. Verifique as politicas RLS das tabelas de perfil.'
  );
   console.log('4. appUser retornado:', appUser);
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
