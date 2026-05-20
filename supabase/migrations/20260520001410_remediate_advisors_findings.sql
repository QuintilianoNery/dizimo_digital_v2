-- Migration: remediate advisors findings
-- Purpose: remove permissive legacy CEB policies and harden function search_path.

DO $$
BEGIN
	IF to_regclass('public.cebs') IS NOT NULL THEN
		DROP POLICY IF EXISTS cebs_select_public ON public.cebs;
		DROP POLICY IF EXISTS cebs_insert_public ON public.cebs;
		DROP POLICY IF EXISTS cebs_update_public ON public.cebs;
		DROP POLICY IF EXISTS cebs_delete_public ON public.cebs;
	END IF;
END $$;

DO $$
BEGIN
	IF to_regprocedure('public.update_updated_at_column()') IS NOT NULL THEN
		EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog';
	END IF;

	IF to_regprocedure('public.current_auth_email()') IS NOT NULL THEN
		EXECUTE 'ALTER FUNCTION public.current_auth_email() SET search_path = public, pg_catalog';
	END IF;

	IF to_regprocedure('public.normalize_paroquia_login_email()') IS NOT NULL THEN
		EXECUTE 'ALTER FUNCTION public.normalize_paroquia_login_email() SET search_path = public, pg_catalog';
	END IF;

	IF to_regprocedure('public.normalize_ceb_login_email()') IS NOT NULL THEN
		EXECUTE 'ALTER FUNCTION public.normalize_ceb_login_email() SET search_path = public, pg_catalog';
	END IF;
END $$;
