# Dízimo Digital v2 — Guia de Configuração

## Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend/DB**: Supabase (PostgreSQL + Auth + RLS)
- **Deploy**: Vercel

---

## 🏗️ Estrutura do Projeto

```
src/
├── lib/
│   └── supabase.ts            # Cliente Supabase singleton
├── types/
│   ├── database.ts            # Tipos gerados do schema
│   └── app.ts                 # Tipos da aplicação (roles, user, etc.)
├── config/
│   ├── tsconfig.app.json      # Configuração TypeScript do app
│   └── tsconfig.node.json     # Configuração TypeScript do Vite
├── services/
│   ├── auth.service.ts        # Login/logout + detecção de role
│   ├── admin.service.ts       # CRUD Administradores e Paróquias
│   ├── ceb.service.ts         # CRUD CEBs
│   ├── dizimista.service.ts   # CRUD Dizimistas + aniversariantes
│   ├── doacao.service.ts      # CRUD Doações + relatórios
│   └── conselheiro.service.ts # CRUD Conselheiros e Pastorais
├── contexts/
│   ├── AuthContext.tsx         # Sessão Supabase Auth global
│   └── DataContext.tsx         # Dados globais (pastorais, etc.)
├── components/
│   ├── ui/index.tsx           # Button, Input, Modal, Badge, Toast…
│   └── layout/AppShell.tsx    # Sidebar + layout autenticado
└── pages/
    ├── auth/LoginPage.tsx
    ├── admin/                 # Dashboard, Paróquias, Configurações
    ├── paroquial/             # Dashboard, CEBs, Pastorais, Relatórios…
    └── cebs/                  # Dashboard, Doações, Dizimistas, Conselheiros…
migrations/
└── 001_remove_senha_columns_use_supabase_auth.sql
database/
├── supabase.sql               # Schema completo + seed
└── supabase_grants_audit_fix.sql
```

---

## 🚀 Setup Passo a Passo

### 1. Banco de Dados Supabase

