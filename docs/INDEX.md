# 📑 Índice de Documentação - Dízimo Digital v2

**Bem-vindo!** Este é o ponto de partida para toda a documentação do projeto.

---

## 🚀 Comece Aqui

### Novo no Projeto?
👉 **[QUICK_START.md](./QUICK_START.md)** - Coloque tudo rodando em 5 minutos

### Quer Entender a Arquitetura?
👉 **[README.md](./README.md)** - Visão completa do projeto, banco de dados e setup

---

## 📚 Documentação Completa

### 1. **[QUICK_START.md](./QUICK_START.md)** - ⚡ Setup Rápido
- Instalar dependências
- Configurar Supabase
- Rodar localmente
- **Tempo**: 5 minutos

### 2. **[README.md](./README.md)** - 📖 Documentação Principal
- Stack de tecnologias
- Arquitetura do banco de dados
- Relacionamentos e chaves primárias
- Credenciais de teste
- Sincronização de dados
- Deployment em produção
- Troubleshooting
- **Tempo**: 30 minutos para ler

### 3. **[SETUP_SUPABASE.md](./SETUP_SUPABASE.md)** - ⚙️ Configuração Detalhada
- Setup em Supabase Cloud
- Setup local com Docker
- Importação do schema SQL
- Comandos Docker
- **Tempo**: 10 minutos (Cloud) ou 15 minutos (Docker)

### 4. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - 🔧 Guia Técnico
- Sincronização em tempo real explicada
- Arquitetura de dados
- Implementação passo-a-passo
- Padrões de uso
- Testes manuais
- **Tempo**: 1 hora para entender completamente

### 5. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - 📚 Referência de API
- Funções de `backend.ts`
- Tipos de dados
- Exemplos de uso
- Padrões recomendados
- **Tempo**: Consulta rápida conforme necessário

### 6. **[SECURITY.md](./SECURITY.md)** - 🔐 Segurança em Produção
- RLS (Row Level Security)
- Autenticação segura
- Policies de acesso
- Backup automático
- Monitoramento
- **Tempo**: 1 hora (importante antes de publicar)

---

## 📁 Arquivos do Projeto

```
dizimo_digital_v2/
├── 📘 Documentação
│   ├── README.md                    # Principal
│   ├── QUICK_START.md               # Setup rápido
│   ├── SETUP_SUPABASE.md            # Configuração
│   ├── IMPLEMENTATION_GUIDE.md       # Técnico
│   ├── API_DOCUMENTATION.md         # Referência
│   ├── SECURITY.md                  # Produção
│   └── INDEX.md                     # Este arquivo
│
├── 🗄️ Banco de Dados
│   └── supabase.sql                 # Schema completo
│
├── ⚙️ Configurações
│   ├── .env.local                   # Variáveis de ambiente
│   ├── .env.local.example           # Template
│   ├── vite.config.ts               # Build
│   ├── tsconfig.json                # TypeScript
│   └── docker-compose.local.yml     # Docker local
│
├── 💻 Frontend (React + Vite)
│   ├── src/
│   │   ├── App.tsx                  # Rotas
│   │   ├── main.tsx                 # Entry point
│   │   ├── index.css                # Estilos
│   │   ├── components/              # UI components
│   │   ├── contexts/                # Estado global
│   │   ├── pages/                   # Páginas
│   │   ├── types/                   # TypeScript types
│   │   └── utils/                   # Funções utilitárias
│   ├── package.json                 # Dependências
│   ├── tsconfig.json                # Config TS
│   └── index.html                   # HTML
│
└── 📦 Node Modules
    └── (instalados com `npm install`)
```

---

## 🎯 Fluxo de Desenvolvimento

### 1️⃣ Primeira Vez?
```
QUICK_START.md → npm install → Supabase setup → npm run dev
```

### 2️⃣ Entender a Arquitetura?
```
README.md → IMPLEMENTATION_GUIDE.md → Explorar código
```

### 3️⃣ Implementar Novos Dados?
```
API_DOCUMENTATION.md → Criar tipo em src/types → Usar backend.ts
```

### 4️⃣ Antes de Publicar?
```
SECURITY.md → Habilitar RLS → Configurar backups → Deploy
```

---

## 🔐 Credenciais de Teste

### Admin
```
Email: admin@dizimo.com
Senha: admin123
```

### Paróquia
```
Código/Nome: 001 ou "Nossa Senhora das Graças"
Senha: paroquia123
```

### CEBs
```
Paróquia: 001
CEB: CEB-001 ou "CEB São José"
Senha: ceb123
```

