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
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
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
-- MIGRATION: reforço de isolamento entre paróquias e CEBs
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin_email()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT exists (
    select 1
    from public.administradores a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_paroquia(p_paroquia_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.is_admin_email()
    OR exists (
      select 1
      from public.paroquias p
      where p.id = p_paroquia_id
        and (
          lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(p.email_login_secretaria, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
$$;

CREATE OR REPLACE FUNCTION public.can_access_ceb(p_ceb_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.is_admin_email()
    OR exists (
      select 1
      from public.cebs c
      where c.id = p_ceb_id
        and (
          lower(coalesce(c.email_login, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR public.can_access_paroquia(c.paroquia_id)
        )
    )
$$;

CREATE OR REPLACE FUNCTION public.can_access_alerta(p_paroquia_id uuid, p_ceb_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.is_admin_email()
    OR exists (
      select 1
      from public.cebs c
      join public.paroquias p on p.id = c.paroquia_id
      where c.id = p_ceb_id
        and p.id = p_paroquia_id
        and (
          lower(coalesce(c.email_login, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(p.email_login_secretaria, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
$$;

CREATE OR REPLACE FUNCTION public.validate_doacao_ceb_consistency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.dizimista_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.dizimistas d
    WHERE d.id = NEW.dizimista_id
      AND d.ceb_id = NEW.ceb_id
  ) THEN
    RAISE EXCEPTION 'dizimista_id precisa pertencer a mesma CEB do lançamento';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_alerta_paroquia_ceb_consistency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ceb_paroquia_id uuid;
BEGIN
  SELECT c.paroquia_id
    INTO ceb_paroquia_id
  FROM public.cebs c
  WHERE c.id = NEW.ceb_id;

  IF ceb_paroquia_id IS NULL OR ceb_paroquia_id <> NEW.paroquia_id THEN
    RAISE EXCEPTION 'paroquia_id precisa corresponder à paróquia da CEB';
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS dizimistas_select_auth ON public.dizimistas;
DROP POLICY IF EXISTS dizimistas_insert_auth ON public.dizimistas;
DROP POLICY IF EXISTS dizimistas_update_auth ON public.dizimistas;
DROP POLICY IF EXISTS dizimistas_delete_auth ON public.dizimistas;
CREATE POLICY dizimistas_select_auth ON public.dizimistas
  FOR SELECT TO authenticated USING (public.can_access_ceb(ceb_id));
CREATE POLICY dizimistas_insert_auth ON public.dizimistas
  FOR INSERT TO authenticated WITH CHECK (public.can_access_ceb(ceb_id));
CREATE POLICY dizimistas_update_auth ON public.dizimistas
  FOR UPDATE TO authenticated
  USING (public.can_access_ceb(ceb_id))
  WITH CHECK (public.can_access_ceb(ceb_id));
CREATE POLICY dizimistas_delete_auth ON public.dizimistas
  FOR DELETE TO authenticated USING (public.can_access_ceb(ceb_id));

DROP POLICY IF EXISTS doacoes_select_auth ON public.doacoes;
DROP POLICY IF EXISTS doacoes_insert_auth ON public.doacoes;
DROP POLICY IF EXISTS doacoes_update_auth ON public.doacoes;
DROP POLICY IF EXISTS doacoes_delete_auth ON public.doacoes;
CREATE POLICY doacoes_select_auth ON public.doacoes
  FOR SELECT TO authenticated USING (public.can_access_ceb(ceb_id));
CREATE POLICY doacoes_insert_auth ON public.doacoes
  FOR INSERT TO authenticated WITH CHECK (public.can_access_ceb(ceb_id));
CREATE POLICY doacoes_update_auth ON public.doacoes
  FOR UPDATE TO authenticated
  USING (public.can_access_ceb(ceb_id))
  WITH CHECK (public.can_access_ceb(ceb_id));
CREATE POLICY doacoes_delete_auth ON public.doacoes
  FOR DELETE TO authenticated USING (public.can_access_ceb(ceb_id));

DROP TRIGGER IF EXISTS trg_doacoes_validate_ceb_consistency ON public.doacoes;
CREATE TRIGGER trg_doacoes_validate_ceb_consistency
  BEFORE INSERT OR UPDATE ON public.doacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_doacao_ceb_consistency();

DROP POLICY IF EXISTS conselheiros_select_auth ON public.conselheiros_comunitarios;
DROP POLICY IF EXISTS conselheiros_insert_auth ON public.conselheiros_comunitarios;
DROP POLICY IF EXISTS conselheiros_update_auth ON public.conselheiros_comunitarios;
DROP POLICY IF EXISTS conselheiros_delete_auth ON public.conselheiros_comunitarios;
CREATE POLICY conselheiros_select_auth ON public.conselheiros_comunitarios
  FOR SELECT TO authenticated USING (public.can_access_ceb(ceb_id));
CREATE POLICY conselheiros_insert_auth ON public.conselheiros_comunitarios
  FOR INSERT TO authenticated WITH CHECK (public.can_access_ceb(ceb_id));
CREATE POLICY conselheiros_update_auth ON public.conselheiros_comunitarios
  FOR UPDATE TO authenticated
  USING (public.can_access_ceb(ceb_id))
  WITH CHECK (public.can_access_ceb(ceb_id));
CREATE POLICY conselheiros_delete_auth ON public.conselheiros_comunitarios
  FOR DELETE TO authenticated USING (public.can_access_ceb(ceb_id));

DROP POLICY IF EXISTS alertas_select_auth ON public.alertas_percentuais;
DROP POLICY IF EXISTS alertas_insert_auth ON public.alertas_percentuais;
DROP POLICY IF EXISTS alertas_update_auth ON public.alertas_percentuais;
DROP POLICY IF EXISTS alertas_delete_auth ON public.alertas_percentuais;
CREATE POLICY alertas_select_auth ON public.alertas_percentuais
  FOR SELECT TO authenticated USING (public.can_access_alerta(paroquia_id, ceb_id));
CREATE POLICY alertas_insert_auth ON public.alertas_percentuais
  FOR INSERT TO authenticated WITH CHECK (public.can_access_alerta(paroquia_id, ceb_id));
CREATE POLICY alertas_update_auth ON public.alertas_percentuais
  FOR UPDATE TO authenticated
  USING (public.can_access_alerta(paroquia_id, ceb_id))
  WITH CHECK (public.can_access_alerta(paroquia_id, ceb_id));
CREATE POLICY alertas_delete_auth ON public.alertas_percentuais
  FOR DELETE TO authenticated USING (public.can_access_alerta(paroquia_id, ceb_id));

DROP TRIGGER IF EXISTS trg_alertas_validate_paroquia_ceb_consistency ON public.alertas_percentuais;
CREATE TRIGGER trg_alertas_validate_paroquia_ceb_consistency
  BEFORE INSERT OR UPDATE ON public.alertas_percentuais
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_alerta_paroquia_ceb_consistency();

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
