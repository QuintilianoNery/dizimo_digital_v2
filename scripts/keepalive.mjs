/**
 * Keep-alive do Supabase.
 *
 * Faz um cenário de INCLUSÃO e EXCLUSÃO numa tabela dedicada (`keepalive`),
 * gerando atividade de escrita no banco para evitar o pause automático da
 * conta free (que ocorre após ~7 dias de inatividade).
 *
 * Roda no GitHub Actions (ver .github/workflows/keepalive.yml) usando os
 * secrets SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
 *
 * Tabela esperada (criar uma vez no Supabase, ver scripts/keepalive.sql):
 *   create table public.keepalive (
 *     id uuid primary key default gen_random_uuid(),
 *     created_at timestamptz not null default now(),
 *     note text
 *   );
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('❌ Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no ambiente.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  const stamp = new Date().toISOString()

  // 1) INCLUSÃO
  const { data: inserted, error: insertError } = await supabase
    .from('keepalive')
    .insert({ note: `keepalive ${stamp}` })
    .select()
    .single()

  if (insertError) {
    console.error('❌ Falha na inclusão:', insertError.message)
    process.exit(1)
  }
  console.log(`✅ Inclusão OK — id ${inserted.id}`)

  // 2) EXCLUSÃO (do registro recém-criado)
  const { error: deleteError } = await supabase
    .from('keepalive')
    .delete()
    .eq('id', inserted.id)

  if (deleteError) {
    console.error('❌ Falha na exclusão:', deleteError.message)
    process.exit(1)
  }
  console.log(`✅ Exclusão OK — id ${inserted.id}`)

  console.log('🟢 Keep-alive concluído com sucesso.')
}

main().catch((err) => {
  console.error('❌ Erro inesperado:', err)
  process.exit(1)
})
