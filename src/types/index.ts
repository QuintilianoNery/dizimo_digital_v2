export type UserRole = 'admin' | 'paroquial' | 'ceb';
export type Status = 'ativo' | 'inativo' | 'ativa' | 'inativa';

export interface Administrador {
  id: string;
  nome: string;
  email: string;
  senha: string;
  logoUrl?: string;
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
}

export interface Paroquia {
  id: string;
  administradorCriouId?: string;
  codigoParoquia: string;
  logoUrl?: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  fundacao: string;
  cnpj: string;
  parocoNome: string;
  emailLoginSecretaria: string;
  senha: string;
  status: 'ativa' | 'inativa';
  createdAt: string;
  updatedAt: string;
}

export interface ConfiguracaoParoquia {
  id: string;
  paroquiaId: string;
  percentualDizimoCebs: number;
  percentualOfertaCebs: number;
  percentualCuriaDiocesana: number;
  percentualDiocese: number;
  vigenteDesde: string;
  vigenteAte?: string;
  ativa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CEB {
  id: string;
  paroquiaId: string;
  codigoCeb: string;
  logoUrl?: string;
  nome: string;
  emailLogin: string;
  senha: string;
  telefone: string;
  status: 'ativa' | 'inativa';
  createdAt: string;
  updatedAt: string;
}

export interface PastoralMovimento {
  id: string;
  nome: string;
  tipo: 'pastoral' | 'movimento';
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
}

export interface ConselheiroComunitario {
  id: string;
  cebId: string;
  pastoralMovimentoId?: string;
  nome: string;
  telefone: string;
  email: string;
  cargo: string;
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
}

export interface Dizimista {
  id: string;
  cebId: string;
  nome: string;
  telefone: string;
  email?: string;
  endereco: string;
  dataNascimento: string;
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
}

export interface Doacao {
  id: string;
  cebId: string;
  dizimistaId?: string;
  valor: number;
  competenciaMes: number;
  competenciaAno: number;
  tipoDoacao: 'dizimo' | 'oferta' | 'doacao';
  formaPagamento: 'dinheiro' | 'pix' | 'transferencia';
  observacoes?: string;
  dataLancamento: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertaPercentual {
  id: string;
  paroquiaId: string;
  cebId: string;
  configuracaoParoquiaId: string;
  percentualDizimoAnterior: number;
  percentualDizimoNovo: number;
  percentualOfertaAnterior: number;
  percentualOfertaNovo: number;
  mensagem: string;
  lidoEm?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  role: UserRole;
  email?: string;
  paroquiaId?: string;
  cebId?: string;
  adminId?: string;
  nome?: string;
  sessionStartedAt?: string;
  sessionExpiresAt?: string;
}

export interface DashboardStats {
  totalDizimo: number;
  totalOferta: number;
  totalDoacao: number;
  totalArrecadado: number;
  totalRepasse: number;
  repasseDizimo: number;
  repasseOferta: number;
}

export interface FiltrosPeriodo {
  mes?: number;
  ano: number;
  tipo: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  cebId?: string;
}
