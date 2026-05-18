-- ============================================================================
-- SCHEMA SUPABASE - DÍZIMO DIGITAL V2
-- ============================================================================
-- Tabelas com relacionamentos, IDs como chaves primárias e estrangeiras
-- Sincronização automática de dados via triggers

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE status_admin AS ENUM ('ativo', 'inativo');
CREATE TYPE status_paroquia AS ENUM ('ativa', 'inativa');
CREATE TYPE status_ceb AS ENUM ('ativa', 'inativa');
CREATE TYPE status_pessoa AS ENUM ('ativo', 'inativo');
CREATE TYPE tipo_pastoral AS ENUM ('pastoral', 'movimento');
CREATE TYPE tipo_doacao AS ENUM ('dizimo', 'oferta', 'doacao');
CREATE TYPE forma_pagamento AS ENUM ('dinheiro', 'pix', 'transferencia');

-- ============================================================================
-- TABELA: administradores
-- PK: id | Sem FK
-- ============================================================================

CREATE TABLE public.administradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  logo_url TEXT,
  status status_admin NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_administradores_email ON public.administradores(email);

-- ============================================================================
-- TABELA: paroquias
-- PK: id | FK: administrador_criou_id (admin)
-- ============================================================================

CREATE TABLE public.paroquias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  administrador_criou_id UUID NOT NULL REFERENCES public.administradores(id) ON DELETE RESTRICT,
  codigo_paroquia VARCHAR(50) NOT NULL UNIQUE,
  logo_url VARCHAR(255),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  endereco VARCHAR(500),
  fundacao DATE,
  cnpj VARCHAR(20) UNIQUE,
  paroco_nome VARCHAR(255),
  email_login_secretaria VARCHAR(255),
  senha VARCHAR(255) NOT NULL,
  status status_paroquia NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_paroquias_codigo ON public.paroquias(codigo_paroquia);
CREATE INDEX idx_paroquias_nome ON public.paroquias(nome);
CREATE INDEX idx_paroquias_admin ON public.paroquias(administrador_criou_id);

-- ============================================================================
-- TABELA: configuracoes_paroquias
-- PK: id | FK: paroquia_id
-- ============================================================================

CREATE TABLE public.configuracoes_paroquias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paroquia_id UUID NOT NULL UNIQUE REFERENCES public.paroquias(id) ON DELETE CASCADE,
  percentual_dizimo_cebs NUMERIC(5, 2) NOT NULL DEFAULT 30.00,
  percentual_oferta_cebs NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
  percentual_curia_diocesana NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  percentual_diocese NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  vigente_desde DATE NOT NULL,
  vigente_ate DATE,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_configuracoes_paroquias_id ON public.configuracoes_paroquias(paroquia_id);

-- ============================================================================
-- TABELA: cebs
-- PK: id | FK: paroquia_id
-- ============================================================================

CREATE TABLE public.cebs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paroquia_id UUID NOT NULL REFERENCES public.paroquias(id) ON DELETE CASCADE,
  codigo_ceb VARCHAR(50) NOT NULL,
  logo_url TEXT,
  nome VARCHAR(255) NOT NULL,
  email_login VARCHAR(255),
  senha VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  status status_ceb NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(paroquia_id, codigo_ceb)
);

CREATE INDEX idx_cebs_paroquia ON public.cebs(paroquia_id);
CREATE INDEX idx_cebs_nome ON public.cebs(nome);
CREATE INDEX idx_cebs_codigo ON public.cebs(codigo_ceb);

-- ============================================================================
-- TABELA: pastorais_movimentos
-- PK: id | Sem FK (compartilhado em toda a aplicação)
-- ============================================================================

CREATE TABLE public.pastorais_movimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  tipo tipo_pastoral NOT NULL,
  status status_pessoa NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pastorais_nome ON public.pastorais_movimentos(nome);
CREATE INDEX idx_pastorais_tipo ON public.pastorais_movimentos(tipo);

-- ============================================================================
-- TABELA: conselheiros_comunitarios
-- PK: id | FK: ceb_id, pastoral_movimento_id (opcional)
-- ============================================================================

CREATE TABLE public.conselheiros_comunitarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ceb_id UUID NOT NULL REFERENCES public.cebs(id) ON DELETE CASCADE,
  pastoral_movimento_id UUID REFERENCES public.pastorais_movimentos(id) ON DELETE SET NULL,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  cargo VARCHAR(100),
  status status_pessoa NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conselheiros_ceb ON public.conselheiros_comunitarios(ceb_id);
CREATE INDEX idx_conselheiros_pastoral ON public.conselheiros_comunitarios(pastoral_movimento_id);

-- ============================================================================
-- TABELA: dizimistas
-- PK: id | FK: ceb_id
-- ============================================================================

