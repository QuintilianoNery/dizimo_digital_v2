# 🔐 Guia de Segurança - Produção

Configurações de segurança e policies para ambiente de produção.

---

## 🚨 Checklist de Segurança

- [ ] RLS (Row Level Security) ativado em todas as tabelas
- [ ] Policies criadas para cada role (admin, paroquial, ceb)
- [ ] Backup automático configurado
- [ ] SSL/TLS habilitado
- [ ] Rate limiting ativado
- [ ] Senhas com hash (bcrypt)
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado corretamente
- [ ] Logging de auditoria ativado
- [ ] Testes de penetração realizados

---

## 🔑 RLS - Row Level Security

Row Level Security garante que usuários só vejam seus dados.

### Habilitar RLS

```sql
-- Descomente no supabase.sql para produção:
ALTER TABLE administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE paroquias ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_paroquias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cebs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastorais_movimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conselheiros_comunitarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE dizimistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE doacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_percentuais ENABLE ROW LEVEL SECURITY;
```

### Policies para Administradores

```sql
-- Admins veem TUDO
CREATE POLICY "Admin access all"
ON administradores
FOR SELECT
TO postgres
USING (true);

CREATE POLICY "Admin insert"
ON administradores
FOR INSERT
TO postgres
WITH CHECK (true);

CREATE POLICY "Admin update"
ON administradores
FOR UPDATE
TO postgres
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin delete"
ON administradores
FOR DELETE
TO postgres
USING (true);
```

### Policies para Paróquias

```sql
-- Usuários veem apenas sua paróquia
CREATE POLICY "Paroquial can view own parish"
ON paroquias
FOR SELECT
TO authenticated
USING (
  id::text = COALESCE(
    current_setting('app.paroquiaId', true),
    'null'
  )
  OR current_setting('app.role', true) = 'admin'
);

CREATE POLICY "Paroquial can update own parish"
ON paroquias
FOR UPDATE
TO authenticated
USING (
  id::text = COALESCE(
    current_setting('app.paroquiaId', true),
    'null'
  )
  OR current_setting('app.role', true) = 'admin'
)
WITH CHECK (
  id::text = COALESCE(
    current_setting('app.paroquiaId', true),
    'null'
  )
  OR current_setting('app.role', true) = 'admin'
);
```

### Policies para CEBs

```sql
-- CEBs veem apenas sua CEB
CREATE POLICY "CEB can view own community"
ON cebs
FOR SELECT
TO authenticated
USING (
  id::text = COALESCE(
    current_setting('app.cebId', true),
    'null'
  )
  OR paroquia_id::text = COALESCE(
    current_setting('app.paroquiaId', true),
    'null'
  )
  OR current_setting('app.role', true) = 'admin'
);

CREATE POLICY "CEB can view donations"
ON doacoes
FOR SELECT
TO authenticated
USING (
  ceb_id::text = COALESCE(
    current_setting('app.cebId', true),
    'null'
  )
  OR current_setting('app.role', true) IN ('admin', 'paroquial')
);
```

---

## 🔒 Autenticação Segura

### Hash de Senhas

Adicione `bcryptjs` ao projeto:

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

Criar helper para hash:

```typescript
// src/utils/password.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isStrongPassword(password: string): boolean {
  // Mínimo 8 caracteres, 1 maiúscula, 1 número
  return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}
```

Usar no AuthContext:

```typescript
import { comparePassword } from '../utils/password';

const loginAdmin = useCallback(async (email: string, senha: string) => {
  const admins = await getAdministradores();
  const admin = admins.find(a => a.email === email && a.status === 'ativo');
  
  if (!admin) return 'Email ou senha inválidos';
  
  const passwordMatch = await comparePassword(senha, admin.senha);
  if (!passwordMatch) return 'Email ou senha inválidos';
  
  // Login bem-sucedido
  setUser({ role: 'admin', adminId: admin.id, nome: admin.nome });
  return null;
}, []);
```

---

## 🛡️ Configurações do Supabase

### Settings > Authentication

**Email/Password**:
- ✅ Enable Email/Password
- ✅ Disable auto-confirm (verificar email)
- ✅ Confirm email: after 24 hours

**Rate Limiting**:
- ✅ Enable rate limiting
- ✅ Max requests: 10 por minuto

**MFA (Autenticação Multi-Fator)**:
- ✅ Habilitar TOTP (Time-based One-Time Password)
- Opcional, mas recomendado para admin