1. Acesse [supabase.com](https://supabase.com) → seu projeto
2. Vá em **SQL Editor** → New Query
3. Cole o conteúdo de `database/supabase.sql` e execute
4. Se o projeto já existe com a v1, execute apenas o `migrations/001_remove_senha_columns_use_supabase_auth.sql`
5. Se precisar auditar/grant de leitura, rode `database/supabase_grants_audit_fix.sql`

### 2. Obter a Anon Key (JWT)

> ⚠️ A `VITE_SUPABASE_ANON_KEY` deve ser a **JWT anon key** (começa com `eyJ...`), **não** a publishable key (`sb_publishable_...`).

1. Dashboard Supabase → **Settings** → **API**
2. Copie **Project API keys → anon public** (começa com `eyJhbGci...`)

### 3. Variáveis de Ambiente

Crie `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://moktjnacdztfjvezijnk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← JWT aqui!
VITE_APP_ENV=development
```

### 4. Criar Usuários no Supabase Auth

Para cada e-mail que já existe nas tabelas, crie o usuário no Auth:

**Dashboard → Authentication → Users → Add user**

| E-mail | Role | Senha sugerida para teste |
|--------|------|--------------------------|
| `admin@dizimo.com` | admin | `Admin@123` |
| `secretaria@nsgraças.com.br` | paroquial | `Paroquia@123` |
| `secretaria@saofelipe.com.br` | paroquial | `Paroquia@123` |
| `teste@teste.com` | paroquial | `Paroquia@123` |
| `saojose@ceb.com` | ceb | `Ceb@123` |
| `santamaria@ceb.com` | ceb | `Ceb@123` |
| `saofrancisco@ceb.com` | ceb | `Ceb@123` |
| `saofelipe1@ceb.com` | ceb | `Ceb@123` |
| `saofelipe2@ceb.com` | ceb | `Ceb@123` |

> Dica: Em **Authentication → Providers → Email**, desative "Confirm email" para testes locais.

### 5. Instalar e Rodar

```bash
npm install
npm run dev
```

Acesse: `http://localhost:5173`

- `/login` → Paróquias e CEBs
- `/admin/login` → Administrador

### 6. Deploy na Vercel

1. Conecte o repositório na Vercel
2. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático a cada push

---

## 🔐 Como funciona a Autenticação

1. O usuário faz login com e-mail + senha via **Supabase Auth**
2. O SDK armazena o token JWT automaticamente (localStorage gerenciado pelo Supabase)
3. A aplicação detecta o **role** consultando as tabelas: `administradores`, `paroquias`, `cebs`
4. O **Row Level Security (RLS)** garante que cada usuário só acessa seus próprios dados no banco
5. Nenhum dado de negócio é salvo manualmente no localStorage

### Fluxo de role detection

```
signInWithPassword(email, password)
        ↓
  session JWT criado no Supabase Auth
        ↓
  detectUserRole(email):
    → busca em administradores → role: 'admin'
    → busca em paroquias       → role: 'paroquial'
    → busca em cebs            → role: 'ceb'
        ↓
  Redireciona para o dashboard correspondente
```

---

## 🤔 Microfrontend / RSBuild — Vale a pena?

### Vantagens
- **Modularidade**: Admin, Paroquial e CEB como apps separados
- **Deploy independente**: cada módulo pode ser publicado separadamente
- **Times independentes**: equipes trabalham sem conflitos de merge
- **Bundle menor**: cada usuário carrega apenas o módulo que usa

### Complexidade
- Requer configuração de Module Federation (RSBuild + Rspack suporta nativamente)
- Compartilhamento de estado entre micro-apps exige uma solução adicional (Zustand, Jotai, custom events)
- CI/CD mais complexo (múltiplos pipelines)
- Para um projeto com 3 roles bem delimitados como este, o ganho não compensa o overhead agora

### Recomendação
**Mantenha o monorepo atual** com a estrutura modular por pastas (`/admin`, `/paroquial`, `/cebs`). A migração para microfrontend faz sentido quando:
- Houver times distintos por módulo
- O bundle ultrapassar ~500 KB (use `npm run build -- --report` para medir)
- Precisar de deploy independente por módulo

Se quiser avançar com RSBuild, a estrutura atual facilita a extração — cada pasta de `pages/` pode virar um micro-app separado.

---

## 📋 Problemas comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `Invalid login credentials` | Usuário não existe no Auth | Crie o usuário em Authentication → Users |
| `Failed to fetch` | Anon key errada (usando `sb_publishable_`) | Use a JWT `eyJ...` de Settings → API |
| `new row violates row-level security` | RLS bloqueando a inserção | Verifique se o e-mail do auth.users bate com o cadastro nas tabelas |
| `relation does not exist` | Schema não foi rodado | Execute o `database/supabase.sql` no SQL Editor |
| Usuário logado mas sem dados | E-mail com case diferente | O app já usa `.ilike()` e `.toLowerCase()` — verifique o e-mail no Auth |
---

## 📋 Features a serem implementadas
- [ ] Tela fica atualizando toda a vez que sai da tela e volta para a página, quando está com um modal de cadastro aberto o modal está sendo fechado pois a tela atualiza
- [ ] Não deve ser possível excluir uma paroquia que tem cebs vinculadas, deve apresentar uma mensagem de alerta informando que não é possível excluir a paroquia pois existem cebs vinculadas a ela
- [ ] Não deve ser possível excluir uma cebs que tem dizimistas vinculados, deve apresentar uma mensagem de alerta informando que não é possível excluir a cebs pois existem dizimistas vinculados a ela e lançamentos de doações vinculados a ela.
- [ ] Não deve ser possível excluir um dizimista que tem lançamentos de doações vinculados, deve apresentar uma mensagem de alerta informando que não é possível excluir o dizimista pois existem lançamentos de doações vinculados a ele.
- [ ] Alteração de senha em cada cadastro, administrador, paroquial e cebs
- [ ] Se quiser, eu posso fazer a próxima etapa e revisar/corrigir as policies do Supabase para deixar a proteção de verdade mais sólida.
- [ ] Notificação para as cebs quando alterar o valor do percentual de repasse de dizimo e de ofertas para a paroquia
- [ ] Dashboard da Cebs com total de Dizimo, total de Doações, total de ofertas, total de repasse para paroquia(Dizimo, oferta com o percentual que foi calculado aquele repasse), com base na configuração de percentual de repasse
- [ ] Dashboard da Paroquia com total de Dizimo, total de Doações, total de ofertas, total de repasse recebido das cebs
- [ ] Notificação na tela de Dashboard Cebs quando tiver um dizimista fazendo aniversário. Deve apresentar uma mensagem de alerta com a quantidade de aniversariantes do mes e um botão para ir para a tela de aniversariantes do mês
- [ ] Tela de aniversariantes do mês, apresentando os aniversariantes do mês em uma lista com nome, data de nascimento e telefone
- [ ] Relatório de doações, com filtros por data, valor, tipo (dizimo, oferta, outro), e exportação para CSV
- [ ] Inclusão de logomarca pela tela de configuração em cada cadastro administrador, paroquial e cebs
- [ ] Dashboard do Admin com total de Paroquias, total de Cebs, total de Dizimistas