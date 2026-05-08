import { v4 as uuid } from 'uuid';
import { storageGet, storageSet, KEYS } from './storage';
import type {
  Administrador, Paroquia, ConfiguracaoParoquia, CEB, PastoralMovimento,
  Dizimista, Doacao, ConselheiroComunitario,
} from '../types';

const now = new Date().toISOString();

const PASTORAIS_DEFAULT: PastoralMovimento[] = [
  { id: uuid(), nome: 'Coordenador Comunitário', tipo: 'movimento', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Tesoureiro', tipo: 'movimento', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Secretário', tipo: 'movimento', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Pastoral do Dízimo', tipo: 'pastoral', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Pastoral da Liturgia', tipo: 'pastoral', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Pastoral do Canto/Litúrgica Musical', tipo: 'pastoral', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Pastoral dos Coroinhas', tipo: 'pastoral', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Pastoral dos Acólitos', tipo: 'pastoral', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Pastoral dos Leitores', tipo: 'pastoral', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Pastoral da Acolhida', tipo: 'pastoral', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Pastoral da Comunicação (PASCOM)', tipo: 'pastoral', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Pastoral do Batismo', tipo: 'pastoral', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Pastoral da Crisma', tipo: 'pastoral', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Pastoral da Catequese', tipo: 'pastoral', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Pastoral Familiar', tipo: 'pastoral', status: 'ativo', createdAt: now, updatedAt: now },
  { id: uuid(), nome: 'Pastoral Matrimonial', tipo: 'pastoral', status: 'ativo', createdAt: now, updatedAt: now },
];

