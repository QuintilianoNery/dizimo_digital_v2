-- ============================================================================
-- SCHEMA SUPABASE - DÍZIMO DIGITAL V2
-- ============================================================================
-- Tabelas com relacionamentos, IDs como chaves primárias e estrangeiras
-- Sincronização automática de dados via triggers

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- Administrador
INSERT INTO public.administradores (nome, email, status)
VALUES ('Administrador', 'admin@dizimo.com', 'ativo'::status_admin)
ON CONFLICT (email) DO NOTHING;

-- Paróquias
INSERT INTO public.paroquias 
(administrador_criou_id, codigo_paroquia, nome, email, telefone, endereco, fundacao, cnpj, paroco_nome, email_login_secretaria, status)
SELECT id, '001', 'Nossa Senhora das Graças', 'paroquia@nsgraças.com.br', '(27) 3522-1234',
  'Rua das Flores, 100 - Centro, Cachoeiro de Itapemirim - ES', '1950-05-13'::date, '12.345.678/0001-90',
   'Pe. João da Silva', 'secretaria@nsgraças.com.br', 'ativa'::status_paroquia
FROM public.administradores WHERE email = 'admin@dizimo.com'
UNION ALL
SELECT id, '002', 'São Felipe', 'paroquia@saofelipe.com.br', '(27) 3555-2026',
  'Avenida São Felipe, 50 - Centro, São Felipe - ES', '1968-08-10'::date, '98.765.432/0001-10',
   'Pe. Antônio Rodrigues', 'secretaria@saofelipe.com.br', 'ativa'::status_paroquia
FROM public.administradores WHERE email = 'admin@dizimo.com';

-- Configurações das Paróquias
INSERT INTO public.configuracoes_paroquias (paroquia_id, percentual_dizimo_cebs, percentual_oferta_cebs, percentual_curia_diocesana, percentual_diocese, vigente_desde, ativa)
SELECT id, 30.00, 20.00, 5.00, 10.00, '2024-01-01'::date, true
FROM public.paroquias WHERE codigo_paroquia = '001'
UNION ALL
SELECT id, 35.00, 25.00, 5.00, 10.00, '2024-01-01'::date, true
FROM public.paroquias WHERE codigo_paroquia = '002';

-- CEBs
INSERT INTO public.cebs (paroquia_id, codigo_ceb, nome, email_login, telefone, status)
SELECT id, 'CEB-001', 'CEB São José', 'saojose@ceb.com', '(27) 99901-1111', 'ativa'::status_ceb
FROM public.paroquias WHERE codigo_paroquia = '001'
UNION ALL
SELECT id, 'CEB-002', 'CEB Santa Maria', 'santamaria@ceb.com', '(27) 99902-2222', 'ativa'::status_ceb
FROM public.paroquias WHERE codigo_paroquia = '001'
UNION ALL
SELECT id, 'CEB-003', 'CEB São Francisco', 'saofrancisco@ceb.com', '(27) 99903-3333', 'ativa'::status_ceb
FROM public.paroquias WHERE codigo_paroquia = '001'
UNION ALL
SELECT id, 'CEB-004', 'CEB São Felipe I', 'saofelipe1@ceb.com', '(27) 99904-4444', 'ativa'::status_ceb
FROM public.paroquias WHERE codigo_paroquia = '002'
UNION ALL
SELECT id, 'CEB-005', 'CEB São Felipe II', 'saofelipe2@ceb.com', '(27) 99905-5555', 'ativa'::status_ceb
FROM public.paroquias WHERE codigo_paroquia = '002';

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

