-- ============================================================================
-- SUPABASE GRANTS + AUDIT
-- Corrige os privilegios de leitura do client publico e lista pendencias
-- ============================================================================

begin;

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- Garante que tabelas futuras nao quebrem por falta de SELECT
alter default privileges in schema public grant select on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;

commit;

-- ============================================================================
-- AUDITORIA FINAL
-- Mostra tabelas da schema public sem SELECT para anon e/ou authenticated
-- ============================================================================

with tables as (
  select
    table_schema,
    table_name
  from information_schema.tables
  where table_schema = 'public'
    and table_type = 'BASE TABLE'
),
select_grants as (
  select distinct
    table_schema,
    table_name,
    grantee
  from information_schema.role_table_grants
  where table_schema = 'public'
    and privilege_type = 'SELECT'
    and grantee in ('anon', 'authenticated')
)
select
  t.table_name,
  coalesce(bool_or(g.grantee = 'anon'), false) as select_anon,
  coalesce(bool_or(g.grantee = 'authenticated'), false) as select_authenticated,
  array_remove(array[
    case when not coalesce(bool_or(g.grantee = 'anon'), false) then 'anon' end,
    case when not coalesce(bool_or(g.grantee = 'authenticated'), false) then 'authenticated' end
  ], null) as missing_select_for
from tables t
left join select_grants g
  on g.table_schema = t.table_schema
 and g.table_name = t.table_name
group by t.table_name
having not (
  coalesce(bool_or(g.grantee = 'anon'), false)
  and coalesce(bool_or(g.grantee = 'authenticated'), false)
)
order by t.table_name;