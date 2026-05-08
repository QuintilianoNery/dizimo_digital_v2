# Dízimo Digital v2

Sistema web para gestão de paróquias, CEBs, dizimistas, pastorais e doações.

## Stack
- Frontend: React + TypeScript + Vite
- Banco e API: Supabase (PostgreSQL + REST)
- Ambiente local: Docker Compose

## Logins de teste
- Admin: `admin@dizimo.com` / `admin123`
- Paróquia: `001` / `paroquia123`
- CEB: `CEB-001` / `ceb123`

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