export function seedInitialData() {
  // Only seed if empty
  if (storageGet(KEYS.ADMIN).length > 0) return;

  const adminId = uuid();
  const admin: Administrador = {
    id: adminId,
    nome: 'Administrador',
    email: 'admin@dizimo.com',
    senha: 'admin123',
    status: 'ativo',
    createdAt: now,
    updatedAt: now,
  };
  storageSet(KEYS.ADMIN, [admin]);

  // Seed pastorais
  if (storageGet(KEYS.PASTORAIS).length === 0) {
    storageSet(KEYS.PASTORAIS, PASTORAIS_DEFAULT);
  }

  // Seed demo paróquia
  const paroquiaId = uuid();
  const paroquia: Paroquia = {
    id: paroquiaId,
    administradorCriouId: adminId,
    codigoParoquia: '001',
    nome: 'Nossa Senhora das Graças',
    email: 'paroquia@nsgraças.com.br',
    telefone: '(27) 3522-1234',
    endereco: 'Rua das Flores, 100 - Centro, Cachoeiro de Itapemirim - ES',
    fundacao: '1950-05-13',
    cnpj: '12.345.678/0001-90',
    parocoNome: 'Pe. João da Silva',
    emailLoginSecretaria: 'secretaria@nsgraças.com.br',
    senha: 'paroquia123',
    status: 'ativa',
    createdAt: now,
    updatedAt: now,
  };
  storageSet(KEYS.PAROQUIAS, [paroquia]);

  // Seed configuração
  const configId = uuid();
  const config: ConfiguracaoParoquia = {
    id: configId,
    paroquiaId,
    percentualDizimoCebs: 30,
    percentualOfertaCebs: 20,
    percentualCuriaDiocesana: 5,
    percentualDiocese: 10,
    vigenteDesde: '2024-01-01',
    ativa: true,
    createdAt: now,
    updatedAt: now,
  };
  storageSet(KEYS.CONFIGURACOES, [config]);

  // Seed 3 CEBs
  const cebs: CEB[] = [
    {
      id: uuid(), paroquiaId, codigoCeb: 'CEB-001', nome: 'CEB São José',
      emailLogin: 'saojose@ceb.com', senha: 'ceb123', telefone: '(27) 99901-1111',
      status: 'ativa', createdAt: now, updatedAt: now,
    },
    {
      id: uuid(), paroquiaId, codigoCeb: 'CEB-002', nome: 'CEB Santa Maria',
      emailLogin: 'santamaria@ceb.com', senha: 'ceb123', telefone: '(27) 99902-2222',
      status: 'ativa', createdAt: now, updatedAt: now,
    },
    {
      id: uuid(), paroquiaId, codigoCeb: 'CEB-003', nome: 'CEB São Francisco',
      emailLogin: 'saofrancisco@ceb.com', senha: 'ceb123', telefone: '(27) 99903-3333',
      status: 'ativa', createdAt: now, updatedAt: now,
    },
  ];
  storageSet(KEYS.CEBS, cebs);

  // Seed dizimistas para primeira CEB
  const firstCebId = cebs[0].id;
  const dizimistasNomes = [
    'Maria Aparecida Santos', 'João Carlos Oliveira', 'Ana Paula Ferreira',
    'Pedro Henrique Costa', 'Francisca Lima Silva', 'José Roberto Souza',
    'Antônia Carvalho Dias', 'Manuel Pereira Nunes', 'Raimunda Alves Rocha',
    'Luiz Fernando Melo',
  ];
  const dizimistas: Dizimista[] = dizimistasNomes.map((nome, i) => ({
    id: uuid(), cebId: firstCebId, nome,
    telefone: `(27) 9990${i}-${1000 + i}`,
    email: i % 3 === 0 ? `dizimista${i}@email.com` : undefined,
    endereco: `Rua ${i + 1}, Nº ${(i + 1) * 10} - Bairro ${i % 2 === 0 ? 'São José' : 'Santa Maria'}`,
    dataNascimento: `${1960 + i}-0${(i % 9) + 1}-${10 + i}`,
    status: 'ativo', createdAt: now, updatedAt: now,
  }));
  storageSet(KEYS.DIZIMISTAS, dizimistas);

  // Seed conselheiro
  const pastorais = PASTORAIS_DEFAULT;
  const conselheiros: ConselheiroComunitario[] = [
    {
      id: uuid(), cebId: firstCebId,
      pastoralMovimentoId: pastorais[0].id,
      nome: 'Cláudio Menezes', telefone: '(27) 99905-5555',
      email: 'claudio@email.com', cargo: 'Coordenador Comunitário',
      status: 'ativo', createdAt: now, updatedAt: now,
    },
    {
      id: uuid(), cebId: firstCebId,
      pastoralMovimentoId: pastorais[1].id,
      nome: 'Berenice Teixeira', telefone: '(27) 99906-6666',
      email: 'berenice@email.com', cargo: 'Tesoureira',
      status: 'ativo', createdAt: now, updatedAt: now,
    },
  ];
  storageSet(KEYS.CONSELHEIROS, conselheiros);

  // Seed donations for last 6 months
  const doacoes: Doacao[] = [];
  const tipos: ('dizimo' | 'oferta' | 'doacao')[] = ['dizimo', 'oferta', 'doacao'];
  const formas: ('dinheiro' | 'pix' | 'transferencia')[] = ['dinheiro', 'pix', 'transferencia'];
  const currentDate = new Date();

  cebs.forEach((ceb) => {
    for (let m = 0; m < 6; m++) {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - m);
      const mes = d.getMonth() + 1;
      const ano = d.getFullYear();

      // 5-10 donations per month per CEB
      const count = 5 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const tipo = tipos[i % 3];
        const valor = tipo === 'dizimo'
          ? 50 + Math.random() * 200
          : tipo === 'oferta'
            ? 20 + Math.random() * 100
            : 10 + Math.random() * 50;

        doacoes.push({
          id: uuid(),
          cebId: ceb.id,
          dizimistaId: i < dizimistas.length && ceb.id === firstCebId ? dizimistas[i].id : undefined,
          valor: Math.round(valor * 100) / 100,
          competenciaMes: mes,
          competenciaAno: ano,
          tipoDoacao: tipo,
          formaPagamento: formas[i % 3],
          dataLancamento: d.toISOString().split('T')[0],
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  });
  storageSet(KEYS.DOACOES, doacoes);
}
