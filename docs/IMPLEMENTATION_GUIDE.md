# 📖 Guia de Implementação - Sincronização em Tempo Real

Documento técnico explicando como implementar sincronização de dados entre cadastros.

---

## 🎯 Requisito: Sincronização de Nomes

**Cenário**: Quando um nome é alterado em um cadastro, deve refletir automaticamente em todos os relacionados.

**Exemplo**:
```
1. Admin muda: "Nossa Senhora das Graças" → "São José"
2. Todos os CEBs dessa paróquia mostram a paróquia como "São José"
3. Login de CEB agora busca por "São José" (e não mais pelo nome antigo)
4. Alertas mostram "Alerta de São José" em vez do antigo nome
```

---

## 🏗️ Arquitetura de Sincronização

### 1. Banco de Dados (PostgreSQL via Supabase)

**Chaves Primárias e Estrangeiras**:

```sql
-- Paróquia é o centro
paroquias (
  id UUID PRIMARY KEY,
  nome VARCHAR(255) NOT NULL
)

-- CEBs referenciam paróquias
cebs (
  id UUID PRIMARY KEY,
  paroquia_id UUID REFERENCES paroquias(id)
)

-- Dizimistas referenciam CEBs
dizimistas (
  id UUID PRIMARY KEY,
  ceb_id UUID REFERENCES cebs(id)
)

-- Quando paróquia muda:
UPDATE paroquias SET nome = 'Novo Nome' WHERE id = 'xyz'
-- Automaticamente, todos os CEBs com paroquia_id='xyz' usam 'Novo Nome'
```

**Triggers Automáticos**:

```sql
-- Atualiza updated_at sempre que há mudança
CREATE TRIGGER trigger_update_paroquias 
BEFORE UPDATE ON paroquias
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
```

### 2. Frontend (React)

**Fluxo**:

```
┌─────────────────────────────────────────────────────┐
│ Usuário faz mudança (ex: edita nome da paróquia)   │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │ Component detecta mudança   │
        │ (onChange, onSubmit, etc)   │
        └────────┬───────────────────┘
                 │
                 ↓
        ┌────────────────────────────────┐
        │ Chama backend.updateParoquia()  │
        │ (src/utils/backend.ts)         │
        └────────┬───────────────────────┘
                 │
                 ↓
        ┌────────────────────────────┐
        │ Se Supabase ativo:          │
        │ - Envia UPDATE para DB      │
        │ - Retorna dados atualizados │
        │                             │
        │ Se LocalStorage:            │
        │ - Atualiza localStorage     │
        │ - Retorna dados atualizados │
        └────────┬────────────────────┘
                 │
                 ↓
        ┌────────────────────────────┐
        │ Context recebe dados novos  │
        │ (AuthContext, DataContext)  │
        └────────┬───────────────────┘
                 │
                 ↓
        ┌────────────────────────────┐
        │ React re-renderiza:         │
        │ - CEBs mostram novo nome    │
        │ - Login atualizado          │
        │ - Dashboard refletido       │
        └────────────────────────────┘
```

---

## 📝 Implementação Passo-a-Passo

### Arquivo: `src/utils/backend.ts`

Este arquivo é o **pont de conexão** entre Frontend e Backend:

```typescript
// ✅ Conecta com Supabase
export async function initializeBackend(): Promise<boolean> {
  const connected = await testConnection();
  USE_SUPABASE = connected;
  return connected;
}

// ✅ Busca paróquias (com relacionamentos)
export async function getParoquias(): Promise<Paroquia[]> {
  if (USE_SUPABASE) {
    const { data } = await supabase.from('paroquias').select('*');
    return data.map(mapSupabaseData);
  }
  return storageGet(KEYS.PAROQUIAS);
}

// ✅ Atualiza paróquia (sincroniza com CEBs)
export async function updateParoquia(id: string, updates: Partial<Paroquia>) {
  if (USE_SUPABASE) {
    const { data } = await supabase
      .from('paroquias')
      .update(mapToSnakeCase(updates))
      .eq('id', id)
      .select()
      .single();
    return mapSupabaseData(data);
  }
  // localStorage: atualiza localmente
  const paroquias = storageGet(KEYS.PAROQUIAS);
  paroquias[idx] = { ...paroquias[idx], ...updates };
  storageSet(KEYS.PAROQUIAS, paroquias);
  return paroquias[idx];
}
```

