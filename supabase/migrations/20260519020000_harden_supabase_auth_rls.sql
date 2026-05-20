-- Migration: harden Supabase Auth and RLS
-- Purpose: use native Supabase Auth for access control and remove public table access.

-- Lock down schema and table grants to authenticated users only.
REVOKE ALL ON SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Helper used by RLS policies to read the email from the authenticated JWT.
CREATE OR REPLACE FUNCTION public.current_auth_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paroquias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_paroquias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cebs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastorais_movimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conselheiros_comunitarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dizimistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_percentuais ENABLE ROW LEVEL SECURITY;

-- Administradores: only the matched authenticated email can see or mutate its row.
DROP POLICY IF EXISTS administradores_select_auth ON public.administradores;
DROP POLICY IF EXISTS administradores_insert_auth ON public.administradores;
DROP POLICY IF EXISTS administradores_update_auth ON public.administradores;
DROP POLICY IF EXISTS administradores_delete_auth ON public.administradores;
CREATE POLICY administradores_select_auth ON public.administradores
  FOR SELECT TO authenticated
  USING (lower(email) = public.current_auth_email());
CREATE POLICY administradores_insert_auth ON public.administradores
  FOR INSERT TO authenticated
  WITH CHECK (lower(email) = public.current_auth_email());
CREATE POLICY administradores_update_auth ON public.administradores
  FOR UPDATE TO authenticated
  USING (lower(email) = public.current_auth_email())
  WITH CHECK (lower(email) = public.current_auth_email());
CREATE POLICY administradores_delete_auth ON public.administradores
  FOR DELETE TO authenticated
  USING (lower(email) = public.current_auth_email());

-- Paróquias: admin can manage all, and the paroquia login email can access its own row.
DROP POLICY IF EXISTS paroquias_select_auth ON public.paroquias;
DROP POLICY IF EXISTS paroquias_insert_auth ON public.paroquias;
DROP POLICY IF EXISTS paroquias_update_auth ON public.paroquias;
DROP POLICY IF EXISTS paroquias_delete_auth ON public.paroquias;
CREATE POLICY paroquias_select_auth ON public.paroquias
  FOR SELECT TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR lower(email) = public.current_auth_email()
    OR lower(coalesce(email_login_secretaria, '')) = public.current_auth_email()
  );
CREATE POLICY paroquias_insert_auth ON public.paroquias
  FOR INSERT TO authenticated
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR lower(email) = public.current_auth_email()
    OR lower(coalesce(email_login_secretaria, '')) = public.current_auth_email()
  );
CREATE POLICY paroquias_update_auth ON public.paroquias
  FOR UPDATE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR lower(email) = public.current_auth_email()
    OR lower(coalesce(email_login_secretaria, '')) = public.current_auth_email()
  )
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR lower(email) = public.current_auth_email()
    OR lower(coalesce(email_login_secretaria, '')) = public.current_auth_email()
  );
CREATE POLICY paroquias_delete_auth ON public.paroquias
  FOR DELETE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR lower(email) = public.current_auth_email()
    OR lower(coalesce(email_login_secretaria, '')) = public.current_auth_email()
  );

-- Configurações: admin and the owning paroquia email can read/write.
DROP POLICY IF EXISTS configuracoes_paroquias_select_auth ON public.configuracoes_paroquias;
DROP POLICY IF EXISTS configuracoes_paroquias_insert_auth ON public.configuracoes_paroquias;
DROP POLICY IF EXISTS configuracoes_paroquias_update_auth ON public.configuracoes_paroquias;
DROP POLICY IF EXISTS configuracoes_paroquias_delete_auth ON public.configuracoes_paroquias;
CREATE POLICY configuracoes_paroquias_select_auth ON public.configuracoes_paroquias
  FOR SELECT TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );
CREATE POLICY configuracoes_paroquias_insert_auth ON public.configuracoes_paroquias
  FOR INSERT TO authenticated
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );
CREATE POLICY configuracoes_paroquias_update_auth ON public.configuracoes_paroquias
  FOR UPDATE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  )
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );
CREATE POLICY configuracoes_paroquias_delete_auth ON public.configuracoes_paroquias
  FOR DELETE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );

-- CEBs: admin, owning paroquia, or the CEB's own login email can access.
DROP POLICY IF EXISTS cebs_select_auth ON public.cebs;
DROP POLICY IF EXISTS cebs_insert_auth ON public.cebs;
DROP POLICY IF EXISTS cebs_update_auth ON public.cebs;
DROP POLICY IF EXISTS cebs_delete_auth ON public.cebs;
CREATE POLICY cebs_select_auth ON public.cebs
  FOR SELECT TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR lower(coalesce(email_login, '')) = public.current_auth_email()
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );
CREATE POLICY cebs_insert_auth ON public.cebs
  FOR INSERT TO authenticated
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );
CREATE POLICY cebs_update_auth ON public.cebs
  FOR UPDATE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR lower(coalesce(email_login, '')) = public.current_auth_email()
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  )
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR lower(coalesce(email_login, '')) = public.current_auth_email()
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );
CREATE POLICY cebs_delete_auth ON public.cebs
  FOR DELETE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR lower(coalesce(email_login, '')) = public.current_auth_email()
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );

