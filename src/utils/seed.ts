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

type DemoCebSeed = {
  codigoCeb: string;
  nome: string;
  emailLogin: string;
  senha: string;
  telefone: string;
  dizimistas: string[];
};

type DemoParoquiaSeed = {
  codigoParoquia: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  fundacao: string;
  cnpj: string;
  parocoNome: string;
  emailLoginSecretaria: string;
  senha: string;
  percentualDizimoCebs: number;
  percentualOfertaCebs: number;
  cebs: DemoCebSeed[];
};

const DEMO_PAROQUIAS: DemoParoquiaSeed[] = [
  {
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
    percentualDizimoCebs: 30,
    percentualOfertaCebs: 20,
    cebs: [
      {
        codigoCeb: 'CEB-001',
        nome: 'CEB São José',
        emailLogin: 'saojose@ceb.com',
        senha: 'ceb123',
        telefone: '(27) 99901-1111',
        dizimistas: ['Pedro Costa', 'Ana Silva', 'Carlos Santos'],
      },
      {
        codigoCeb: 'CEB-002',
        nome: 'CEB Santa Maria',
        emailLogin: 'santamaria@ceb.com',
        senha: 'ceb123',
        telefone: '(27) 99902-2222',
        dizimistas: ['Juliana Oliveira', 'Marcos Lima', 'Fernanda Souza'],
      },
      {
        codigoCeb: 'CEB-003',
        nome: 'CEB São Francisco',
        emailLogin: 'saofrancisco@ceb.com',
        senha: 'ceb123',
        telefone: '(27) 99903-3333',
        dizimistas: ['Paulo Mendes', 'Carla Ribeiro', 'Roberto Almeida'],
      },
    ],
  },
  {
    codigoParoquia: '002',
    nome: 'São Felipe',
    email: 'paroquia@saofelipe.com.br',
    telefone: '(27) 3555-2026',
    endereco: 'Avenida São Felipe, 50 - Centro, São Felipe - ES',
    fundacao: '1968-08-10',
    cnpj: '98.765.432/0001-10',
    parocoNome: 'Pe. Antônio Rodrigues',
    emailLoginSecretaria: 'secretaria@saofelipe.com.br',
    senha: 'paroquia123',
    percentualDizimoCebs: 35,
    percentualOfertaCebs: 25,
    cebs: [
      {
        codigoCeb: 'CEB-004',
        nome: 'CEB São Felipe I',
        emailLogin: 'saofelipe1@ceb.com',
        senha: 'ceb123',
        telefone: '(27) 99904-4444',
        dizimistas: ['Luciana Nogueira', 'Thiago Pereira', 'Renata Barros'],
      },
      {
        codigoCeb: 'CEB-005',
        nome: 'CEB São Felipe II',
        emailLogin: 'saofelipe2@ceb.com',
        senha: 'ceb123',
        telefone: '(27) 99905-5555',
        dizimistas: ['Felipe Costa', 'Sonia Martins', 'Eduardo Rocha'],
      },
    ],
  },
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

  const paroquias: Paroquia[] = [];
  const configuracoes: ConfiguracaoParoquia[] = [];
  const cebs: CEB[] = [];
  const dizimistas: Dizimista[] = [];
  const dizimistasPorCeb = new Map<string, Dizimista[]>();

  DEMO_PAROQUIAS.forEach((demoParoquia) => {
    const paroquiaId = uuid();

    paroquias.push({
      id: paroquiaId,
      administradorCriouId: adminId,
      codigoParoquia: demoParoquia.codigoParoquia,
      nome: demoParoquia.nome,
      email: demoParoquia.email,
      telefone: demoParoquia.telefone,
      endereco: demoParoquia.endereco,
      fundacao: demoParoquia.fundacao,
      cnpj: demoParoquia.cnpj,
      parocoNome: demoParoquia.parocoNome,
      emailLoginSecretaria: demoParoquia.emailLoginSecretaria,
      senha: demoParoquia.senha,
      status: 'ativa',
      createdAt: now,
      updatedAt: now,
    });

    configuracoes.push({
      id: uuid(),
      paroquiaId,
      percentualDizimoCebs: demoParoquia.percentualDizimoCebs,
      percentualOfertaCebs: demoParoquia.percentualOfertaCebs,
      percentualCuriaDiocesana: 5,
      percentualDiocese: 10,
      vigenteDesde: '2024-01-01',
      ativa: true,
      createdAt: now,
      updatedAt: now,
    });

    demoParoquia.cebs.forEach((demoCeb) => {
      const cebId = uuid();
      const ceb: CEB = {
        id: cebId,
        paroquiaId,
        codigoCeb: demoCeb.codigoCeb,
        nome: demoCeb.nome,
        emailLogin: demoCeb.emailLogin,
        senha: demoCeb.senha,
        telefone: demoCeb.telefone,
        status: 'ativa',
        createdAt: now,
        updatedAt: now,
      };

      cebs.push(ceb);

      const cebDizimistas: Dizimista[] = [];
      demoCeb.dizimistas.forEach((nome, index) => {
        cebDizimistas.push({
          id: uuid(),
          cebId,
          nome,
          telefone: `(27) 999${String(index + 1).padStart(2, '0')}-10${index}${index}`,
          email: index % 2 === 0 ? `dizimista-${demoCeb.codigoCeb.toLowerCase()}-${index + 1}@email.com` : undefined,
          endereco: `Rua ${index + 1}, Nº ${(index + 1) * 10} - ${demoCeb.nome}`,
          dataNascimento: `${1975 + index}-0${index + 1}-1${index}`,
          status: 'ativo',
          createdAt: now,
          updatedAt: now,
        });
      });

      dizimistas.push(...cebDizimistas);
      dizimistasPorCeb.set(cebId, cebDizimistas);
    });
  });

  storageSet(KEYS.PAROQUIAS, paroquias);
  storageSet(KEYS.CONFIGURACOES, configuracoes);
  storageSet(KEYS.CEBS, cebs);
  storageSet(KEYS.DIZIMISTAS, dizimistas);

  // Seed conselheiro
  const pastorais = PASTORAIS_DEFAULT;
  const firstCebId = cebs[0].id;
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

  // Seed 5 movimentações por CEB, com 3 dizimistas em cada uma
  const doacoes: Doacao[] = [];
  const formas: ('dinheiro' | 'pix' | 'transferencia')[] = ['dinheiro', 'pix', 'transferencia'];
  const seedYear = new Date().getFullYear();

  cebs.forEach((ceb) => {
    const cebDizimistas = dizimistasPorCeb.get(ceb.id) ?? [];

    for (let movimento = 0; movimento < 5; movimento++) {
      const competenciaMes = movimento + 1;

      cebDizimistas.forEach((dizimista, index) => {
        doacoes.push({
          id: uuid(),
          cebId: ceb.id,
          dizimistaId: dizimista.id,
          valor: 80 + (movimento * 15) + (index * 10),
          competenciaMes,
          competenciaAno: seedYear,
          tipoDoacao: 'dizimo',
          formaPagamento: formas[(movimento + index) % formas.length],
          observacoes: `Movimentação ${movimento + 1} - ${ceb.nome}`,
          dataLancamento: new Date(seedYear, competenciaMes - 1, 10 + index).toISOString().split('T')[0],
          createdAt: now,
          updatedAt: now,
        });
      });
    }
  });
  storageSet(KEYS.DOACOES, doacoes);
}