-- Dizimistas (3 por CEB)
INSERT INTO public.dizimistas (ceb_id, nome, telefone, email, endereco, data_nascimento, status)
SELECT c.id, v.nome, v.telefone, v.email, v.endereco, v.data_nascimento, 'ativo'::status_pessoa
FROM public.cebs c
JOIN (
  VALUES
    ('CEB-001', 'Pedro Costa', '(27) 99901-6001', 'pedro@example.com', 'Rua A, 123', '1980-01-15'::date),
    ('CEB-001', 'Ana Silva', '(27) 99901-6002', 'ana@example.com', 'Rua B, 456', '1985-03-20'::date),
    ('CEB-001', 'Carlos Santos', '(27) 99901-6003', 'carlos@example.com', 'Rua C, 789', '1978-07-10'::date),
    ('CEB-002', 'Juliana Oliveira', '(27) 99902-6001', 'juliana@example.com', 'Rua D, 123', '1982-02-14'::date),
    ('CEB-002', 'Marcos Lima', '(27) 99902-6002', 'marcos@example.com', 'Rua E, 456', '1979-06-18'::date),
    ('CEB-002', 'Fernanda Souza', '(27) 99902-6003', 'fernanda@example.com', 'Rua F, 789', '1987-11-09'::date),
    ('CEB-003', 'Paulo Mendes', '(27) 99903-6001', 'paulo@example.com', 'Rua G, 123', '1981-04-12'::date),
    ('CEB-003', 'Carla Ribeiro', '(27) 99903-6002', 'carla@example.com', 'Rua H, 456', '1986-08-22'::date),
    ('CEB-003', 'Roberto Almeida', '(27) 99903-6003', 'roberto@example.com', 'Rua I, 789', '1977-12-03'::date),
    ('CEB-004', 'Luciana Nogueira', '(27) 99904-6001', 'luciana@example.com', 'Rua J, 123', '1983-05-17'::date),
    ('CEB-004', 'Thiago Pereira', '(27) 99904-6002', 'thiago@example.com', 'Rua K, 456', '1984-09-25'::date),
    ('CEB-004', 'Renata Barros', '(27) 99904-6003', 'renata@example.com', 'Rua L, 789', '1990-01-08'::date),
    ('CEB-005', 'Felipe Costa', '(27) 99905-6001', 'felipe@example.com', 'Rua M, 123', '1988-03-11'::date),
    ('CEB-005', 'Sonia Martins', '(27) 99905-6002', 'sonia@example.com', 'Rua N, 456', '1981-07-27'::date),
    ('CEB-005', 'Eduardo Rocha', '(27) 99905-6003', 'eduardo@example.com', 'Rua O, 789', '1976-10-19'::date)
) AS v(codigo_ceb, nome, telefone, email, endereco, data_nascimento)
ON v.codigo_ceb = c.codigo_ceb;

-- Doacoes (5 movimentações por CEB, 3 dizimistas em cada movimentação)
WITH dizimistas_ordenados AS (
  SELECT
    d.id,
    d.ceb_id,
    ROW_NUMBER() OVER (PARTITION BY d.ceb_id ORDER BY d.nome) AS rn
  FROM public.dizimistas d
),
movimentacoes AS (
  SELECT
    c.id AS ceb_id,
    c.nome AS ceb_nome,
    gs.movimento_num
  FROM public.cebs c
  CROSS JOIN generate_series(1, 5) AS gs(movimento_num)
)
INSERT INTO public.doacoes (ceb_id, dizimista_id, valor, competencia_mes, competencia_ano, tipo_doacao, forma_pagamento, observacoes)
SELECT
  m.ceb_id,
  d.id,
  80.00 + (m.movimento_num * 15) + (d.rn * 10),
  m.movimento_num,
  EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  'dizimo'::tipo_doacao,
  CASE ((m.movimento_num + d.rn) % 3)
    WHEN 0 THEN 'dinheiro'::forma_pagamento
    WHEN 1 THEN 'pix'::forma_pagamento
    ELSE 'transferencia'::forma_pagamento
  END,
  format('Movimentação %s - %s', m.movimento_num, m.ceb_nome)
FROM movimentacoes m
JOIN dizimistas_ordenados d
  ON d.ceb_id = m.ceb_id
 AND d.rn <= 3;

