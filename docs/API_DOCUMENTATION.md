# 📚 API Documentation - Backend Functions

Referência completa das funções backend para sincronização de dados.

---

## 📌 Visão Geral

As funções em `src/utils/backend.ts` oferecem uma abstração sobre o armazenamento de dados:
- **Supabase** (Production) - PostgreSQL + API REST
- **LocalStorage** (Development) - Dados locais no navegador

Todas as funções retornam os mesmos tipos, então você pode alternar entre backends sem mudança de código.

---

## 🔧 Funções Principais

### 1. Inicialização

#### `initializeBackend(): Promise<boolean>`

Inicializa o backend (Supabase ou LocalStorage).

```typescript
import { initializeBackend, getBackendType } from './utils/backend';

// Chamar no App.tsx
initializeBackend().then((connected) => {
  console.log(`Backend: ${getBackendType()}`);
  // Retorna: "Supabase" ou "LocalStorage"
});
```

**Retorna**: `true` se Supabase conectado, `false` caso contrário

---

### 2. Administradores

#### `getAdministradores(): Promise<Administrador[]>`

Busca todos os administradores.

```typescript
const admins = await getAdministradores();
admins.forEach(admin => {
  console.log(`${admin.nome} (${admin.email})`);
});
```

#### `getAdministrador(id: string): Promise<Administrador | null>`

Busca um administrador específico.

```typescript
const admin = await getAdministrador('uuid-admin');
if (admin) {
  console.log(`Admin: ${admin.nome}, Status: ${admin.status}`);
}
```

#### `createAdministrador(admin: Omit<Administrador, 'createdAt' | 'updatedAt'>): Promise<Administrador | null>`

Cria um novo administrador.

```typescript
const novoAdmin = await createAdministrador({
  id: 'uuid-gerado',
  nome: 'Novo Admin',
  email: 'novo@admin.com',
  senha: 'hash_da_senha',  // Use bcryptjs para hash!
  status: 'ativo'
});

if (novoAdmin) {
  console.log('Admin criado com sucesso');
}
```

---

### 3. Paróquias

#### `getParoquias(): Promise<Paroquia[]>`

Busca todas as paróquias.

```typescript
const paroquias = await getParoquias();
paroquias.forEach(p => {
  console.log(`${p.nome} (Código: ${p.codigoParoquia})`);
});
```

#### `getParoquia(id: string): Promise<Paroquia | null>`

Busca uma paróquia específica.

```typescript
const paroquia = await getParoquia('uuid-paroquia');
if (paroquia) {
  console.log(`Paróquia: ${paroquia.nome}`);
  console.log(`CEBs: ${paroquia.cebs?.length || 0}`);
}
```

#### `updateParoquia(id: string, updates: Partial<Paroquia>): Promise<Paroquia | null>`

Atualiza uma paróquia (e sincroniza com CEBs relacionadas).

```typescript
// ✅ Mudança de nome - sincroniza automaticamente!
const updated = await updateParoquia('uuid-paroquia', {
  nome: 'Nova Nome da Paróquia',
  email: 'novo-email@paroquia.com'
});

if (updated) {
  console.log(`Paróquia atualizada: ${updated.nome}`);
  // Todos os CEBs dessa paróquia verão o novo nome
}
```

**Exemplo Real: Sincronização em Ação**

```typescript
// 1. Admin muda nome da paróquia
await updateParoquia('paroquia-123', {
  nome: 'São José'
});

// 2. No login de CEB, buscar paróquia por nome funciona:
const paroquias = await getParoquias();
const paroquia = paroquias.find(p => p.nome === 'São José');
// ✅ Encontra! (sincronizou)

// 3. CEBs dessa paróquia usam o novo nome:
const cebs = await getCEBs();
const cebsDaParoquia = cebs.filter(c => c.paroquiaId === paroquia.id);
cebsDaParoquia.forEach(ceb => {
  console.log(`${ceb.nome} está em ${paroquia.nome}`);
  // Output: "CEB São José está em São José"
});
```

---

### 4. CEBs (Comunidades Eclesiais de Base)

#### `getCEBs(): Promise<CEB[]>`

Busca todas as CEBs.

```typescript
const cebs = await getCEBs();
cebs.forEach(ceb => {
  console.log(`${ceb.nome} (Código: ${ceb.codigoCeb})`);
});
```

#### `getCEB(id: string): Promise<CEB | null>`

Busca uma CEB específica.

```typescript
const ceb = await getCEB('uuid-ceb');
if (ceb) {
  console.log(`CEB: ${ceb.nome}`);
  console.log(`Paróquia ID: ${ceb.paroquiaId}`);
}
```

#### `updateCEB(id: string, updates: Partial<CEB>): Promise<CEB | null>`

Atualiza uma CEB.

```typescript
const updated = await updateCEB('uuid-ceb', {
  nome: 'CEB Nova Nome',
  telefone: '(27) 99999-9999'
});

if (updated) {
  console.log(`CEB atualizada: ${updated.nome}`);
  // Todos os dizimistas e doacoes dessa CEB refletem a mudança
}
```

---

## 🎯 Padrões de Uso

### Pattern 1: Buscar com Relacionamentos

```typescript
// Buscar paróquia e seus CEBs
const paroquias = await getParoquias();
const paroquia = paroquias.find(p => p.id === 'uuid');

const cebs = await getCEBs();
const cebsDaParoquia = cebs.filter(c => c.paroquiaId === paroquia.id);

console.log(`${paroquia.nome} tem ${cebsDaParoquia.length} CEBs`);
```

### Pattern 2: Buscar por Nome (Sincronizado)