-- Pastorais, conselheiros, dizimistas, doações e alertas inherit access through admin or ownership.
DROP POLICY IF EXISTS pastorais_movimentos_select_auth ON public.pastorais_movimentos;
DROP POLICY IF EXISTS pastorais_movimentos_insert_auth ON public.pastorais_movimentos;
DROP POLICY IF EXISTS pastorais_movimentos_update_auth ON public.pastorais_movimentos;
DROP POLICY IF EXISTS pastorais_movimentos_delete_auth ON public.pastorais_movimentos;
CREATE POLICY pastorais_movimentos_select_auth ON public.pastorais_movimentos
  FOR SELECT TO authenticated
  USING (exists (select 1 from public.administradores a where lower(a.email) = public.current_auth_email()));
CREATE POLICY pastorais_movimentos_insert_auth ON public.pastorais_movimentos
  FOR INSERT TO authenticated
  WITH CHECK (exists (select 1 from public.administradores a where lower(a.email) = public.current_auth_email()));
CREATE POLICY pastorais_movimentos_update_auth ON public.pastorais_movimentos
  FOR UPDATE TO authenticated
  USING (exists (select 1 from public.administradores a where lower(a.email) = public.current_auth_email()))
  WITH CHECK (exists (select 1 from public.administradores a where lower(a.email) = public.current_auth_email()));
CREATE POLICY pastorais_movimentos_delete_auth ON public.pastorais_movimentos
  FOR DELETE TO authenticated
  USING (exists (select 1 from public.administradores a where lower(a.email) = public.current_auth_email()));

DROP POLICY IF EXISTS conselheiros_comunitarios_select_auth ON public.conselheiros_comunitarios;
DROP POLICY IF EXISTS conselheiros_comunitarios_insert_auth ON public.conselheiros_comunitarios;
DROP POLICY IF EXISTS conselheiros_comunitarios_update_auth ON public.conselheiros_comunitarios;
DROP POLICY IF EXISTS conselheiros_comunitarios_delete_auth ON public.conselheiros_comunitarios;
CREATE POLICY conselheiros_comunitarios_select_auth ON public.conselheiros_comunitarios
  FOR SELECT TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  );
CREATE POLICY conselheiros_comunitarios_insert_auth ON public.conselheiros_comunitarios
  FOR INSERT TO authenticated
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  );
CREATE POLICY conselheiros_comunitarios_update_auth ON public.conselheiros_comunitarios
  FOR UPDATE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  )
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  );
CREATE POLICY conselheiros_comunitarios_delete_auth ON public.conselheiros_comunitarios
  FOR DELETE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  );

DROP POLICY IF EXISTS dizimistas_select_auth ON public.dizimistas;
DROP POLICY IF EXISTS dizimistas_insert_auth ON public.dizimistas;
DROP POLICY IF EXISTS dizimistas_update_auth ON public.dizimistas;
DROP POLICY IF EXISTS dizimistas_delete_auth ON public.dizimistas;
CREATE POLICY dizimistas_select_auth ON public.dizimistas
  FOR SELECT TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  );
CREATE POLICY dizimistas_insert_auth ON public.dizimistas
  FOR INSERT TO authenticated
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  );
CREATE POLICY dizimistas_update_auth ON public.dizimistas
  FOR UPDATE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  )
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  );
CREATE POLICY dizimistas_delete_auth ON public.dizimistas
  FOR DELETE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  );

DROP POLICY IF EXISTS doacoes_select_auth ON public.doacoes;
DROP POLICY IF EXISTS doacoes_insert_auth ON public.doacoes;
DROP POLICY IF EXISTS doacoes_update_auth ON public.doacoes;
DROP POLICY IF EXISTS doacoes_delete_auth ON public.doacoes;
CREATE POLICY doacoes_select_auth ON public.doacoes
  FOR SELECT TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  );
CREATE POLICY doacoes_insert_auth ON public.doacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  );
CREATE POLICY doacoes_update_auth ON public.doacoes
  FOR UPDATE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  )
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  );
CREATE POLICY doacoes_delete_auth ON public.doacoes
  FOR DELETE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  );

DROP POLICY IF EXISTS alertas_percentuais_select_auth ON public.alertas_percentuais;
DROP POLICY IF EXISTS alertas_percentuais_update_auth ON public.alertas_percentuais;
CREATE POLICY alertas_percentuais_select_auth ON public.alertas_percentuais
  FOR SELECT TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  );
CREATE POLICY alertas_percentuais_update_auth ON public.alertas_percentuais
  FOR UPDATE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  )
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.cebs c
      where c.id = ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR exists (
            select 1
            from public.paroquias p
            where p.id = c.paroquia_id
              and (
                lower(p.email) = public.current_auth_email()
                OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
              )
          )
        )
    )
  );