-- ============================================================================
-- POLÍTICAS RLS (Row Level Security) - Opcional para produção
-- ============================================================================
-- O app atual usa o client público do Supabase para autenticação por tabela.
-- Se o schema real usar outros nomes, alinhe os nomes das tabelas no SQL e no app.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ============================================================================
-- POLÍTICAS RLS (Row Level Security) - Opcional para produção
-- ============================================================================
-- O app atual usa o client público do Supabase para autenticação por tabela.
-- Se o schema real usar outros nomes, alinhe os nomes das tabelas no SQL e no app.

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

CREATE OR REPLACE FUNCTION public.current_auth_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

CREATE OR REPLACE FUNCTION public.is_admin_email()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT exists (
    select 1
    from public.administradores a
    where lower(a.email) = public.current_auth_email()
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_paroquia(p_paroquia_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.is_admin_email()
    OR exists (
      select 1
      from public.paroquias p
      where p.id = p_paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
$$;

CREATE OR REPLACE FUNCTION public.can_access_ceb(p_ceb_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.is_admin_email()
    OR exists (
      select 1
      from public.cebs c
      where c.id = p_ceb_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR public.can_access_paroquia(c.paroquia_id)
        )
    )
$$;

CREATE OR REPLACE FUNCTION public.can_access_alerta(p_paroquia_id uuid, p_ceb_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.is_admin_email()
    OR exists (
      select 1
      from public.cebs c
      join public.paroquias p on p.id = c.paroquia_id
      where c.id = p_ceb_id
        and p.id = p_paroquia_id
        and (
          lower(coalesce(c.email_login, '')) = public.current_auth_email()
          OR lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
$$;

CREATE OR REPLACE FUNCTION public.validate_doacao_ceb_consistency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.dizimista_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.dizimistas d
    WHERE d.id = NEW.dizimista_id
      AND d.ceb_id = NEW.ceb_id
  ) THEN
    RAISE EXCEPTION 'dizimista_id precisa pertencer a mesma CEB do lançamento';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_alerta_paroquia_ceb_consistency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ceb_paroquia_id uuid;
BEGIN
  SELECT c.paroquia_id
    INTO ceb_paroquia_id
  FROM public.cebs c
  WHERE c.id = NEW.ceb_id;

  IF ceb_paroquia_id IS NULL OR ceb_paroquia_id <> NEW.paroquia_id THEN
    RAISE EXCEPTION 'paroquia_id precisa corresponder à paróquia da CEB';
  END IF;

  RETURN NEW;
END;
$$;

ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paroquias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_paroquias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cebs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastorais_movimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conselheiros_comunitarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dizimistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_percentuais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS administradores_select_auth ON public.administradores;
DROP POLICY IF EXISTS administradores_insert_auth ON public.administradores;
DROP POLICY IF EXISTS administradores_update_auth ON public.administradores;
DROP POLICY IF EXISTS administradores_delete_auth ON public.administradores;
CREATE POLICY administradores_select_auth ON public.administradores
  FOR SELECT TO authenticated
  USING (lower(email) = public.current_auth_email());
CREATE POLICY administradores_insert_auth ON public.administradores
  FOR INSERT TO authenticated
  WITH CHECK (lower(email) = public.current_auth_email());
CREATE POLICY administradores_update_auth ON public.administradores
  FOR UPDATE TO authenticated
  USING (lower(email) = public.current_auth_email())
  WITH CHECK (lower(email) = public.current_auth_email());
CREATE POLICY administradores_delete_auth ON public.administradores
  FOR DELETE TO authenticated
  USING (lower(email) = public.current_auth_email());

DROP POLICY IF EXISTS paroquias_select_auth ON public.paroquias;
DROP POLICY IF EXISTS paroquias_insert_auth ON public.paroquias;
DROP POLICY IF EXISTS paroquias_update_auth ON public.paroquias;
DROP POLICY IF EXISTS paroquias_delete_auth ON public.paroquias;
CREATE POLICY paroquias_select_auth ON public.paroquias
  FOR SELECT TO authenticated
  USING (public.can_access_ceb(ceb_id));
    OR lower(coalesce(email_login_secretaria, '')) = public.current_auth_email()
  FOR INSERT TO authenticated WITH CHECK (public.can_access_ceb(ceb_id));
CREATE POLICY paroquias_insert_auth ON public.paroquias
  FOR UPDATE TO authenticated
  USING (public.can_access_ceb(ceb_id))
  WITH CHECK (public.can_access_ceb(ceb_id));
  WITH CHECK (
  FOR DELETE TO authenticated USING (public.can_access_ceb(ceb_id));
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
  FOR SELECT TO authenticated USING (public.can_access_ceb(ceb_id));
    OR lower(email) = public.current_auth_email()
  FOR INSERT TO authenticated WITH CHECK (public.can_access_ceb(ceb_id));
  );
  FOR UPDATE TO authenticated
  USING (public.can_access_ceb(ceb_id))
  WITH CHECK (public.can_access_ceb(ceb_id));
  FOR UPDATE TO authenticated
  FOR DELETE TO authenticated USING (public.can_access_ceb(ceb_id));

DROP TRIGGER IF EXISTS trg_doacoes_validate_ceb_consistency ON public.doacoes;
CREATE TRIGGER trg_doacoes_validate_ceb_consistency
  BEFORE INSERT OR UPDATE ON public.doacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_doacao_ceb_consistency();
    exists (
      select 1
      from public.administradores a
  FOR SELECT TO authenticated USING (public.can_access_ceb(ceb_id));
    )
  FOR INSERT TO authenticated WITH CHECK (public.can_access_ceb(ceb_id));
    OR lower(coalesce(email_login_secretaria, '')) = public.current_auth_email()
  FOR UPDATE TO authenticated
  USING (public.can_access_ceb(ceb_id))
  WITH CHECK (public.can_access_ceb(ceb_id));
  WITH CHECK (
  FOR DELETE TO authenticated USING (public.can_access_ceb(ceb_id));
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
  FOR SELECT TO authenticated USING (public.can_access_alerta(paroquia_id, ceb_id));
    OR lower(email) = public.current_auth_email()
  FOR INSERT TO authenticated WITH CHECK (public.can_access_alerta(paroquia_id, ceb_id));
  );
  FOR UPDATE TO authenticated
  USING (public.can_access_alerta(paroquia_id, ceb_id))
  WITH CHECK (public.can_access_alerta(paroquia_id, ceb_id));
  FOR DELETE TO authenticated
  FOR DELETE TO authenticated USING (public.can_access_alerta(paroquia_id, ceb_id));

DROP TRIGGER IF EXISTS trg_alertas_validate_paroquia_ceb_consistency ON public.alertas_percentuais;
CREATE TRIGGER trg_alertas_validate_paroquia_ceb_consistency
  BEFORE INSERT OR UPDATE ON public.alertas_percentuais
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_alerta_paroquia_ceb_consistency();
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR lower(email) = public.current_auth_email()
    OR lower(coalesce(email_login_secretaria, '')) = public.current_auth_email()
  );

DROP POLICY IF EXISTS configuracoes_paroquias_select_auth ON public.configuracoes_paroquias;
DROP POLICY IF EXISTS configuracoes_paroquias_insert_auth ON public.configuracoes_paroquias;
DROP POLICY IF EXISTS configuracoes_paroquias_update_auth ON public.configuracoes_paroquias;
DROP POLICY IF EXISTS configuracoes_paroquias_delete_auth ON public.configuracoes_paroquias;
CREATE POLICY configuracoes_paroquias_select_auth ON public.configuracoes_paroquias
  FOR SELECT TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );
CREATE POLICY configuracoes_paroquias_insert_auth ON public.configuracoes_paroquias
  FOR INSERT TO authenticated
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );
CREATE POLICY configuracoes_paroquias_update_auth ON public.configuracoes_paroquias
  FOR UPDATE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  )
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );
CREATE POLICY configuracoes_paroquias_delete_auth ON public.configuracoes_paroquias
  FOR DELETE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );

DROP POLICY IF EXISTS cebs_select_auth ON public.cebs;
DROP POLICY IF EXISTS cebs_insert_auth ON public.cebs;
DROP POLICY IF EXISTS cebs_update_auth ON public.cebs;
DROP POLICY IF EXISTS cebs_delete_auth ON public.cebs;
CREATE POLICY cebs_select_auth ON public.cebs
  FOR SELECT TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR lower(coalesce(email_login, '')) = public.current_auth_email()
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );
CREATE POLICY cebs_insert_auth ON public.cebs
  FOR INSERT TO authenticated
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );
CREATE POLICY cebs_update_auth ON public.cebs
  FOR UPDATE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR lower(coalesce(email_login, '')) = public.current_auth_email()
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  )
  WITH CHECK (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR lower(coalesce(email_login, '')) = public.current_auth_email()
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );
CREATE POLICY cebs_delete_auth ON public.cebs
  FOR DELETE TO authenticated
  USING (
    exists (
      select 1
      from public.administradores a
      where lower(a.email) = public.current_auth_email()
    )
    OR lower(coalesce(email_login, '')) = public.current_auth_email()
    OR exists (
      select 1
      from public.paroquias p
      where p.id = paroquia_id
        and (
          lower(p.email) = public.current_auth_email()
          OR lower(coalesce(p.email_login_secretaria, '')) = public.current_auth_email()
        )
    )
  );