### Arquivo: `src/contexts/AuthContext.tsx`

Integra com o novo backend:

```typescript
import { loginParoquial, loginCEB, getAdministrador } from '../utils/backend';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const loginParoquial = useCallback((codigoOuNome: string, senha: string) => {
    // ✅ Usa backend.ts para buscar paróquia
    const paroquias = await getParoquias();
    const paroquia = paroquias.find(p =>
      (p.codigoParoquia === codigoOuNome ||
       p.nome.includes(codigoOuNome)) &&
      p.senha === senha
    );
    
    if (paroquia) {
      setUser({ role: 'paroquial', paroquiaId: paroquia.id, nome: paroquia.nome });
      return null;
    }
    return 'Paróquia não encontrada';
  });

  const loginCEB = useCallback((codigoOuNomeParoquia: string, codigoOuNomeCeb: string, senha: string) => {
    // ✅ Busca paróquia pelo código/nome (sincronizado)
    const paroquias = await getParoquias();
    const paroquia = paroquias.find(p =>
      p.codigoParoquia === codigoOuNomeParoquia ||
      p.nome.includes(codigoOuNomeParoquia)
    );

    // ✅ Busca CEB dessa paróquia
    const cebs = await getCEBs();
    const ceb = cebs.find(c =>
      c.paroquiaId === paroquia.id &&
      (c.codigoCeb === codigoOuNomeCeb ||
       c.nome.includes(codigoOuNomeCeb)) &&
      c.senha === senha
    );

    if (ceb) {
      setUser({
        role: 'ceb',
        paroquiaId: paroquia.id,
        cebId: ceb.id,
        nome: ceb.nome
      });
      return null;
    }
    return 'CEB não encontrada';
  });
}
```

### Arquivo: `src/pages/admin/ParoquiasPage.tsx`

Exemplo de como usar sincronização:

```typescript
export function ParoquiasPage() {
  const [paroquias, setParoquias] = useState<Paroquia[]>([]);

  useEffect(() => {
    // ✅ Busca paróquias com relacionamentos
    loadParoquias();
  }, []);

  const loadParoquias = async () => {
    const data = await getParoquias();
    setParoquias(data);
  };

  const handleUpdateParoquia = async (id: string, updates: Partial<Paroquia>) => {
    // ✅ Atualiza paróquia
    const updated = await updateParoquia(id, updates);
    
    if (updated) {
      // ✅ Atualiza estado local
      setParoquias(prev =>
        prev.map(p => p.id === id ? updated : p)
      );
      // ✅ CEBs relacionados agora veem o novo nome automaticamente
      showToast('Paróquia atualizada com sucesso', 'success');
    }
  };

  return (
    <div>
      {paroquias.map(paroquia => (
        <ParoquiaCard
          key={paroquia.id}
          paroquia={paroquia}
          onUpdate={handleUpdateParoquia}
        />
      ))}
    </div>
  );
}
```

---

## 🔗 Relacionamentos e Sincronização

### Tabela de Sincronizações

| Campo Alterado | Afeta... | Como | Quando |
|---|---|---|---|
| `paroquias.nome` | CEBs | Todos os CEBs com `paroquia_id` usam novo nome | Query JOIN |
| `paroquias.status` | CEBs, Doacoes | CEBs inativas não podem fazer login | Query WHERE status='ativa' |
| `cebs.nome` | Dizimistas, Doacoes | Relatórios mostram novo nome da CEB | Query JOIN |
| `cebs.status` | Login | Não permitir login em CEB inativa | Query WHERE status='ativa' |
| `dizimistas.nome` | Doacoes | Filtro de doações busca por novo nome | Query LIKE |

### Exemplo de Query com Sincronização