💡 **Todas as credenciais estão em [README.md](./README.md#-credenciais-de-teste)**

---

## ⚡ Comandos Úteis

```bash
# Setup
git clone https://github.com/QuintilianoNery/dizimo_digital_v2.git
cd dizimo_digital_v2
npm install

# Desenvolvimento
npm run dev          # Inicia Vite em http://localhost:5173

# Build
npm run build        # Gera arquivos otimizados em dist/
npm run preview      # Visualiza build antes de publicar

# Lint
npm run lint         # Verifica código

# Docker (local)
docker-compose -f docker-compose.local.yml up -d    # Inicia
docker-compose -f docker-compose.local.yml down      # Para
```

---

## 🚀 Deployment

### Cloud (Recomendado)

**Vercel**:
```bash
npm i -g vercel
vercel --prod
```

**Netlify**: Conectar repositório + configurar variáveis

### Local
```bash
npm run build
npm run preview
```

---

## 🐛 Problemas Comuns

| Problema | Solução |
|----------|---------|
| Supabase não conecta | [SETUP_SUPABASE.md](./SETUP_SUPABASE.md#troubleshooting) |
| Dados não sincronizam | [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md#-teste-manual) |
| Port 5173 em uso | `npm run dev -- --port 5174` |
| Docker não funciona | Ver [SETUP_SUPABASE.md](./SETUP_SUPABASE.md#troubleshooting) |

---

## 📚 Stack de Tecnologias

| Camada | Tecnologia | Docs |
|--------|-----------|------|
| **Frontend** | React 18 + TypeScript + Vite | [react.dev](https://react.dev) |
| **Banco** | PostgreSQL (Supabase) | [supabase.com/docs](https://supabase.com/docs) |
| **API** | REST (Supabase) | [supabase.com/docs/guides/api](https://supabase.com/docs/guides/api) |
| **Build** | Vite | [vitejs.dev](https://vitejs.dev) |
| **Roteamento** | React Router v6 | [reactrouter.com](https://reactrouter.com) |
| **UI** | Lucide React Icons | [lucide.dev](https://lucide.dev) |

---

## 🎓 Conceitos-Chave

### Sincronização de Dados
Quando um nome é alterado, todos os registros relacionados refletem a mudança automaticamente via **chaves primárias e estrangeiras**.

📖 Leia: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md#-sincronização-em-tempo-real)

### Arquitetura de Backend
- **Supabase**: PostgreSQL + Auth + API REST
- **LocalStorage**: Fallback para desenvolvimento sem Supabase
- **Abstração**: `backend.ts` oferece interface única

📖 Leia: [README.md - Arquitetura](./README.md#-arquitetura-do-banco-de-dados)

### Segurança
- RLS (Row Level Security) para produção
- Hash de senhas com bcryptjs
- Policies de acesso por role

📖 Leia: [SECURITY.md](./SECURITY.md)

---

## 💡 Dicas

1. **Sempre use `backend.ts`** para acessar dados
   - Não acesse Supabase diretamente
   - Garante fallback para localStorage

2. **Teste sincronização localmente**
   - Mude um nome
   - Recarregue página
   - Veja se mudou em todos os lugares

3. **Leia a documentação na ordem**
   - Não pule etapas
   - Cada documento constrói sobre o anterior

4. **Backup regularmente**
   - Dados são importantes
   - Configure backups automáticos em produção

---

## 📞 Suporte

**Dúvida?** Veja:
1. Procure em `QUICK_START.md` ou `README.md`
2. Verifique `IMPLEMENTATION_GUIDE.md` para conceitos
3. Consulte `API_DOCUMENTATION.md` para referência de funções
4. Leia `SECURITY.md` para questões de produção

---

## 🎉 Pronto?

### Primeiro acesso?
👉 Abra **[QUICK_START.md](./QUICK_START.md)** agora!

### Já tem tudo instalado?
👉 Execute `npm run dev` e acesse **http://localhost:5173**

### Quer explorar o código?
👉 Leia **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** para entender como tudo funciona

---

## 📋 Checklist de Setup

- [ ] Node.js 16+ instalado
- [ ] Repositório clonado
- [ ] `npm install` executado
- [ ] Supabase configurado (Cloud ou Docker)
- [ ] `.env.local` preenchido
- [ ] `npm run dev` rodando
- [ ] Login funcionando
- [ ] Dados sincronizando

---

## 🔗 Links Rápidos

- 📖 [README.md](./README.md) - Documentação completa
- ⚡ [QUICK_START.md](./QUICK_START.md) - Setup em 5 minutos
- 🔧 [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Arquitetura técnica
- 📚 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Referência de funções
- 🔐 [SECURITY.md](./SECURITY.md) - Segurança em produção
- ⚙️ [SETUP_SUPABASE.md](./SETUP_SUPABASE.md) - Configuração Supabase

---

**Última atualização**: Maio 2024 | **Versão**: 2.0.0

---

## 🙏 Obrigado por usar Dízimo Digital!

Feedback? Issues? Contribuições?
→ [GitHub QuintilianoNery/dizimo_digital_v2](https://github.com/QuintilianoNery/dizimo_digital_v2)
