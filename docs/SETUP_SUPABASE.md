# ============================================================================
# GUIA DE SETUP DO SUPABASE LOCAL COM DOCKER
# ============================================================================

## Pré-requisitos
- Docker Desktop instalado e rodando
- Docker Compose (normalmente vem com Docker Desktop)

## Opção 1: Usar Supabase Cloud (Recomendado para Desenvolvimento)

### 1. Criar Projeto em Supabase Cloud

```bash
# 1. Acesse https://supabase.com
# 2. Faça login ou crie uma conta (gratuita)
# 3. Clique em "New Project"
# 4. Preencha os dados:
#    - Name: dizimo-digital-v2
#    - Database Password: [escolha uma senha]
#    - Region: Escolha a mais próxima
# 5. Aguarde a criação (2-3 minutos)
```

### 2. Obter Credenciais

```bash
# 1. Vá para Settings → API
# 2. Copie:
#    - Project URL (VITE_SUPABASE_URL)
#    - anon public key (VITE_SUPABASE_ANON_KEY)
# 3. Atualize .env.local
```

### 3. Executar Script SQL

```bash
# 1. Em Supabase, vá para SQL Editor
# 2. Clique em "+ New Query"
# 3. Copie o conteúdo de supabase.sql
# 4. Cole na query
# 5. Execute (Ctrl+Enter)
```

## Opção 2: Supabase Local com Docker

### 1. Instalar Docker

- Windows/Mac: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
- Linux: `sudo apt-get install docker-ce docker-compose`

### 2. Iniciar Banco Local

```bash
# Navegar até o diretório do projeto
cd dizimo_digital_v2

# Iniciar containers
docker-compose -f docker-compose.local.yml up -d

# Verificar se está rodando
docker ps

# Deve mostrar: supabase_postgres e supabase_rest
```

### 3. Verificar Conexão

```bash
# PostgreSQL
psql -h localhost -U postgres -d postgres

# Se conectar, está funcionando!
# Sair com: \q
```

### 4. Importar Schema

```bash
# O arquivo supabase.sql é importado automaticamente
# ao iniciar o container

# Para verificar, conecte ao PostgreSQL:
psql -h localhost -U postgres -d postgres

# Execute:
\dt
# Deve listar todas as tabelas criadas

# Sair:
\q
```

### 5. Configurar .env.local para Local

```env
# .env.local
VITE_SUPABASE_URL=http://localhost:3000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3000
VITE_APP_ENV=development
```

### 6. Parar os Containers

```bash
docker-compose -f docker-compose.local.yml down

# Se precisar limpar volumes também:
docker-compose -f docker-compose.local.yml down -v
```

## Comparação: Cloud vs Local

| Aspecto | Supabase Cloud | Docker Local |
|--------|---|---|
| Setup | 5 min | 10 min |
| Custo | Gratuito | Gratuito |
| Performance | Excelente | Depende do PC |
| Backup | Automático | Manual |
| Escalabilidade | Fácil | Difícil |
| URL | supabase.co | localhost |
| Recomendado | ✅ Produção | ✅ Desenvolvimento |

## Troubleshooting

### Docker não inicia

```bash
# 1. Verificar se Docker está rodando
docker --version

# 2. Iniciar Docker Desktop (Windows/Mac)

# 3. No Linux, iniciar daemon:
sudo systemctl start docker
```

### Porta 5432 já em uso

```bash
# Mudar porta no docker-compose.local.yml
# Alterar:
# ports:
#   - "5433:5432"  # Usar 5433 em vez de 5432

# Depois:
docker-compose -f docker-compose.local.yml up -d
```

### SQL não foi importado

```bash
# Deletar volume e recriar
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d

# Ou importar manualmente:
docker exec -i supabase_postgres psql -U postgres -d postgres < supabase.sql
```

### Conexão recusada

```bash
# Verificar se containers estão rodando
docker ps

# Se não estiverem:
docker-compose -f docker-compose.local.yml up -d

# Verificar logs:
docker logs supabase_postgres
docker logs supabase_rest
```

## Pronto!

Agora você tem Supabase rodando localmente. Inicie o frontend:

```bash
npm run dev
```

E acesse: http://localhost:5173

Faga login com as credenciais de teste fornecidas no README.md
