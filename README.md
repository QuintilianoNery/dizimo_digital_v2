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
supabase.sql                   # Schema completo + seed
```

---

## 🚀 Setup Passo a Passo

### 1. Banco de Dados Supabase

1. Acesse [supabase.com](https://supabase.com) → seu projeto
2. Vá em **SQL Editor** → New Query
3. Cole o conteúdo de `supabase.sql` e execute
4. Se o projeto já existe com a v1, execute apenas o `migrations/001_remove_senha_columns_use_supabase_auth.sql`

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
| `relation does not exist` | Schema não foi rodado | Execute o `supabase.sql` no SQL Editor |
| Usuário logado mas sem dados | E-mail com case diferente | O app já usa `.ilike()` e `.toLowerCase()` — verifique o e-mail no Auth |
