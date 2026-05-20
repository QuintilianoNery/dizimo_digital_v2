-- Migration: tighten auth account data
-- Purpose: ensure every paroquia and CEB has a stable login email for Supabase Auth.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
	IF to_regclass('public.paroquias') IS NOT NULL THEN
		UPDATE public.paroquias
		SET email_login_secretaria = email
		WHERE email_login_secretaria IS NULL OR btrim(email_login_secretaria) = '';

		ALTER TABLE public.paroquias
			ALTER COLUMN email_login_secretaria SET NOT NULL;

		CREATE UNIQUE INDEX IF NOT EXISTS uq_paroquias_email_login_secretaria
			ON public.paroquias (lower(email_login_secretaria));

		CREATE OR REPLACE FUNCTION public.normalize_paroquia_login_email()
		RETURNS trigger
		LANGUAGE plpgsql
		AS $fn$
		BEGIN
			NEW.email_login_secretaria := coalesce(nullif(btrim(NEW.email_login_secretaria), ''), NEW.email);
			RETURN NEW;
		END;
		$fn$;

		DROP TRIGGER IF EXISTS trg_normalize_paroquia_login_email ON public.paroquias;
		CREATE TRIGGER trg_normalize_paroquia_login_email
		BEFORE INSERT OR UPDATE ON public.paroquias
		FOR EACH ROW
		EXECUTE FUNCTION public.normalize_paroquia_login_email();

		COMMENT ON COLUMN public.paroquias.email_login_secretaria IS 'Supabase Auth email for paroquia access';
	END IF;

	IF to_regclass('public.cebs') IS NOT NULL THEN
		UPDATE public.cebs
		SET email_login = lower(
			regexp_replace(
				coalesce(codigo_ceb, id::text),
				'[^a-zA-Z0-9]+',
				'.',
				'g'
			)
		) || '.' || replace(id::text, '-', '') || '@ceb.local'
		WHERE email_login IS NULL OR btrim(email_login) = '';

		ALTER TABLE public.cebs
			ALTER COLUMN email_login SET NOT NULL;

		CREATE UNIQUE INDEX IF NOT EXISTS uq_cebs_email_login
			ON public.cebs (lower(email_login));

		CREATE OR REPLACE FUNCTION public.normalize_ceb_login_email()
		RETURNS trigger
		LANGUAGE plpgsql
		AS $fn$
		DECLARE
			generated_email text;
		BEGIN
			generated_email := lower(
				regexp_replace(
					coalesce(NEW.codigo_ceb, NEW.id::text),
					'[^a-zA-Z0-9]+',
					'.',
					'g'
				)
			) || '.' || replace(NEW.id::text, '-', '') || '@ceb.local';

			NEW.email_login := coalesce(nullif(btrim(NEW.email_login), ''), generated_email);
			RETURN NEW;
		END;
		$fn$;

		DROP TRIGGER IF EXISTS trg_normalize_ceb_login_email ON public.cebs;
		CREATE TRIGGER trg_normalize_ceb_login_email
		BEFORE INSERT OR UPDATE ON public.cebs
		FOR EACH ROW
		EXECUTE FUNCTION public.normalize_ceb_login_email();

		COMMENT ON COLUMN public.cebs.email_login IS 'Supabase Auth email for CEB access';
	END IF;
END $$;
