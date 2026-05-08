# 📑 Tópicos Principais - Navegação Rápida

Use este documento para **encontrar rapidamente** o que você procura.

---

## 🆕 NOVO NO PROJETO?

👉 **[START_HERE.md](./START_HERE.md)** - 5 minutos  
Comece aqui! Explica tudo em poucas linhas.

👉 **[QUICK_START.md](./QUICK_START.md)** - 5-10 minutos  
Setup completo passo-a-passo.

---

## 📖 ENTENDER O PROJETO

### Visão Geral
👉 **[README.md](./README.md)** - 30 minutos  
- Stack de tecnologias
- Arquitetura do banco
- Credenciais de teste
- Como funciona sincronização

### Índice e Navegação
👉 **[INDEX.md](./INDEX.md)** - 10 minutos  
- Índice central
- Links para tudo
- Fluxo recomendado

### Mudanças Implementadas
👉 **[CHANGELOG.md](./CHANGELOG.md)** - 10 minutos  
- O que mudou nesta versão
- Novos arquivos
- Arquitetura completa

👉 **[FILE_MANIFEST.md](./FILE_MANIFEST.md)** - 5 minutos  
- Lista de arquivos criados/modificados
- Para que serve cada um
- Onde encontrar

---

## ⚙️ SETUP & CONFIGURAÇÃO

### Setup Rápido
👉 **[QUICK_START.md](./QUICK_START.md)**  
- Opção A: Supabase Cloud (5 min)
- Opção B: Docker Local (10 min)

### Setup Detalhado
👉 **[SETUP_SUPABASE.md](./SETUP_SUPABASE.md)** - 10-15 minutos  
- Passo-a-passo Supabase Cloud
- Passo-a-passo Docker Local
- Comparação Cloud vs Local
- Troubleshooting

### Variáveis de Ambiente
**Arquivo**: `.env.local.example`  
Copie para `.env.local` e preencha com suas credenciais.

### Docker
**Arquivo**: `docker-compose.local.yml`  
```bash
docker-compose -f docker-compose.local.yml up -d
```

---

## 💻 BANCO DE DADOS

### Schema SQL
👉 **[supabase.sql](./supabase.sql)** (700+ linhas)
- 9 tabelas principais
- Relacionamentos
- Triggers
- Dados de teste
- **Como usar**: Copiar/colar no SQL Editor do Supabase

### Arquitetura
👉 **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md#-arquitetura-do-banco-de-dados)**  
- Diagrama de relacionamentos
- Explicação de sincronização
- Queries de exemplo

### Sincronização
👉 **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md#-sincronização-em-tempo-real)**  
- Como funciona sincronização
- Exemplos práticos
- Testes manuais

---

## 🔧 CÓDIGO & DESENVOLVIMENTO

### Funções Backend
👉 **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** (500+ linhas)
- `getParoquias()`
- `updateParoquia()`
- `getCEBs()`
- `updateCEB()`
- Todos com exemplos de uso

### Implementação Técnica
👉 **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** (400+ linhas)
- Padrões de uso
- Fluxo completo
- Exemplos práticos
- Query com sincronização

### Cliente Supabase
**Arquivo**: `src/utils/supabase.ts`  
- Inicialização
- Interfaces TypeScript
- Mapeadores de dados

### Backend Abstrato
**Arquivo**: `src/utils/backend.ts` ⭐ IMPORTANTE  
- Funções de CRUD
- Suporte Supabase + LocalStorage
- Use SEMPRE este arquivo!

---

## 🔐 SEGURANÇA & PRODUÇÃO

### Antes de Publicar
👉 **[SECURITY.md](./SECURITY.md)** (400+ linhas) ⭐ LEITURA OBRIGATÓRIA
- Checklist de segurança
- RLS (Row Level Security)
- Policies de acesso
- Hash de senhas
- Backup automático
- Monitoramento