CREATE TABLE public.dizimistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ceb_id UUID NOT NULL REFERENCES public.cebs(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco VARCHAR(500),
  data_nascimento DATE,
  status status_pessoa NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dizimistas_ceb ON public.dizimistas(ceb_id);
CREATE INDEX idx_dizimistas_nome ON public.dizimistas(nome);

-- ============================================================================
-- TABELA: doacoes
-- PK: id | FK: ceb_id, dizimista_id (opcional)
-- ============================================================================

CREATE TABLE public.doacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ceb_id UUID NOT NULL REFERENCES public.cebs(id) ON DELETE CASCADE,
  dizimista_id UUID REFERENCES public.dizimistas(id) ON DELETE SET NULL,
  valor NUMERIC(15, 2) NOT NULL,
  competencia_mes INTEGER NOT NULL CHECK (competencia_mes >= 1 AND competencia_mes <= 12),
  competencia_ano INTEGER NOT NULL,
  tipo_doacao tipo_doacao NOT NULL,
  forma_pagamento forma_pagamento NOT NULL,
  observacoes TEXT,
  data_lancamento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doacoes_ceb ON public.doacoes(ceb_id);
CREATE INDEX idx_doacoes_dizimista ON public.doacoes(dizimista_id);
CREATE INDEX idx_doacoes_competencia ON public.doacoes(competencia_ano, competencia_mes);

-- ============================================================================
-- TABELA: alertas_percentuais
-- PK: id | FK: paroquia_id, ceb_id, configuracao_paroquia_id
-- ============================================================================

CREATE TABLE public.alertas_percentuais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paroquia_id UUID NOT NULL REFERENCES public.paroquias(id) ON DELETE CASCADE,
  ceb_id UUID NOT NULL REFERENCES public.cebs(id) ON DELETE CASCADE,
  configuracao_paroquia_id UUID NOT NULL REFERENCES public.configuracoes_paroquias(id) ON DELETE CASCADE,
  percentual_dizimo_anterior NUMERIC(5, 2),
  percentual_dizimo_novo NUMERIC(5, 2),
  percentual_oferta_anterior NUMERIC(5, 2),
  percentual_oferta_novo NUMERIC(5, 2),
  mensagem TEXT NOT NULL,
  lido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alertas_paroquia ON public.alertas_percentuais(paroquia_id);
CREATE INDEX idx_alertas_ceb ON public.alertas_percentuais(ceb_id);

-- ============================================================================
-- TRIGGER: atualiza updated_at automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_administradores BEFORE UPDATE ON public.administradores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_paroquias BEFORE UPDATE ON public.paroquias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_configuracoes_paroquias BEFORE UPDATE ON public.configuracoes_paroquias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_cebs BEFORE UPDATE ON public.cebs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_pastorais_movimentos BEFORE UPDATE ON public.pastorais_movimentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_conselheiros_comunitarios BEFORE UPDATE ON public.conselheiros_comunitarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_dizimistas BEFORE UPDATE ON public.dizimistas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_doacoes BEFORE UPDATE ON public.doacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_alertas_percentuais BEFORE UPDATE ON public.alertas_percentuais
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DADOS INICIAIS DE TESTE
-- ============================================================================

-- Admin
INSERT INTO public.administradores (nome, email, senha, status) VALUES
('Administrador', 'admin@dizimo.com', 'admin123', 'ativo'::status_admin);

-- Paróquia
INSERT INTO public.paroquias 
(administrador_criou_id, codigo_paroquia, nome, email, telefone, endereco, fundacao, cnpj, paroco_nome, email_login_secretaria, senha, status)
SELECT id, '001', 'Nossa Senhora das Graças', 'paroquia@nsgraças.com.br', '(27) 3522-1234',
       'Rua das Flores, 100 - Centro, Cachoeiro de Itapemirim - ES', '1950-05-13', '12.345.678/0001-90',
       'Pe. João da Silva', 'secretaria@nsgraças.com.br', 'paroquia123', 'ativa'::status_paroquia
FROM public.administradores WHERE email = 'admin@dizimo.com';

-- Configuração da Paróquia
INSERT INTO public.configuracoes_paroquias (paroquia_id, percentual_dizimo_cebs, percentual_oferta_cebs, percentual_curia_diocesana, percentual_diocese, vigente_desde, ativa)
SELECT id, 30.00, 20.00, 5.00, 10.00, '2024-01-01', true
FROM public.paroquias WHERE codigo_paroquia = '001';

-- CEBs
INSERT INTO public.cebs (paroquia_id, codigo_ceb, nome, email_login, senha, telefone, status)
SELECT id, 'CEB-001', 'CEB São José', 'saojose@ceb.com', 'ceb123', '(27) 99901-1111', 'ativa'::status_ceb
FROM public.paroquias WHERE codigo_paroquia = '001'
UNION ALL
SELECT id, 'CEB-002', 'CEB Santa Maria', 'santamaria@ceb.com', 'ceb123', '(27) 99902-2222', 'ativa'::status_ceb
FROM public.paroquias WHERE codigo_paroquia = '001'
UNION ALL
SELECT id, 'CEB-003', 'CEB São Francisco', 'saofrancisco@ceb.com', 'ceb123', '(27) 99903-3333', 'ativa'::status_ceb
FROM public.paroquias WHERE codigo_paroquia = '001';

-- Pastorais e Movimentos
INSERT INTO public.pastorais_movimentos (nome, tipo, status) VALUES
('Coordenador Comunitário', 'movimento', 'ativo'::status_pessoa),
('Tesoureiro', 'movimento', 'ativo'::status_pessoa),
('Secretário', 'movimento', 'ativo'::status_pessoa),
('Pastoral do Dízimo', 'pastoral', 'ativo'::status_pessoa),
('Pastoral da Liturgia', 'pastoral', 'ativo'::status_pessoa),
('Pastoral do Canto/Litúrgica Musical', 'pastoral', 'ativo'::status_pessoa),
('Pastoral dos Coroinhas', 'pastoral', 'ativo'::status_pessoa),
('Pastoral dos Acólitos', 'pastoral', 'ativo'::status_pessoa),
('Pastoral dos Leitores', 'pastoral', 'ativo'::status_pessoa),
('Pastoral da Acolhida', 'pastoral', 'ativo'::status_pessoa),
('Pastoral da Comunicação (PASCOM)', 'pastoral', 'ativo'::status_pessoa),
('Pastoral do Batismo', 'pastoral', 'ativo'::status_pessoa),
('Pastoral da Crisma', 'pastoral', 'ativo'::status_pessoa),
('Pastoral da Catequese', 'pastoral', 'ativo'::status_pessoa),
('Pastoral Familiar', 'pastoral', 'ativo'::status_pessoa),
('Pastoral Matrimonial', 'pastoral', 'ativo'::status_pessoa);

-- Conselheiros (exemplo para primeira CEB)
INSERT INTO public.conselheiros_comunitarios (ceb_id, pastoral_movimento_id, nome, telefone, email, cargo, status)
SELECT c.id, pm.id, 'João Silva', '(27) 99901-5001', 'joao@example.com', 'Coordenador', 'ativo'::status_pessoa
FROM public.cebs c
CROSS JOIN public.pastorais_movimentos pm
WHERE c.codigo_ceb = 'CEB-001' AND pm.nome = 'Coordenador Comunitário'
UNION ALL
SELECT c.id, pm.id, 'Maria Santos', '(27) 99901-5002', 'maria@example.com', 'Tesoureira', 'ativo'::status_pessoa
FROM public.cebs c
CROSS JOIN public.pastorais_movimentos pm
WHERE c.codigo_ceb = 'CEB-001' AND pm.nome = 'Tesoureiro';

-- Dizimistas (exemplo para primeira CEB)
INSERT INTO public.dizimistas (ceb_id, nome, telefone, email, endereco, data_nascimento, status)
SELECT id, 'Pedro Costa', '(27) 99901-6001', 'pedro@example.com', 'Rua A, 123', '1980-01-15', 'ativo'::status_pessoa
FROM public.cebs WHERE codigo_ceb = 'CEB-001'
UNION ALL
SELECT id, 'Ana Silva', '(27) 99901-6002', 'ana@example.com', 'Rua B, 456', '1985-03-20', 'ativo'::status_pessoa
FROM public.cebs WHERE codigo_ceb = 'CEB-001'
UNION ALL
SELECT id, 'Carlos Santos', '(27) 99901-6003', 'carlos@example.com', 'Rua C, 789', '1978-07-10', 'ativo'::status_pessoa
FROM public.cebs WHERE codigo_ceb = 'CEB-001';

-- Doacoes (exemplo)
INSERT INTO public.doacoes (ceb_id, dizimista_id, valor, competencia_mes, competencia_ano, tipo_doacao, forma_pagamento, observacoes)
SELECT c.id, d.id, 100.00, 5, 2024, 'dizimo', 'pix', 'Maio 2024'
FROM public.cebs c
CROSS JOIN public.dizimistas d
WHERE c.codigo_ceb = 'CEB-001' AND d.nome = 'Pedro Costa'
UNION ALL
SELECT c.id, d.id, 150.00, 5, 2024, 'dizimo', 'dinheiro', 'Maio 2024'
FROM public.cebs c
CROSS JOIN public.dizimistas d
WHERE c.codigo_ceb = 'CEB-001' AND d.nome = 'Ana Silva'
UNION ALL
SELECT c.id, d.id, 200.00, 5, 2024, 'oferta', 'transferencia', 'Maio 2024'
FROM public.cebs c
CROSS JOIN public.dizimistas d
WHERE c.codigo_ceb = 'CEB-001' AND d.nome = 'Carlos Santos';

-- ============================================================================
-- POLÍTICAS RLS (Row Level Security) - Opcional para produção
-- ============================================================================
-- Deixe comentado por enquanto - ativar após testes

-- ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.paroquias ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.cebs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.dizimistas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.doacoes ENABLE ROW LEVEL SECURITY;