### Settings > API

**CORS**:
```
https://seu-dominio.com
https://www.seu-dominio.com
http://localhost:5173  # Apenas desenvolvimento
```

**JWT Expiry**:
- Não expira (sessão persistente)
- Ou 7 dias (logout automático)

### Settings > Backups

**Backup Automático**:
- ✅ Enable daily backups
- ✅ Retention: 30 dias
- ✅ Point-in-time: 7 dias

---

## 📊 Monitoramento & Logging

### Auditoria de Alterações

```sql
-- Criar tabela de auditoria
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela VARCHAR(100),
  operacao VARCHAR(50),
  usuario_id UUID,
  dados_antigos JSONB,
  dados_novos JSONB,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para log de doacoes (exemplo)
CREATE OR REPLACE FUNCTION audit_doacoes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (tabela, operacao, usuario_id, dados_antigos, dados_novos)
  VALUES (
    'doacoes',
    TG_OP,
    current_user_id(),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_doacoes
AFTER INSERT OR UPDATE OR DELETE ON doacoes
FOR EACH ROW
EXECUTE FUNCTION audit_doacoes();
```

### Verificar Logs

```sql
-- Ver últimas alterações
SELECT * FROM audit_log
ORDER BY criado_em DESC
LIMIT 100;

-- Por tabela
SELECT * FROM audit_log
WHERE tabela = 'paroquias'
ORDER BY criado_em DESC;

-- Por operação
SELECT * FROM audit_log
WHERE operacao = 'UPDATE'
AND criado_em > NOW() - INTERVAL '1 day';
```

---

## 🚀 Deployment Seguro

### Variáveis de Ambiente

**Em Produção**, use apenas:
- `VITE_SUPABASE_URL` (nunca exponha URL do banco)
- `VITE_SUPABASE_ANON_KEY` (apenas public key)
- Nunca use `SUPABASE_SERVICE_ROLE_KEY` no frontend

### Vercel

```bash
# Configurar secrets no Vercel
vercel secrets add vite_supabase_url https://seu-projeto.supabase.co
vercel secrets add vite_supabase_anon_key eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Deploy
vercel --prod
```

### Netlify

```bash
# Configurar no netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[build.environment]]
  VITE_SUPABASE_URL = "https://seu-projeto.supabase.co"
  VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

# Build
RUN npm run build

# Não expor variáveis em production
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "-m", "http-server", "dist"]
```

---

## 🔍 Testes de Segurança

### SQL Injection

```typescript
// ❌ NUNCA fazer:
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ SEMPRE usar parameterized queries:
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', email);  // Supabase sanitiza automaticamente
```

### XSS (Cross-Site Scripting)

```typescript
// ❌ NUNCA fazer:
<div>{userData}</div>  // Se userData tiver HTML

// ✅ SEMPRE usar sanitização:
import DOMPurify from 'dompurify';
<div>{DOMPurify.sanitize(userData)}</div>
```

### CSRF (Cross-Site Request Forgery)

Supabase cria tokens CSRF automaticamente. Sem ação necessária.

### Rate Limiting

```typescript
// No frontend, limitar requisições:
import { useCallback, useRef } from 'react';

export function useRateLimit(ms = 1000) {
  const lastCallRef = useRef(0);

  const call = useCallback(async (fn: () => Promise<any>) => {
    const now = Date.now();
    if (now - lastCallRef.current < ms) {
      throw new Error('Rate limited');
    }
    lastCallRef.current = now;
    return fn();
  }, [ms]);

  return call;
}
```

---

## 📝 Checklist Final

- [ ] RLS ativado em todas as tabelas
- [ ] Policies testadas (acesso correto)
- [ ] Senhas com bcrypt
- [ ] Rate limiting habilitado
- [ ] CORS configurado
- [ ] Backup automático
- [ ] Auditoria de logs
- [ ] SSL/TLS ativo (automático no Supabase)
- [ ] Testes de penetração
- [ ] Documentação de segurança
- [ ] Plano de resposta a incidentes
- [ ] Conformidade LGPD/GDPR

---

## 📚 Referências de Segurança

- [OWASP Top 10](https://owasp.org/www-project-top-ten)
- [Supabase Security](https://supabase.com/docs/guides/auth)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
- [bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)

---

**Implementar segurança desde o início = Menos problemas depois!** 🔐