```typescript
// Buscar paróquia por nome (sempre sincronizado)
const paroquias = await getParoquias();
const paroquia = paroquias.find(p =>
  p.nome.toLowerCase().includes(nomeBuscado.toLowerCase())
);

if (paroquia) {
  console.log(`Encontrou: ${paroquia.nome}`);
} else {
  console.log('Paróquia não encontrada');
}
```

### Pattern 3: Atualizar e Refletir em Todos

```typescript
// Quando muda nome da paróquia, todos os relacionados veem a mudança
async function renomearParoquia(id: string, novoNome: string) {
  // 1. Atualiza paróquia
  const paroquiaAtualizada = await updateParoquia(id, { nome: novoNome });

  // 2. Busca CEBs relacionadas
  const cebs = await getCEBs();
  const cebsDaParoquia = cebs.filter(c => c.paroquiaId === id);

  // 3. Interface mostra CEBs com paróquia atualizada
  return {
    paroquia: paroquiaAtualizada,
    cebs: cebsDaParoquia,
    // ✅ CEBs agora usam o novo nome da paróquia
  };
}
```

### Pattern 4: Login com Sincronização

```typescript
async function loginCEB(
  codigoOuNomeParoquia: string,
  codigoOuNomeCeb: string,
  senha: string
): Promise<string | null> {
  // 1. Busca paróquia (sincronizada)
  const paroquias = await getParoquias();
  const paroquia = paroquias.find(p =>
    p.codigoParoquia === codigoOuNomeParoquia ||
    p.nome.toLowerCase().includes(codigoOuNomeParoquia.toLowerCase())
  );

  if (!paroquia || paroquia.status !== 'ativa') {
    return 'Paróquia não encontrada';
  }

  // 2. Busca CEB dessa paróquia
  const cebs = await getCEBs();
  const ceb = cebs.find(c =>
    c.paroquiaId === paroquia.id &&
    (c.codigoCeb === codigoOuNomeCeb ||
     c.nome.toLowerCase().includes(codigoOuNomeCeb.toLowerCase())) &&
    c.senha === senha &&
    c.status === 'ativa'
  );

  if (!ceb) {
    return 'CEB não encontrada';
  }

  // 3. ✅ Login bem-sucedido com dados sincronizados
  setUser({
    role: 'ceb',
    paroquiaId: paroquia.id,
    cebId: ceb.id,
    nome: ceb.nome
  });

  return null;  // Sem erro
}
```

---

## 📊 Tipos de Dados

### Administrador

```typescript
interface Administrador {
  id: string;
  nome: string;
  email: string;
  senha: string;  // Hash bcrypt
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
}
```

### Paroquia

```typescript
interface Paroquia {
  id: string;
  administradorCriouId?: string;
  codigoParoquia: string;        // Único, usado em login
  logoUrl?: string;
  nome: string;                   // Sincroniza com CEBs
  email: string;
  telefone: string;
  endereco: string;
  fundacao: string;
  cnpj: string;
  parocoNome: string;
  emailLoginSecretaria: string;
  senha: string;                  // Hash bcrypt
  status: 'ativa' | 'inativa';    // Afeta CEBs
  createdAt: string;
  updatedAt: string;
}
```

### CEB

```typescript
interface CEB {
  id: string;
  paroquiaId: string;             // FK → Paroquia
  codigoCeb: string;              // Único por paróquia
  nome: string;                   // Sincroniza com Dizimistas/Doacoes
  emailLogin: string;
  senha: string;                  // Hash bcrypt
  telefone: string;
  status: 'ativa' | 'inativa';    // Afeta login
  createdAt: string;
  updatedAt: string;
}
```

---

## 🔄 Fluxo de Sincronização

```
┌─────────────────────────────────────────┐
│ Usuário edita nome da paróquia          │
└────────────────┬────────────────────────┘
                 │
                 ↓
    ┌─────────────────────────────┐
    │ updateParoquia(id, updates) │
    └────────────┬────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ↓                ↓
    Supabase         LocalStorage
    UPDATE           localStorage.set()
    ↓                ↓
    Retorna novo     Retorna novo
    nome             nome
         │                │
         └───────┬────────┘
                 │
                 ↓
    ┌────────────────────────────┐
    │ React setState novo valor  │
    └────────────┬───────────────┘
                 │
                 ↓
    ┌────────────────────────────┐
    │ Re-render com novo nome    │
    └────────────┬───────────────┘
                 │
                 ↓
    ┌────────────────────────────────┐
    │ Todas as queries retornam      │
    │ novo nome (Supabase JOINs ou   │
    │ LocalStorage filtrado)         │
    └────────────┬────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────┐
    │ ✅ Sincronização completa      │
    │ CEBs, Doacoes, Login refletem  │
    └────────────────────────────────┘
```

---

## 🚀 Otimizações

### Caching

```typescript
const paroquiasCache = useRef<Paroquia[]>([]);

async function getParoquiasComCache() {
  if (paroquiasCache.current.length > 0) {
    return paroquiasCache.current;
  }

  const paroquias = await getParoquias();
  paroquiasCache.current = paroquias;
  return paroquias;
}
```

### Paginação

```typescript
// Implementar em backend.ts para grandes volumes
export async function getParoquiasPaginadas(page: number, limit: number = 20) {
  const paroquias = await getParoquias();
  const start = page * limit;
  const end = start + limit;
  return {
    data: paroquias.slice(start, end),
    total: paroquias.length,
    page,
    pageSize: limit
  };
}
```

---

## 📞 Suporte

Dúvidas? Veja:
- [README.md](./README.md) - Visão geral
- [QUICK_START.md](./QUICK_START.md) - Setup rápido
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Detalhes técnicos
- [SECURITY.md](./SECURITY.md) - Segurança em produção

---

**Última atualização**: Maio 2024 | **Versão**: 2.0.0
