# ⚡ Quick Start - Dízimo Digital v2

Coloque o projeto rodando em **5 minutos** 🚀

---

## 🎯 Opção A: Com Supabase Cloud (Recomendado)

### 1️⃣ Clone e instale
```bash
git clone https://github.com/QuintilianoNery/dizimo_digital_v2.git
cd dizimo_digital_v2
npm install
```

### 2️⃣ Crie projeto no Supabase
- Vá para https://supabase.com
- Clique em "New Project"
- Preencha os dados e aguarde criar

### 3️⃣ Execute o SQL
- Vá para **SQL Editor** no Supabase
- Crie nova query
- Cole todo o conteúdo de `supabase.sql`
- Execute

### 4️⃣ Configure variáveis
- Copie: `Settings > API > Project URL` → `VITE_SUPABASE_URL`
- Copie: `Settings > API > anon public key` → `VITE_SUPABASE_ANON_KEY`
- Edite `.env.local`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5️⃣ Inicie
```bash
npm run dev
```

Acesse: **http://localhost:5173**

---

## 🎯 Opção B: Com Docker Local

### 1️⃣ Clone e instale
```bash
git clone https://github.com/QuintilianoNery/dizimo_digital_v2.git
cd dizimo_digital_v2
npm install
```

### 2️⃣ Inicie Docker
```bash
docker-compose -f docker-compose.local.yml up -d
```

### 3️⃣ Configure `.env.local`
```env
VITE_SUPABASE_URL=http://localhost:3000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjAwMDAwMDAsImV4cCI6MTk3MjYwMDAwMH0.SUPABASE_JWT_SECRET
```

### 4️⃣ Inicie
```bash
npm run dev
```

---

## 🔐 Credenciais de Teste

### Admin Dashboard
```
Email: admin@dizimo.com
Senha: admin123
URL: http://localhost:5173/admin/login
```

### Paróquia (Secretaria)
```
Código/Nome: 001 ou "Nossa Senhora das Graças"
Senha: paroquia123
URL: http://localhost:5173/login
```

### CEBs (Comunidades)
```
Paróquia: 001 ou "Nossa Senhora das Graças"
CEB: CEB-001 ou "CEB São José"
Senha: ceb123
```

---

## 📋 Próximos Passos

1. ✅ Explore o dashboard
2. ✅ Crie uma nova paróquia em Admin
3. ✅ Crie CEBs nessa paróquia
4. ✅ Mude um nome e veja sincronizar!
5. ✅ Leia [README.md](./README.md) para mais detalhes

---

## 🐛 Problemas?

| Problema | Solução |
|----------|---------|
| "Supabase not configured" | Verificar `.env.local` |
| Dados não sincronizam | Limpar `localStorage` e atualizar |
| Port 5173 em uso | `npm run dev -- --port 5174` |
| Docker não funciona | Verificar se Docker está rodando |
| SQL não foi importado | `docker exec -i supabase_postgres psql -U postgres -d postgres < supabase.sql` |

---

## 📚 Documentação Completa

Leia [README.md](./README.md) para:
- Arquitetura completa do banco
- Instruções detalhadas de deployment
- Troubleshooting avançado
- Recursos adicionais

---

**Pronto? Abra `http://localhost:5173` e bom desenvolvimento!** 🎉