```sql
-- Quando paróquia é atualizada, retorna CEBs sincronizados:
SELECT c.*, p.nome as paroquia_nome
FROM cebs c
JOIN paroquias p ON c.paroquia_id = p.id
WHERE p.id = 'uuid-paroquia'
AND p.status = 'ativa'
AND c.status = 'ativa';

-- Resultado: CEBs com nome da paróquia atualizado
```

---

## ✅ Checklist de Implementação

- [ ] Schema SQL criado em Supabase (`supabase.sql`)
- [ ] `src/utils/backend.ts` com funções de CRUD
- [ ] `src/utils/supabase.ts` com cliente Supabase
- [ ] `App.tsx` chama `initializeBackend()`
- [ ] AuthContext usa `backend.ts` para buscar dados
- [ ] Páginas usam `getParoquias()`, `updateParoquia()`, etc
- [ ] Login sincroniza: busca por nome/código da paróquia
- [ ] Edição de paróquia reflete em CEBs
- [ ] Edição de CEB reflete em Dizimistas/Doacoes
- [ ] `.env.local` com credenciais Supabase
- [ ] Testes com dados de exemplo

---

## 🧪 Teste Manual

### Teste 1: Sincronização de Nome da Paróquia

```
1. Abrir Frontend (http://localhost:5173)
2. Login como Admin (admin@dizimo.com / admin123)
3. Ir para /admin/paroquias
4. Editar nome: "Nossa Senhora das Graças" → "São José"
5. Salvar
6. Logout
7. Ir para /login (tela de login de paróquia)
8. Digitar "São José" no campo paróquia
9. ✅ Deve encontrar (se não encontrasse, não sincronizou)
```

### Teste 2: Login de CEB com Paróquia Sincronizada

```
1. Em /login de CEB
2. Campo paróquia: "São José" (nome novo)
3. Campo CEB: "CEB-001"
4. Senha: "ceb123"
5. ✅ Deve fazer login com sucesso (paróquia sincronizou)
```

### Teste 3: Dashboard Reflete Mudanças

```
1. Login como Admin
2. Mudar nome da paróquia
3. Logout
4. Login como Paroquial
5. Dashboard mostra nome novo na header
6. ✅ Sucesso se mostrar nome novo
```

---

## 🚀 Deployment com Sincronização

### Produção (Supabase Cloud)

```bash
# 1. Criar projeto em supabase.com
# 2. Executar supabase.sql
# 3. Configurar .env.local com credenciais
# 4. npm run build
# 5. Deploy em Vercel/Netlify
```

### Desenvolvimento (Docker Local)

```bash
# 1. docker-compose -f docker-compose.local.yml up -d
# 2. npm run dev
# 3. Dados sincronizam localmente
```

---

## 📊 Monitoramento

### Verificar Sincronização no Supabase

```sql
-- Paróquias e CEBs relacionados
SELECT 
  p.nome as paroquia_nome,
  COUNT(c.id) as qtd_cebs
FROM paroquias p
LEFT JOIN cebs c ON c.paroquia_id = p.id
GROUP BY p.id, p.nome;

-- Doacoes por CEB (com nome sincronizado)
SELECT 
  p.nome as paroquia_nome,
  c.nome as ceb_nome,
  COUNT(d.id) as qtd_doacoes,
  SUM(d.valor) as total
FROM doacoes d
JOIN cebs c ON d.ceb_id = c.id
JOIN paroquias p ON c.paroquia_id = p.id
GROUP BY p.id, p.nome, c.id, c.nome;
```

---

## 🎓 Conceitos Importantes

### Integridade Referencial
- Foreign Keys garantem que não há CEBs órfãs
- Se paróquia é deletada, CEBs são cascateados

### Sincronização de Dados
- Mudanças são refletidas via relacionamentos
- Não há duplicação de nomes (centralizado)
- Join queries retornam dados sempre atualizados

### Performance
- Índices em `paroquia_id`, `ceb_id` para queries rápidas
- Paginação em listas grandes
- Cache no frontend (useState, Context)

---

## 📚 Referências

- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Supabase Relationships](https://supabase.com/docs/guides/api/joins-and-nesting)
- [React Context Optimization](https://react.dev/reference/react/useContext)

---

**Pronto para implementar?** Comece pelo `QUICK_START.md` e volte aqui para referência!
