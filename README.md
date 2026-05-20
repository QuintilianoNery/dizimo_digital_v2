# Dízimo Digital v2

Sistema web para gestão de paróquias, CEBs, dizimistas, pastorais e doações.

## Stack

- Frontend: React + TypeScript + Vite
- Banco e API: Supabase (PostgreSQL + REST)
- Ambiente local: Docker Compose

## Autenticação Supabase

O projeto usa Supabase Auth nativo. Não há mais sessão própria em `localStorage`.

O login funciona com email e senha vinculados ao Supabase Auth, e a sessão é encerrada automaticamente quando expira. O tempo de sessão alvo é de 1 hora.

Para o acesso funcionar com segurança, configure:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` ou `VITE_SUPABASE_PUBLISHABLE_KEY`

Se você usar um backend, Edge Function ou automação no servidor, o segredo `SUPABASE_SERVICE_ROLE_KEY` deve ficar somente fora do frontend.

### Passos de configuração

1. Crie o projeto no Supabase.
2. Ative o provedor Email/Password em Auth.
3. Ajuste a expiração do JWT/sessão para 60 minutos nas configurações de Auth.
4. Execute o SQL do esquema e das policies do banco.
5. Preencha o arquivo `.env.local` com as variáveis públicas do projeto.
6. Crie os usuários Auth correspondentes aos perfis administrativos, paroquiais e de CEB.
7. Se quiser usar o fluxo de primeiro acesso dentro do app, ajuste a confirmação de email conforme sua política de Auth.

### Exemplo de `.env.local`

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-ou-publishable
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-ou-publishable

# Nunca exponha este valor no frontend.
# SUPABASE_SERVICE_ROLE_KEY=seu-segredo-de-servidor
```

## Como iniciar

1. Instale as dependências: `npm install`
2. Configure o arquivo `.env.local`
3. Suba o banco local, se quiser usar Docker: `docker-compose -f docker-compose.local.yml up -d`
4. Inicie o front: `npm run dev`

## Comandos básicos do Supabase

- Iniciar ambiente local: `supabase start`
- Parar ambiente local: `supabase stop`
- Ver status do projeto: `supabase status`
- Abrir painel local: `supabase studio`
- Gerar tipagens: `supabase gen types typescript --local > src/types/supabase.ts`
- Executar migrações: `supabase db push`

## Documentação

A documentação completa está em `docs/`.

- Comece por `docs/START_HERE.md`
- Veja a visão geral em `docs/INDEX.md`
- Consulte a implementação em `docs/IMPLEMENTATION_GUIDE.md`
