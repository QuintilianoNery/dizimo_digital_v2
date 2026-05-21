# Cadastros e Funcionalidades Principais

## 📋 Visão Geral

O sistema **Dízimo Digital** possui três níveis de cadastro com hierarquia e funcionalidades específicas:

```
Administrador
    ├── Paróquia 1
    │   ├── CEB 1
    │   ├── CEB 2
    │   └── CEB N
    ├── Paróquia 2
    │   └── CEB N
    └── Paróquia N
```

---

## 1️⃣ Cadastro Administrador

### Descrição
Nível superior do sistema. Responsável pela administração central e criação de paróquias.

### Dados Cadastrais
- **Nome**: Nome completo do administrador
- **Email**: Email único para login
- **Logo**: Logomarca do sistema (opcional)
- **Status**: Ativo ou Inativo

### Principais Funcionalidades

#### Dashboard Administrativo
- Visualizar resumo geral do sistema
- Acompanhar total de paróquias cadastradas
- Ver quantidade total de CEBs ativas
- Monitorar total arrecadado em todo o sistema
- Acompanhar quantidade de registros de doação

#### Gerenciar Paróquias
- **Criar** paróquias
- **Editar** dados cadastrais
- **Visualizar** lista completa
- **Ativar/Desativar** paróquias
- **Deletar** paróquias (se necessário)

#### Gerenciar Senhas
- Resetar senha de paróquias
- Controlar acesso de usuários

#### Visualizações
- Tabela com código, nome, pároco e quantidade de CEBs
- Filtro por status (Ativa/Inativa)
- Busca por nome ou código

---

## 2️⃣ Cadastro Paróquia

### Descrição
Nível intermediário. Cada paróquia gerencia suas CEBs, configurações financeiras e relatórios.

### Dados Cadastrais
- **Código**: Identificador único da paróquia
- **Nome**: Nome da paróquia
- **Logo**: Logomarca da paróquia (opcional)
- **Email**: Email da paróquia
- **Telefone**: Contato telefônico
- **Endereço**: Localização completa
- **Data de Fundação**: Quando foi fundada
- **CNPJ**: Número CNPJ
- **Nome do Pároco**: Responsável pela paróquia
- **Email da Secretaria**: Para login de acesso
- **Status**: Ativa ou Inativa

### Principais Funcionalidades

#### Dashboard Paroquial
- Visualizar arrecadação consolidada de todas as CEBs
- Acompanhar dados de arrecadação por período (anual, mensal, etc.)
- Ver gráficos de evolução de dízimos e ofertas
- Filtrar por ano e por CEB específica

#### Configurações Financeiras
- **Definir percentuais de distribuição**:
  - Percentual para CEBs (dízimo)
  - Percentual para CEBs (oferta)
  - Percentual para Cúria Diocesana
  - Percentual para Diocese
- Data de vigência da configuração
- Histórico de configurações (ativas e inativas)

#### Gerenciar CEBs
- Criar novas CEBs
- Editar dados de CEBs existentes
- Visualizar lista de todas as CEBs
- Ativar/Desativar CEBs
- Deletar CEBs

#### Gerenciar Pastorais e Movimentos
- Criar pastorais (grupos de trabalho pastoral)
- Criar movimentos (grupos de devotos/seminaristas)
- Ativar/Desativar
- Visualizar lista

#### Relatórios
- Relatórios de arrecadação por CEB
- Análise de contribuições
- Comparativos mensais/anuais
- Exportação de dados

#### Gerenciar Configurações da CEB
- Editar informações de CEBs específicas
- Gerenciar acesso de usuários das CEBs

---

## 3️⃣ Cadastro CEBs (Comunidade Eclesial de Base)

### Descrição
Nível operacional. As CEBs são as comunidades de base que registram doações e gerenciam seus membros.