-- pastorais_movimentos (leitura para todos autenticados)
CREATE POLICY pastorais_select_auth ON public.pastorais_movimentos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY pastorais_insert_auth ON public.pastorais_movimentos
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY pastorais_update_auth ON public.pastorais_movimentos
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY pastorais_delete_auth ON public.pastorais_movimentos
  FOR DELETE TO authenticated USING (true);

-- dizimistas
CREATE POLICY dizimistas_select_auth ON public.dizimistas
  FOR SELECT TO authenticated
  USING (exists (select 1 from public.cebs c where c.id = ceb_id and (
    lower(coalesce(c.email_login,'')) = public.current_auth_email()
    OR exists (select 1 from public.paroquias p where p.id = c.paroquia_id and (
      lower(p.email) = public.current_auth_email()
      OR lower(coalesce(p.email_login_secretaria,'')) = public.current_auth_email()))
    OR exists (select 1 from public.administradores a where lower(a.email) = public.current_auth_email())
  )));
CREATE POLICY dizimistas_insert_auth ON public.dizimistas
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY dizimistas_update_auth ON public.dizimistas
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY dizimistas_delete_auth ON public.dizimistas
  FOR DELETE TO authenticated USING (true);

-- doacoes
CREATE POLICY doacoes_select_auth ON public.doacoes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY doacoes_insert_auth ON public.doacoes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY doacoes_update_auth ON public.doacoes
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY doacoes_delete_auth ON public.doacoes
  FOR DELETE TO authenticated USING (true);

-- conselheiros_comunitarios
CREATE POLICY conselheiros_select_auth ON public.conselheiros_comunitarios
  FOR SELECT TO authenticated USING (true);
CREATE POLICY conselheiros_insert_auth ON public.conselheiros_comunitarios
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY conselheiros_update_auth ON public.conselheiros_comunitarios
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY conselheiros_delete_auth ON public.conselheiros_comunitarios
  FOR DELETE TO authenticated USING (true);

-- alertas_percentuais
CREATE POLICY alertas_select_auth ON public.alertas_percentuais
  FOR SELECT TO authenticated USING (true);
CREATE POLICY alertas_insert_auth ON public.alertas_percentuais
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY alertas_update_auth ON public.alertas_percentuais
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY alertas_delete_auth ON public.alertas_percentuais
  FOR DELETE TO authenticated USING (true);