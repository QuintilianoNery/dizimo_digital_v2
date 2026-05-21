// ============================================================================
// TIPOS DO BANCO DE DADOS - Gerados a partir do schema Supabase
// ============================================================================

export type StatusAdmin = 'ativo' | 'inativo';
export type StatusParoquia = 'ativa' | 'inativa';
export type StatusCeb = 'ativa' | 'inativa';
export type StatusPessoa = 'ativo' | 'inativo';
export type TipoPastoral = 'pastoral' | 'movimento';
export type TipoDoacao = 'dizimo' | 'oferta' | 'doacao';
export type FormaPagamento = 'dinheiro' | 'pix' | 'transferencia';

export interface Administrador {
  id: string;
  nome: string;
  email: string;
  logo_url: string | null;
  status: StatusAdmin;
  created_at: string;
  updated_at: string;
}

export interface Paroquia {
  id: string;
  administrador_criou_id: string;
  codigo_paroquia: string;
  logo_url: string | null;
  nome: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
  fundacao: string | null;
  cnpj: string | null;
  paroco_nome: string | null;
  email_login_secretaria: string | null;
  status: StatusParoquia;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracaoParoquia {
  id: string;
  paroquia_id: string;
  percentual_dizimo_cebs: number;
  percentual_oferta_cebs: number;
  percentual_curia_diocesana: number;
  percentual_diocese: number;
  vigente_desde: string;
  vigente_ate: string | null;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ceb {
  id: string;
  paroquia_id: string;
  codigo_ceb: string;
  logo_url: string | null;
  nome: string;
  email_login: string | null;
  telefone: string | null;
  status: StatusCeb;
  created_at: string;
  updated_at: string;
}

export interface PastoralMovimento {
  id: string;
  nome: string;
  tipo: TipoPastoral;
  status: StatusPessoa;
  created_at: string;
  updated_at: string;
}

export interface ConselheiroComunitario {
  id: string;
  ceb_id: string;
  pastoral_movimento_id: string | null;
  nome: string;
  telefone: string | null;
  email: string | null;
  cargo: string | null;
  status: StatusPessoa;
  created_at: string;
  updated_at: string;
  // Joins opcionais
  pastorais_movimentos?: PastoralMovimento;
  cebs?: Pick<Ceb, 'id' | 'nome'>;
}

export interface Dizimista {
  id: string;
  ceb_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  data_nascimento: string | null;
  status: StatusPessoa;
  created_at: string;
  updated_at: string;
  // Joins opcionais
  cebs?: Pick<Ceb, 'id' | 'nome'>;
}

export interface Doacao {
  id: string;
  ceb_id: string;
  dizimista_id: string | null;
  valor: number;
  competencia_mes: number;
  competencia_ano: number;
  tipo_doacao: TipoDoacao;
  forma_pagamento: FormaPagamento;
  observacoes: string | null;
  data_lancamento: string;
  created_at: string;
  updated_at: string;
  // Joins opcionais
  dizimistas?: Pick<Dizimista, 'id' | 'nome'>;
  cebs?: Pick<Ceb, 'id' | 'nome'>;
}

export interface AlertaPercentual {
  id: string;
  paroquia_id: string;
  ceb_id: string;
  configuracao_paroquia_id: string;
  percentual_dizimo_anterior: number | null;
  percentual_dizimo_novo: number | null;
  percentual_oferta_anterior: number | null;
  percentual_oferta_novo: number | null;
  mensagem: string;
  lido_em: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TIPO PARA SUPABASE CLIENT GENÉRICO
// ============================================================================
export interface Database {
  public: {
    Tables: {
      administradores: { Row: Administrador; Insert: Omit<Administrador, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Administrador, 'id' | 'created_at'>> };
      paroquias: { Row: Paroquia; Insert: Omit<Paroquia, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Paroquia, 'id' | 'created_at'>> };
      configuracoes_paroquias: { Row: ConfiguracaoParoquia; Insert: Omit<ConfiguracaoParoquia, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<ConfiguracaoParoquia, 'id' | 'created_at'>> };
      cebs: { Row: Ceb; Insert: Omit<Ceb, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Ceb, 'id' | 'created_at'>> };
      pastorais_movimentos: { Row: PastoralMovimento; Insert: Omit<PastoralMovimento, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<PastoralMovimento, 'id' | 'created_at'>> };
      conselheiros_comunitarios: { Row: ConselheiroComunitario; Insert: Omit<ConselheiroComunitario, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<ConselheiroComunitario, 'id' | 'created_at'>> };
      dizimistas: { Row: Dizimista; Insert: Omit<Dizimista, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Dizimista, 'id' | 'created_at'>> };
      doacoes: { Row: Doacao; Insert: Omit<Doacao, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Doacao, 'id' | 'created_at'>> };
      alertas_percentuais: { Row: AlertaPercentual; Insert: Omit<AlertaPercentual, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<AlertaPercentual, 'id' | 'created_at'>> };
    };
    Enums: {
      status_admin: StatusAdmin;
      status_paroquia: StatusParoquia;
      status_ceb: StatusCeb;
      status_pessoa: StatusPessoa;
      tipo_pastoral: TipoPastoral;
      tipo_doacao: TipoDoacao;
      forma_pagamento: FormaPagamento;
    };
  };
}
