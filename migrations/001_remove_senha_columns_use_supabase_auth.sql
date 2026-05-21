-- ============================================================================
-- MIGRATION: 001_remove_senha_columns_use_supabase_auth.sql
-- ============================================================================
-- As colunas `senha` (hash manual) são removidas porque a autenticação
-- passou a ser gerenciada 100% pelo Supabase Auth (auth.users).
-- A identidade dos usuários é vinculada pelo e-mail registrado nas tabelas.
--
-- COMO RODAR:
--   Dashboard Supabase → SQL Editor → Cole este arquivo → Run
-- ============================================================================

BEGIN;

-- ── 1. Remove colunas senha que não fazem mais sentido ───────────────────────

ALTER TABLE public.administradores DROP COLUMN IF EXISTS senha;
ALTER TABLE public.paroquias       DROP COLUMN IF EXISTS senha;
ALTER TABLE public.cebs            DROP COLUMN IF EXISTS senha;

-- ── 2. Garante que a função helper de e-mail existe ───────────────────────────

CREATE OR REPLACE FUNCTION public.current_auth_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

-- ── 3. Garante grants para usuários autenticados ──────────────────────────────

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ── 4. Verifica se RLS está habilitado em todas as tabelas ────────────────────
-- (Execute manualmente se necessário):
-- ALTER TABLE public.administradores          ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.paroquias                ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.configuracoes_paroquias  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.cebs                     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pastorais_movimentos     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.conselheiros_comunitarios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.dizimistas               ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.doacoes                  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.alertas_percentuais      ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================================================
-- PRÓXIMO PASSO: Criar usuários no Supabase Auth
-- ============================================================================
-- Para cada e-mail que já existe nas tabelas (administradores, paroquias,
-- cebs), você deve criar o usuário correspondente no Supabase Auth.
--
-- Opção A (Dashboard): Authentication → Users → Invite user
--   Cole o e-mail e defina uma senha temporária. O usuário receberá um link.
--
-- Opção B (SQL — apenas se o email_confirm estiver desativado no projeto):
--   Acesse: Authentication → Providers → Email → Disable "Confirm email"
--   Depois use o serviço createAuthUser() que está em src/services/auth.service.ts
--   chamado durante a criação de paróquias/CEBs pelo painel admin.
--
-- E-mails que precisam de conta no Auth (dados de seed):
--   admin@dizimo.com          → role admin
--   secretaria@nsgraças.com.br → role paroquial
--   secretaria@saofelipe.com.br → role paroquial
--   saojose@ceb.com           → role ceb
--   santamaria@ceb.com        → role ceb
--   saofrancisco@ceb.com      → role ceb
--   saofelipe1@ceb.com        → role ceb
--   saofelipe2@ceb.com        → role ceb
-- ============================================================================