### Dados Cadastrais
- **Código**: Identificador único da CEB
- **Nome**: Nome da comunidade
- **Logo**: Logomarca da CEB (opcional)
- **Email**: Email para login
- **Telefone**: Contato telefônico
- **Status**: Ativa ou Inativa

### Principais Funcionalidades

#### Dashboard da CEB
- Visualizar arrecadação mensal
- Acompanhar dados de repasse (dízimo, oferta, etc.)
- Ver quantidade de dizimistas ativos
- Visualizar alertas de aniversariantes do mês
- Gráfico de evolução mensal de arrecadação
- Tipo de doação (dízimo, oferta, doação)

#### Gerenciar Conselheiros Comunitários
- **Criar** conselheiros
- **Editar** dados
- **Deletar** registros
- Dados cadastrais:
  - Nome
  - Telefone
  - Email
  - Cargo/Função
  - Pastoral/Movimento associado (opcional)
  - Status (Ativo/Inativo)

#### Gerenciar Dizimistas
- **Criar** registro de dizimista
- **Editar** dados pessoais
- **Visualizar** lista completa
- **Deletar** registros
- Dados cadastrais:
  - Nome
  - Telefone
  - Email (opcional)
  - Endereço
  - Data de Nascimento
  - Status (Ativo/Inativo)

#### Registrar Doações
- **Criar** novo registro de doação
- **Editar** doações lançadas
- **Deletar** registros
- Dados da doação:
  - Valor
  - Tipo (Dízimo, Oferta, Doação)
  - Forma de Pagamento (Dinheiro, PIX, Transferência)
  - Mês e Ano de Competência
  - Dizimista (opcional - para doações anônimas)
  - Observações

#### Filtrar e Buscar Doações
- Filtrar por mês
- Filtrar por ano
- Filtrar por tipo de doação
- Filtrar por forma de pagamento
- Buscar por dizimista

#### Alertas
- Sistema de alertas sobre desvios de percentuais
- Aniversariantes do mês
- Notificações importantes

#### Relatórios da CEB
- Relatório de doações por período
- Análise de contribuição por dizimista
- Evolução mensal de arrecadação
- Dados de repasse

---

## 🔑 Características Comuns a Todos os Cadastros

### Campos Automáticos
- **Data de Criação**: Registrada automaticamente
- **Data de Atualização**: Atualizada automaticamente

### Gerenciamento de Acesso
- Login com email e senha
- Controle de permissões por nível
- Sessão segura

### Status
- **Ativo/Inativa**: Controla disponibilidade do cadastro
- Registros inativos não aparecem em operações

### Interface Padrão
- Listagem com busca
- Formulários de criação e edição
- Confirmação de exclusão
- Badges de status
- Notificações de sucesso/erro

---

## 📊 Fluxo de Dados

```
Administrador cria Paróquia
           ↓
Paróquia define configurações financeiras
           ↓
Paróquia cria CEBs
           ↓
CEB registra Conselheiros Comunitários
           ↓
CEB registra Dizimistas
           ↓
CEB registra Doações (Dízimo, Oferta, Doação)
           ↓
Sistema calcula repasses baseado em configurações
           ↓
Paróquia visualiza relatórios consolidados
           ↓
Administrador visualiza visão geral do sistema
```

---

## 🎯 Resumo Comparativo

| Funcionalidade | Admin | Paróquia | CEB |
|---|---|---|---|
| Dashboard | ✅ Geral | ✅ Consolidado | ✅ Operacional |
| Gerenciar Paróquias | ✅ Criar/Editar | ❌ | ❌ |
| Gerenciar CEBs | ❌ | ✅ Criar/Editar | ❌ |
| Configurações Financeiras | ❌ | ✅ | ❌ |
| Gerenciar Conselheiros | ❌ | ❌ | ✅ |
| Gerenciar Dizimistas | ❌ | ❌ | ✅ |
| Registrar Doações | ❌ | ❌ | ✅ |
| Relatórios | ✅ Geral | ✅ Por Paróquia | ✅ Por CEB |