### Deployment
👉 **[README.md#-deployment-em-produção](./README.md#-deployment-em-produção)**  
- Vercel
- Netlify
- Docker

---

## 🧪 TESTES & VALIDAÇÃO

### Credenciais de Teste
👉 **[README.md#-credenciais-de-teste](./README.md#-credenciais-de-teste)**

```
Admin: admin@dizimo.com / admin123
Paróquia: 001 / paroquia123
CEB: CEB-001 / ceb123
```

### Teste de Sincronização
👉 **[IMPLEMENTATION_GUIDE.md#-teste-manual](./IMPLEMENTATION_GUIDE.md#-teste-manual)**

**Teste 1**: Mude nome da paróquia, veja refletir em CEBs  
**Teste 2**: Login com nome novo funciona  
**Teste 3**: Dashboard mostra dados sincronizados

---

## 🆘 PROBLEMAS?

### Troubleshooting
👉 **[README.md#-troubleshooting](./README.md#-troubleshooting)** (10+ soluções)

### Problema: "Supabase not configured"
→ Verificar `.env.local`  
→ [SETUP_SUPABASE.md](./SETUP_SUPABASE.md)

### Problema: Dados não sincronizam
→ Limpar `localStorage`  
→ [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

### Problema: Port 5173 já em uso
→ `npm run dev -- --port 5174`

### Problema: Docker não funciona
→ [SETUP_SUPABASE.md#troubleshooting](./SETUP_SUPABASE.md#troubleshooting-docker-não-inicia)

---

## 📚 REFERÊNCIA RÁPIDA

### Comandos Úteis
```bash
npm install              # Instalar dependências
npm run dev              # Iniciar desenvolvimento
npm run build            # Build para produção
npm run preview          # Visualizar build
npm run lint             # Verificar código

docker-compose -f docker-compose.local.yml up -d    # Inicia Supabase local
docker-compose -f docker-compose.local.yml down     # Para Supabase local
```

### URLs
```
Frontend:  http://localhost:5173
Supabase:  https://seu-projeto.supabase.co
Docker:    http://localhost:3000 (API)
           localhost:5432 (Banco direto)
```

### Arquivos Importantes
```
supabase.sql                - Schema do banco
src/utils/backend.ts        - Funções CRUD (USE ESTE!)
src/utils/supabase.ts       - Cliente Supabase
src/App.tsx                 - Inicializa app
.env.local                  - Variáveis de ambiente
```

---

## 🎯 FLUXOS POR TIPO DE USUÁRIO

### Developer Frontend

1. [QUICK_START.md](./QUICK_START.md) - Setup (5 min)
2. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Como usar backend (30 min)
3. Começar a programar com `import { getParoquias } from './utils/backend'`

### Developer Backend/DevOps

1. [README.md](./README.md) - Arquitetura (30 min)
2. [SETUP_SUPABASE.md](./SETUP_SUPABASE.md) - Configuração (15 min)
3. [SECURITY.md](./SECURITY.md) - Segurança (1 hora)

### Product Manager

1. [README.md](./README.md) - Stack e arquitetura (30 min)
2. [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Sincronização (30 min)
3. Ver docs do [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) para roadmap

### Sys Admin / DevOps

1. [SETUP_SUPABASE.md](./SETUP_SUPABASE.md) - Infraestrutura (20 min)
2. [SECURITY.md](./SECURITY.md) - Segurança (1 hora)
3. [README.md#-deployment-em-produção](./README.md#-deployment-em-produção) - Deploy (30 min)

---

## 📋 CHECKLIST POR FASE

### Phase 1: Conhecimento
- [ ] Leu [START_HERE.md](./START_HERE.md)
- [ ] Leu [QUICK_START.md](./QUICK_START.md)
- [ ] Entendeu opções (Cloud vs Docker)

### Phase 2: Setup
- [ ] Criou projeto (Supabase ou Docker)
- [ ] Executou SQL
- [ ] Preencheu `.env.local`
- [ ] Rodou `npm install && npm run dev`

### Phase 3: Validação
- [ ] Conseguiu fazer login
- [ ] Testou sincronização (mude um nome)
- [ ] Explorou dados de teste
- [ ] Leu [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

### Phase 4: Desenvolvimento
- [ ] Criou novos dados se necessário
- [ ] Usou `backend.ts` para CRUD
- [ ] Implementou novos recursos
- [ ] Testou tudo localmente

### Phase 5: Produção
- [ ] Leu [SECURITY.md](./SECURITY.md)
- [ ] Habilitou RLS
- [ ] Configurou backups
- [ ] Publicou em Vercel/Netlify/etc

---

## 🎓 APRENDIZADO

### Conceito 1: Sincronização
Quando muda um campo, todos os relacionados veem a mudança automáticamente.

📖 Leia: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

### Conceito 2: Backend Agnóstico
Seu código não sabe se usa Supabase ou localStorage. Usa `backend.ts`.

📖 Leia: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Conceito 3: IDs como Chaves
Tudo referencia IDs (UUID). Garante integridade.

📖 Leia: [README.md#-arquitetura-do-banco-de-dados](./README.md#-arquitetura-do-banco-de-dados)

---

## 🚀 COMO COMEÇAR AGORA

1. **Abra**: [START_HERE.md](./START_HERE.md)
2. **Depois**: [QUICK_START.md](./QUICK_START.md)
3. **Execute**: `npm install && npm run dev`
4. **Teste**: Login com `admin@dizimo.com / admin123`
5. **Explore**: Mude um nome e veja sincronizar!

---

## 📞 SUPORTE

| Dúvida | Leia |
|--------|------|
| Começar | [START_HERE.md](./START_HERE.md) |
| Setup | [QUICK_START.md](./QUICK_START.md) |
| Problema | [README.md#troubleshooting](./README.md#-troubleshooting) |
| Código | [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) |
| Produção | [SECURITY.md](./SECURITY.md) |
| Tudo | [INDEX.md](./INDEX.md) |

---

**Próximo passo**: 👉 [START_HERE.md](./START_HERE.md)

---

**Última atualização**: Maio 2024 | **Versão**: 2.0.0
