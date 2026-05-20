-- Migration: add RLS policies for public.cebs
-- Fixes 42501 errors when inserting/selecting CEB records through the public Supabase client.

DO $$
BEGIN
  IF to_regclass('public.cebs') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.cebs ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS cebs_select_public ON public.cebs;
  DROP POLICY IF EXISTS cebs_insert_public ON public.cebs;
  DROP POLICY IF EXISTS cebs_update_public ON public.cebs;
  DROP POLICY IF EXISTS cebs_delete_public ON public.cebs;

  CREATE POLICY cebs_select_public ON public.cebs
    FOR SELECT
    TO anon, authenticated
    USING (true);

  CREATE POLICY cebs_insert_public ON public.cebs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

  CREATE POLICY cebs_update_public ON public.cebs
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

  CREATE POLICY cebs_delete_public ON public.cebs
    FOR DELETE
    TO anon, authenticated
    USING (true);
END $$;
