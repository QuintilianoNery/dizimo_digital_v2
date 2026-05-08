# Dízimo Digital v2 - Guia Completo

Uma aplicação web moderna para gestão de dízimos, ofertas e doações de paróquias e CEBs, com sincronização de dados em tempo real via Supabase.

## 📋 Índice

1. [Stack de Tecnologias](#stack-de-tecnologias)
2. [Arquitetura do Banco de Dados](#arquitetura-do-banco-de-dados)
3. [Setup Inicial](#setup-inicial)
4. [Configuração do Supabase](#configuração-do-supabase)
5. [Rodando Localmente](#rodando-localmente)
6. [Credenciais de Teste](#credenciais-de-teste)
7. [Sincronização de Dados](#sincronização-de-dados)
8. [Deployment em Produção](#deployment-em-produção)
9. [Troubleshooting](#troubleshooting)

---

## 🛠️ Stack de Tecnologias

### Frontend
- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Vite 5.3.1** - Build tool (desenvolvimento rápido)
- **React Router v6** - Routing
- **Lucide React** - Icons

### Backend & Banco de Dados
- **Supabase** - PostgreSQL + Auth + API REST
  - Autenticação integrada
  - Banco de dados relacional (PostgreSQL)
  - API REST automática
  - Realtime subscriptions (sincronização em tempo real)
  - RLS (Row Level Security) para segurança

### Fallback
- **LocalStorage** - Se Supabase não estiver configurado, usa dados locais (desenvolvimento)

---

## 🏗️ Arquitetura do Banco de Dados

### Diagrama de Relacionamentos

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  administradores (PK: id)                                       │
│  ├─ id (UUID)                                                   │
│  ├─ nome, email (UNIQUE), senha                                │
│  └─ status (ativo/inativo)                                     │
│         │                                                        │
│         │ (1:N)                                                  │
│         ↓                                                        │
│  paroquias (PK: id, FK: administrador_criou_id)                │
│  ├─ id (UUID)                                                   │
│  ├─ codigo_paroquia (UNIQUE)                                   │
│  ├─ nome, email, telefone, endereco                            │
│  ├─ cnpj, paroco_nome, fundacao                                │
│  ├─ senha (login secretaria)                                   │
│  └─ status (ativa/inativa)                                     │
│         │                                                        │
│         ├─────────────────────────┬────────────────────────┐   │
│         │ (1:1)                   │ (1:N)                  │   │
│         ↓                         ↓                        ↓   │
│  configuracoes_paroquias     cebs (PK: id,            alertas_ │
│  ├─ paroquia_id (UNIQUE)     FK: paroquia_id)         percentuais
│  ├─ percentuais (dizimo,     ├─ id (UUID)             ├─ paroquia_id
│  │  oferta, curia...)        ├─ codigo_ceb            ├─ ceb_id
│  ├─ vigente_desde/ate        ├─ nome                  ├─ mensagem
│  └─ ativa                     ├─ email_login, senha    └─ status
│                               ├─ telefone               
│                               └─ status (ativa/inativa)
│                                      │
│                                      ├──────────────┬─────────────┐
│                                      │ (1:N)        │ (1:N)       │
│                                      ↓              ↓             ↓
│                              conselheiros_     dizimistas    doacoes
│                              comunitarios      ├─ id (UUID)   ├─ id (UUID)
│                              ├─ id (UUID)      ├─ ceb_id      ├─ ceb_id
│                              ├─ ceb_id         ├─ nome        ├─ dizimista_id
│                              ├─ nome           ├─ telefone    ├─ valor
│                              ├─ cargo          ├─ email       ├─ tipo (dizimo/oferta/doacao)
│                              ├─ pastoral_      └─ status      ├─ forma_pagamento
│                              │  movimento_id                  ├─ competencia_mes/ano
│                              └─ status                        └─ data_lancamento
│                                    │
│                                    │ (N:1)
│                                    ↓
│                            pastorais_movimentos
│                            ├─ id (UUID)
│                            ├─ nome (UNIQUE)
│                            ├─ tipo (pastoral/movimento)
│                            └─ status (ativo/inativo)
│
└─────────────────────────────────────────────────────────────────┘
```

### Tabelas e Chaves Primárias

| Tabela | PK | Relacionamentos |
|--------|----|----|
| `administradores` | `id` (UUID) | - |
| `paroquias` | `id` (UUID) | FK: `administrador_criou_id` |
| `configuracoes_paroquias` | `id` (UUID) | FK: `paroquia_id` (1:1) |
| `cebs` | `id` (UUID) | FK: `paroquia_id` |
| `pastorais_movimentos` | `id` (UUID) | - |
| `conselheiros_comunitarios` | `id` (UUID) | FK: `ceb_id`, `pastoral_movimento_id` |
| `dizimistas` | `id` (UUID) | FK: `ceb_id` |
| `doacoes` | `id` (UUID) | FK: `ceb_id`, `dizimista_id` |
| `alertas_percentuais` | `id` (UUID) | FK: `paroquia_id`, `ceb_id`, `configuracao_paroquia_id` |

### Sincronização em Tempo Real

Quando um nome é atualizado:
- ✅ Mudança de nome da **Paróquia** → Reflete automaticamente em:
  - Botões de login de CEBs (referência `paroquia_id`)
  - Alertas de percentuais
  - Configurações da paróquia

- ✅ Mudança de nome da **CEB** → Reflete automaticamente em:
  - Doacoes, Dizimistas, Conselheiros (todos com `ceb_id`)
  - Dashboard da CEB

Isso é possível porque:
1. **Chaves estrangeiras mantêm integridade** - Não é possível ter orfãos
2. **UUIDs para referência** - IDs únicos em todas as operações
3. **Triggers de atualização** - `updated_at` é atualizado automaticamente
4. **Índices para performance** - Queries rápidas mesmo com muitos dados

---

## 🚀 Setup Inicial

### Pré-requisitos

- **Node.js** 16.0+ (recomendado: 18+)
- **npm** ou **yarn**
- **Git**
- **Conta Supabase** (gratuita em https://supabase.com)

### 1. Clonar o Repositório

```bash
git clone https://github.com/QuintilianoNery/dizimo_digital_v2.git
cd dizimo_digital_v2
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Copiar Variáveis de Ambiente

```bash
cp .env.local.example .env.local
```

---

## ⚙️ Configuração do Supabase

### Passo 1: Criar Projeto no Supabase

1. Acesse https://supabase.com
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha os dados:
   - **Name**: `dizimo-digital-v2`
   - **Database Password**: Salve uma senha segura
   - **Region**: Escolha a mais próxima do seu local
5. Aguarde a criação (2-3 minutos)

### Passo 2: Obter Credenciais

1. Vá para **Settings → API**
2. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

### Passo 3: Executar Script SQL

1. Em Supabase, vá para **SQL Editor**
2. Clique em "+ New Query"
3. Copie todo o conteúdo do arquivo `supabase.sql`
4. Cole na query
5. Clique em "Run" (Ctrl+Enter)

**Resultado esperado**: Tabelas criadas + dados de teste inseridos

### Passo 4: Configurar .env.local

Edite o arquivo `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3000
VITE_APP_ENV=development
```

**Nota**: Você pode encontrar essas valores em **Settings → API** do seu projeto Supabase.

---

## 🏃 Rodando Localmente

### Frontend (React + Vite)

```bash
# Terminal 1
npm run dev
```

- Acessa em: **http://localhost:5173**
- Auto-reload ao salvar arquivos
- Integração com Supabase automática

### Build para Produção

```bash
npm run build
```

Gera arquivos otimizados em `dist/`

### Lint & Type Check

```bash
npm run lint
```

---

## 🔐 Credenciais de Teste

### Admin

| Campo | Valor |
|-------|-------|
| **Email** | `admin@dizimo.com` |
| **Senha** | `admin123` |
| **URL de Acesso** | http://localhost:5173/admin/login |

### Paróquia (Nível Secretaria)

| Campo | Valor |
|-------|-------|
| **Código/Nome** | `001` ou `Nossa Senhora das Graças` |
| **Senha** | `paroquia123` |
| **URL de Acesso** | http://localhost:5173/login |

### CEBs (Nível Comunidade)

#### CEB 1: São José
| Campo | Valor |
|-------|-------|
| **Paróquia** | `001` ou `Nossa Senhora das Graças` |
| **Código/Nome CEB** | `CEB-001` ou `CEB São José` |
| **Senha** | `ceb123` |

#### CEB 2: Santa Maria
| Campo | Valor |
|-------|-------|
| **Paróquia** | `001` ou `Nossa Senhora das Graças` |
| **Código/Nome CEB** | `CEB-002` ou `CEB Santa Maria` |
| **Senha** | `ceb123` |

#### CEB 3: São Francisco
| Campo | Valor |
|-------|-------|
| **Paróquia** | `001` ou `Nossa Senhora das Graças` |
| **Código/Nome CEB** | `CEB-003` ou `CEB São Francisco` |
| **Senha** | `ceb123` |

### Dizimistas (Dados de Exemplo)

| Nome | CEB | CPF (fictício) |
|------|-----|---------|
| Pedro Costa | CEB São José | 123.456.789-00 |
| Ana Silva | CEB São José | 123.456.789-01 |
| Carlos Santos | CEB São José | 123.456.789-02 |

---

## 🔄 Sincronização de Dados

### Como Funciona

1. **Mudança Local**: Você edita dados (ex: nome da paróquia)
2. **Atualização no Supabase**: A mudança é salva no banco
3. **Sincronização Automática**: Todos os registros relacionados refletem a mudança

### Exemplo Prático: Mudando Nome da Paróquia

```
1. Admin edita: "Nossa Senhora das Graças" → "São José"
   ↓
2. UPDATE paroquias SET nome = 'São José' WHERE id = '...'
   ↓
3. Todos os CEBs ligados à paróquia usam o novo nome
   ↓
4. Na próxima tela de login de CEB, mostra: "Login para CEB de 'São José'"
   ↓
5. Se tentar login com paróquia antiga, retorna erro
```

### Como Verificar no Supabase

1. Vá para **Table Editor**
2. Abra a tabela `paroquias`
3. Edite o nome de uma paróquia
4. Vá para **Frontend → cebs**
5. Verá que os CEBs agora mostram a paróquia atualizada

---

## 📦 Estrutura do Projeto

```
dizimo_digital_v2/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppShell.tsx       # Shell principal
│   │   └── ui/
│   │       └── index.tsx           # Componentes UI reutilizáveis
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Autenticação
│   │   └── DataContext.tsx         # Estado global de dados
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx       # Telas de login
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx
│   │   │   └── ParoquiasPage.tsx   # Gestão de paróquias
│   │   ├── paroquial/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CEBsPage.tsx        # Gestão de CEBs
│   │   │   └── ...
│   │   └── cebs/
│   │       ├── Dashboard.tsx
│   │       ├── DoacoesPage.tsx     # Gestão de doações
│   │       └── ...
│   ├── types/
│   │   └── index.ts                # Tipos TypeScript
│   ├── utils/
│   │   ├── backend.ts              # Integração com Supabase
│   │   ├── supabase.ts             # Cliente Supabase
│   │   ├── storage.ts              # LocalStorage (fallback)
│   │   ├── seed.ts                 # Dados iniciais
│   │   └── calculations.ts         # Cálculos de dízimos/ofertas
│   ├── App.tsx                     # Rotas e setup
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Estilos globais
├── supabase.sql                    # Script SQL para criar schema
├── .env.local                      # Variáveis de ambiente
├── .env.local.example              # Template de .env.local
├── vite.config.ts                  # Configuração Vite
├── tsconfig.json                   # Configuração TypeScript
└── package.json                    # Dependências
```

---

## 🚢 Deployment em Produção

### Opção 1: Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod

# 3. Configurar variáveis de ambiente na dashboard Vercel
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

### Opção 2: Netlify

```bash
# 1. Conectar repositório no Netlify
# 2. Configurar build:
#    Build command: npm run build
#    Publish directory: dist

# 3. Adicionar variáveis de ambiente:
#    VITE_SUPABASE_URL
#    VITE_SUPABASE_ANON_KEY
```

### Opção 3: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV VITE_SUPABASE_URL=https://seu-projeto.supabase.co
ENV VITE_SUPABASE_ANON_KEY=sua-chave-anon
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

### Configurações Supabase para Produção

1. **Enable RLS (Row Level Security)**:
   ```sql
   ALTER TABLE administradores ENABLE ROW LEVEL SECURITY;
   ALTER TABLE paroquias ENABLE ROW LEVEL SECURITY;
   ALTER TABLE cebs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE doacoes ENABLE ROW LEVEL SECURITY;
   ```

2. **Criar Políticas de Segurança**:
   - Admin: acesso total
   - Paroquial: acesso apenas sua paróquia
   - CEB: acesso apenas sua CEB

3. **Backup Automático** em Supabase:
   - Vá para **Backups**
   - Configurar retention policy

---

## 🐛 Troubleshooting

### Problema: "Supabase not configured"

**Solução**:
```bash
# 1. Verificar .env.local
cat .env.local

# 2. Gerar novas credenciais em Supabase > Settings > API

# 3. Atualizar .env.local com credenciais corretas

# 4. Reiniciar servidor de desenvolvimento
npm run dev
```

### Problema: Dados não sincronizam

**Solução**:
```bash
# 1. Verificar conexão com Supabase
# Open Developer Tools (F12) → Console
# Procure por "Backend inicializado"

# 2. Se mostrar "LocalStorage", Supabase não está configurado
# Verificar .env.local

# 3. Limpar localStorage
localStorage.clear()

# 4. Atualizar página (F5)
```

### Problema: Erro 401 (Unauthorized)

**Solução**:
```bash
# 1. Supabase key expirada
# Gerar nova chave em Settings > API

# 2. Token corrompido
localStorage.clear()

# 3. Verificar CORS em Supabase > Settings > API
```

### Problema: Banco de dados vazio após executar SQL

**Solução**:
```sql
-- Verificar se tabelas foram criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Se retornar vazio, executar novamente supabase.sql
-- Verificar errors na execução
```

### Problema: Port 5173 já está em uso

**Solução**:
```bash
# 1. Usar porta diferente
npm run dev -- --port 5174

# 2. Ou matar processo que usa a porta
# No Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# No macOS/Linux:
lsof -i :5173
kill -9 <PID>
```

---

## 📚 Recursos Adicionais

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Guide](https://vitejs.dev/guide)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

---

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/sua-feature`
2. Commit suas mudanças: `git commit -am 'Add sua-feature'`
3. Push para a branch: `git push origin feature/sua-feature`
4. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👨‍💻 Autor

**Quintiliano Nery**
- GitHub: [@QuintilianoNery](https://github.com/QuintilianoNery)
- Email: contato@quintiliano.dev

---

## ✅ Checklist de Setup

- [ ] Node.js 16+ instalado
- [ ] Repositório clonado
- [ ] `npm install` executado
- [ ] Conta Supabase criada
- [ ] Script SQL executado no Supabase
- [ ] `.env.local` preenchido com credenciais
- [ ] `npm run dev` executando sem erros
- [ ] Conseguir fazer login com credenciais de teste
- [ ] Dados sincronizam entre frontend e banco

---

**Versão**: 2.0.0 | **Última atualização**: Maio 2024
