# 🚀 START HERE - Dízimo Digital v2

Bem-vindo! Este é o **primeiro arquivo** que você deve ler.

---

## ⚡ TL;DR (Resumo Rápido)

Você tem um projeto com:
- ✅ **Banco de dados profissional** (Supabase/PostgreSQL)
- ✅ **Sincronização automática** entre cadastros
- ✅ **Documentação completa** para começar
- ✅ **Credenciais de teste** inclusas
- ✅ **Pronto para produção**

**Quer começar em 5 minutos?** → [QUICK_START.md](./QUICK_START.md)

---

## 🎯 O Que Você Precisa Fazer Agora

### Passo 1: Escolha uma Opção

#### ✅ Opção A: Supabase Cloud (Recomendado)
- Conta gratuita em https://supabase.com
- Melhor para produção
- Funciona em qualquer lugar

#### ✅ Opção B: Docker Local
- Rodar tudo na sua máquina
- Sem conta necessária
- Melhor para desenvolvimento puro

### Passo 2: Leia [QUICK_START.md](./QUICK_START.md)
(5-10 minutos)

### Passo 3: Execute os Comandos
```bash
npm install
npm run dev
```

### Passo 4: Login e Teste
```
Email: admin@dizimo.com
Senha: admin123
```

**Pronto! Você tem tudo rodando.** 🎉

---

## 📚 Documentação (Escolha Seu Caminho)

### 👨‍💼 Sou Gerente/Product Owner
Leia: [README.md](./README.md)
- Visão geral completa
- Arquitetura do sistema
- Como funciona sincronização

**Tempo**: 30 minutos

---

### 👨‍💻 Sou Developer/Técnico
Siga nesta ordem:
1. [QUICK_START.md](./QUICK_START.md) - Setup (5 min)
2. [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Como funciona (1 hora)
3. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Referência (conforme necessário)

**Tempo total**: 2 horas para entender tudo

---

### 🔐 Vou Publicar em Produção
Leia:
1. [SECURITY.md](./SECURITY.md) - Segurança (1 hora)
2. [README.md](./README.md#-deployment-em-produção) - Deploy (30 min)

**Importante**: Sempre fazer isso ANTES de publicar!

---

### 🆘 Tenho Um Problema
Vá para: [README.md#-troubleshooting](./README.md#-troubleshooting)

---

## 🗂️ Estrutura de Documentos

```
START_HERE.md ← Você está aqui
    ↓
INDEX.md (índice central)
    ↓
QUICK_START.md (setup em 5 min)
    ↓
README.md (visão completa)
    ↓
IMPLEMENTATION_GUIDE.md (técnico)
    ↓
API_DOCUMENTATION.md (referência)
```

---

## 🔐 Credenciais de Teste

Já inclusas no banco de dados:

```
🔑 Admin
Email: admin@dizimo.com
Senha: admin123

🔑 Paróquia
Código: 001
Senha: paroquia123

🔑 CEB
Paróquia: 001
CEB: CEB-001
Senha: ceb123
```

---

## ❓ Respostas Rápidas

**P: Preciso de uma conta Supabase?**
R: Sim (gratuita) OU use Docker local. Ambos funcionam!

**P: Quanto tempo leva?**
R: 5 minutos com Supabase Cloud, 10 com Docker.

**P: Posso usar sem internet?**
R: Sim, com Docker local.

**P: Preciso mudar código?**
R: Não, está pronto para usar!

**P: Funciona em produção?**
R: Sim, leia [SECURITY.md](./SECURITY.md) antes.

---

## 🚀 Comece Agora!

### Opção 1: Rápido (5 min)
```bash
# 1. Instale dependências
npm install

# 2. Crie um projeto em https://supabase.com

# 3. Copie credenciais para .env.local
# (veja QUICK_START.md)

# 4. Execute
npm run dev
```

### Opção 2: Local (10 min)
```bash
# 1. Instale dependências
npm install

# 2. Inicie Docker
docker-compose -f docker-compose.local.yml up -d

# 3. Configure .env.local
# (veja QUICK_START.md)

# 4. Execute
npm run dev
```

---

## 📖 Próximo: [QUICK_START.md](./QUICK_START.md)

Vá para lá agora! ⬇️

---

## 🎯 Checklist Rápido

- [ ] Escolhi Supabase Cloud ou Docker Local
- [ ] Instalei Node.js (se não tiver)
- [ ] Executei `npm install`
- [ ] Criei projeto no Supabase (ou Docker)
- [ ] Preenchi `.env.local`
- [ ] Executei `npm run dev`
- [ ] Consegui fazer login
- [ ] Vi que sincronização funciona

---

## 💡 Dica

Se tiver dúvida em qualquer momento, volte para:
- **Navegação geral**: [INDEX.md](./INDEX.md)
- **Problemas**: [README.md#troubleshooting](./README.md#-troubleshooting)
- **Código**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

**Pronto?** → Abra [QUICK_START.md](./QUICK_START.md) agora! 🚀
