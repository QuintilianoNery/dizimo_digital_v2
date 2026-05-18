import React, { createContext, useContext, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import {
  storageGet, storageSave, storageDelete, storageFilter, storageSet, KEYS,
} from '../utils/storage';
import type {
  Paroquia, CEB, ConfiguracaoParoquia, PastoralMovimento,
  ConselheiroComunitario, Dizimista, Doacao, AlertaPercentual, Administrador,
} from '../types';

interface DataContextType {
  // Paróquias
  getParoquias: () => Paroquia[];
  saveParoquia: (p: Partial<Paroquia> & { nome: string }) => Paroquia;
  deleteParoquia: (id: string) => void;
  getParoquia: (id: string) => Paroquia | null;

  // Configurações
  getConfiguracaoVigente: (paroquiaId: string) => ConfiguracaoParoquia | null;
  getConfiguracoes: (paroquiaId: string) => ConfiguracaoParoquia[];
  saveConfiguracao: (c: Partial<ConfiguracaoParoquia> & { paroquiaId: string }) => ConfiguracaoParoquia;

  // CEBs
  getCEBs: (paroquiaId: string) => CEB[];
  getCEB: (id: string) => CEB | null;
  saveCEB: (c: Partial<CEB> & { paroquiaId: string; nome: string }) => CEB;
  deleteCEB: (id: string) => void;

  // Pastorais
  getPastorais: () => PastoralMovimento[];
  savePastoral: (p: Partial<PastoralMovimento> & { nome: string }) => PastoralMovimento;
  deletePastoral: (id: string) => void;

  // Conselheiros
  getConselheiros: (cebId: string) => ConselheiroComunitario[];
  saveConselheiro: (c: Partial<ConselheiroComunitario> & { cebId: string; nome: string }) => ConselheiroComunitario;
  deleteConselheiro: (id: string) => void;

  // Dizimistas
  getDizimistas: (cebId: string) => Dizimista[];
  saveDizimista: (d: Partial<Dizimista> & { cebId: string; nome: string }) => Dizimista;
  deleteDizimista: (id: string) => void;

  // Doações
  getDoacoes: (cebId?: string) => Doacao[];
  getDoacoesParoquia: (paroquiaId: string) => Doacao[];
  saveDoacao: (d: Partial<Doacao> & { cebId: string; valor: number }) => Doacao;
  deleteDoacao: (id: string) => void;

  // Alertas
  getAlertas: (cebId: string) => AlertaPercentual[];
  marcarAlertaLido: (id: string) => void;
  getAdministrador: () => Administrador | null;
  updateAdministrador: (emailAtual: string, senhaAtual: string, updates: { nome?: string; email?: string; logoUrl?: string; senhaNova?: string }) => string | null;
  updateAdminSenha: (email: string, senhaAtual: string, senhaNova: string) => string | null;
  updateParoquiaConta: (paroquiaId: string, senhaAtual: string, updates: { logoUrl?: string; senhaNova?: string }) => string | null;
  updateCEBConta: (cebId: string, senhaAtual: string, updates: { logoUrl?: string; senhaNova?: string }) => string | null;
  resetSenhaParoquia: (paroquiaId: string, senhaNova: string) => void;
  resetSenhaCEB: (cebId: string, senhaNova: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const now = () => new Date().toISOString();

  const getParoquias = useCallback(() => storageGet<Paroquia>(KEYS.PAROQUIAS), []);
  const getParoquia = useCallback(
    (id: string) => storageGet<Paroquia>(KEYS.PAROQUIAS).find((p) => p.id === id) ?? null,
    [],
  );

  const saveParoquia = useCallback((data: Partial<Paroquia> & { nome: string }): Paroquia => {
    const existing = data.id ? storageGet<Paroquia>(KEYS.PAROQUIAS).find((p) => p.id === data.id) : null;
    const p: Paroquia = {
      id: data.id ?? uuid(),
      administradorCriouId: data.administradorCriouId,
      codigoParoquia: data.codigoParoquia ?? String(Date.now()).slice(-4),
      logoUrl: data.logoUrl,
      nome: data.nome,
      email: data.email ?? '',
      telefone: data.telefone ?? '',
      endereco: data.endereco ?? '',
      fundacao: data.fundacao ?? '',
      cnpj: data.cnpj ?? '',
      parocoNome: data.parocoNome ?? '',
      emailLoginSecretaria: data.emailLoginSecretaria ?? '',
      senha: data.senha ?? existing?.senha ?? '',
      status: data.status ?? 'ativa',
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    };
    storageSave(KEYS.PAROQUIAS, p);
    return p;
  }, []);

  const deleteParoquia = useCallback((id: string) => storageDelete(KEYS.PAROQUIAS, id), []);

  const getConfiguracaoVigente = useCallback((paroquiaId: string): ConfiguracaoParoquia | null => {
    const configs = storageFilter<ConfiguracaoParoquia>(
      KEYS.CONFIGURACOES,
      (c) => c.paroquiaId === paroquiaId && c.ativa,
    );
    return configs.sort((a, b) => b.vigenteDesde.localeCompare(a.vigenteDesde))[0] ?? null;
  }, []);

  const getConfiguracoes = useCallback(
    (paroquiaId: string) =>
      storageFilter<ConfiguracaoParoquia>(KEYS.CONFIGURACOES, (c) => c.paroquiaId === paroquiaId)
        .sort((a, b) => b.vigenteDesde.localeCompare(a.vigenteDesde)),
    [],
  );

  const saveConfiguracao = useCallback(
    (data: Partial<ConfiguracaoParoquia> & { paroquiaId: string }): ConfiguracaoParoquia => {
      // Deactivate previous config
      if (!data.id) {
        const all = storageGet<ConfiguracaoParoquia>(KEYS.CONFIGURACOES);
        const updated = all.map((c) =>
          c.paroquiaId === data.paroquiaId && c.ativa
            ? { ...c, ativa: false, vigenteAte: new Date().toISOString().split('T')[0], updatedAt: now() }
            : c,
        );
        storageSet(KEYS.CONFIGURACOES, updated);
      }

      const c: ConfiguracaoParoquia = {
        id: data.id ?? uuid(),
        paroquiaId: data.paroquiaId,
        percentualDizimoCebs: data.percentualDizimoCebs ?? 0,
        percentualOfertaCebs: data.percentualOfertaCebs ?? 0,
        percentualCuriaDiocesana: data.percentualCuriaDiocesana ?? 0,
        percentualDiocese: data.percentualDiocese ?? 0,
        vigenteDesde: data.vigenteDesde ?? new Date().toISOString().split('T')[0],
        vigenteAte: data.vigenteAte,
        ativa: true,
        createdAt: now(),
        updatedAt: now(),
      };
      storageSave(KEYS.CONFIGURACOES, c);

      // Generate alerts for all CEBs
      if (!data.id) {
        const cebs = storageFilter<CEB>(KEYS.CEBS, (cb) => cb.paroquiaId === data.paroquiaId);
        cebs.forEach((ceb) => {
          const alerta: AlertaPercentual = {
            id: uuid(),
            paroquiaId: data.paroquiaId,
            cebId: ceb.id,
            configuracaoParoquiaId: c.id,
            percentualDizimoAnterior: data.percentualDizimoCebs ?? 0,
            percentualDizimoNovo: data.percentualDizimoCebs ?? 0,
            percentualOfertaAnterior: data.percentualOfertaCebs ?? 0,
            percentualOfertaNovo: data.percentualOfertaCebs ?? 0,
            mensagem: `Os percentuais de repasse foram atualizados pela paróquia. Dízimo: ${data.percentualDizimoCebs}% | Oferta: ${data.percentualOfertaCebs}%`,
            createdAt: now(),
            updatedAt: now(),
          };
          storageSave(KEYS.ALERTAS, alerta);
        });
      }
      return c;
    },
    [],
  );

  const getCEBs = useCallback(
    (paroquiaId: string) =>
      storageFilter<CEB>(KEYS.CEBS, (c) => c.paroquiaId === paroquiaId),
    [],
  );
  const getCEB = useCallback(
    (id: string) => storageGet<CEB>(KEYS.CEBS).find((c) => c.id === id) ?? null,
    [],
  );

  const saveCEB = useCallback(
    (data: Partial<CEB> & { paroquiaId: string; nome: string }): CEB => {
      const existing = data.id ? storageGet<CEB>(KEYS.CEBS).find((c) => c.id === data.id) : null;
      const c: CEB = {
        id: data.id ?? uuid(),
        paroquiaId: data.paroquiaId,
        codigoCeb: data.codigoCeb ?? `CEB-${String(Date.now()).slice(-4)}`,
        logoUrl: data.logoUrl,
        nome: data.nome,
        emailLogin: data.emailLogin ?? '',
        senha: data.senha ?? existing?.senha ?? '',
        telefone: data.telefone ?? '',
        status: data.status ?? 'ativa',
        createdAt: existing?.createdAt ?? now(),
        updatedAt: now(),
      };
      storageSave(KEYS.CEBS, c);
      return c;
    },
    [],
  );
  const deleteCEB = useCallback((id: string) => storageDelete(KEYS.CEBS, id), []);

  const getPastorais = useCallback(() => storageGet<PastoralMovimento>(KEYS.PASTORAIS), []);
  const savePastoral = useCallback((data: Partial<PastoralMovimento> & { nome: string }): PastoralMovimento => {
    const existing = data.id
      ? storageGet<PastoralMovimento>(KEYS.PASTORAIS).find((p) => p.id === data.id)
      : null;
    const p: PastoralMovimento = {
      id: data.id ?? uuid(),
      nome: data.nome,
      tipo: data.tipo ?? 'pastoral',
      status: data.status ?? 'ativo',
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    };
    storageSave(KEYS.PASTORAIS, p);
    return p;
  }, []);
  const deletePastoral = useCallback((id: string) => storageDelete(KEYS.PASTORAIS, id), []);

  const getConselheiros = useCallback(
    (cebId: string) => storageFilter<ConselheiroComunitario>(KEYS.CONSELHEIROS, (c) => c.cebId === cebId),
    [],
  );
  const saveConselheiro = useCallback(
    (data: Partial<ConselheiroComunitario> & { cebId: string; nome: string }): ConselheiroComunitario => {
      const existing = data.id
        ? storageGet<ConselheiroComunitario>(KEYS.CONSELHEIROS).find((c) => c.id === data.id)
        : null;
      const c: ConselheiroComunitario = {
        id: data.id ?? uuid(),
        cebId: data.cebId,
        pastoralMovimentoId: data.pastoralMovimentoId,
        nome: data.nome,
        telefone: data.telefone ?? '',
        email: data.email ?? '',
        cargo: data.cargo ?? '',
        status: data.status ?? 'ativo',
        createdAt: existing?.createdAt ?? now(),
        updatedAt: now(),
      };
      storageSave(KEYS.CONSELHEIROS, c);
      return c;
    },
    [],
  );
  const deleteConselheiro = useCallback((id: string) => storageDelete(KEYS.CONSELHEIROS, id), []);

  const getDizimistas = useCallback(
    (cebId: string) => storageFilter<Dizimista>(KEYS.DIZIMISTAS, (d) => d.cebId === cebId),
    [],
  );
  const saveDizimista = useCallback(
    (data: Partial<Dizimista> & { cebId: string; nome: string }): Dizimista => {
      const existing = data.id
        ? storageGet<Dizimista>(KEYS.DIZIMISTAS).find((d) => d.id === data.id)
        : null;
      const d: Dizimista = {
        id: data.id ?? uuid(),
        cebId: data.cebId,
        nome: data.nome,
        telefone: data.telefone ?? '',
        email: data.email,
        endereco: data.endereco ?? '',
        dataNascimento: data.dataNascimento ?? '',
        status: data.status ?? 'ativo',
        createdAt: existing?.createdAt ?? now(),
        updatedAt: now(),
      };
      storageSave(KEYS.DIZIMISTAS, d);
      return d;
    },
    [],
  );
  const deleteDizimista = useCallback((id: string) => storageDelete(KEYS.DIZIMISTAS, id), []);

  const getDoacoes = useCallback(
    (cebId?: string) =>
      cebId
        ? storageFilter<Doacao>(KEYS.DOACOES, (d) => d.cebId === cebId)
        : storageGet<Doacao>(KEYS.DOACOES),
    [],
  );

  const getDoacoesParoquia = useCallback((paroquiaId: string) => {
    const cebs = storageFilter<CEB>(KEYS.CEBS, (c) => c.paroquiaId === paroquiaId);
    const cebIds = new Set(cebs.map((c) => c.id));
    return storageFilter<Doacao>(KEYS.DOACOES, (d) => cebIds.has(d.cebId));
  }, []);

  const saveDoacao = useCallback(
    (data: Partial<Doacao> & { cebId: string; valor: number }): Doacao => {
      const existing = data.id
        ? storageGet<Doacao>(KEYS.DOACOES).find((d) => d.id === data.id)
        : null;
      const today = new Date();
      const d: Doacao = {
        id: data.id ?? uuid(),
        cebId: data.cebId,
        dizimistaId: data.dizimistaId,
        valor: data.valor,
        competenciaMes: data.competenciaMes ?? today.getMonth() + 1,
        competenciaAno: data.competenciaAno ?? today.getFullYear(),
        tipoDoacao: data.tipoDoacao ?? 'dizimo',
        formaPagamento: data.formaPagamento ?? 'dinheiro',
        observacoes: data.observacoes,
        dataLancamento: data.dataLancamento ?? today.toISOString().split('T')[0],
        createdAt: existing?.createdAt ?? now(),
        updatedAt: now(),
      };
      storageSave(KEYS.DOACOES, d);
      return d;
    },
    [],
  );
  const deleteDoacao = useCallback((id: string) => storageDelete(KEYS.DOACOES, id), []);

  const getAlertas = useCallback(
    (cebId: string) =>
      storageFilter<AlertaPercentual>(KEYS.ALERTAS, (a) => a.cebId === cebId && !a.lidoEm)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [],
  );

  const marcarAlertaLido = useCallback((id: string) => {
    const alertas = storageGet<AlertaPercentual>(KEYS.ALERTAS);
    const updated = alertas.map((a) =>
      a.id === id ? { ...a, lidoEm: new Date().toISOString(), updatedAt: new Date().toISOString() } : a,
    );
    storageSet(KEYS.ALERTAS, updated);
  }, []);

  const getAdministrador = useCallback(
    () => storageGet<Administrador>(KEYS.ADMIN)[0] ?? null,
    [],
  );

  const updateAdministrador = useCallback(
    (emailAtual: string, senhaAtual: string, updates: { nome?: string; email?: string; logoUrl?: string; senhaNova?: string }): string | null => {
      const admins = storageGet<Administrador>(KEYS.ADMIN);
      const admin = admins[0];
      if (!admin) return 'Administrador não encontrado';
      const emailChanged = updates.email !== undefined && updates.email !== admin.email;
      const passwordChangeRequested = !!updates.senhaNova;
      // If changing email or password, require current credentials
      if (emailChanged || passwordChangeRequested) {
        if (admin.email !== emailAtual || admin.senha !== senhaAtual) {
          return 'Email ou senha atual incorretos';
        }
      }

      admins[0] = {
        ...admin,
        nome: updates.nome ?? admin.nome,
        email: updates.email ?? admin.email,
        logoUrl: updates.logoUrl ?? admin.logoUrl,
        senha: updates.senhaNova ?? admin.senha,
        updatedAt: new Date().toISOString(),
      };
      storageSet(KEYS.ADMIN, admins);
      return null;
    },
    [],
  );

  const updateAdminSenha = useCallback(
    (email: string, senhaAtual: string, senhaNova: string): string | null => {
      return updateAdministrador(email, senhaAtual, { senhaNova });
    },
    [updateAdministrador],
  );

  const updateParoquiaConta = useCallback(
    (paroquiaId: string, senhaAtual: string, updates: { logoUrl?: string; senhaNova?: string }): string | null => {
      const paroquias = storageGet<Paroquia>(KEYS.PAROQUIAS);
      const idx = paroquias.findIndex((p) => p.id === paroquiaId);
      if (idx < 0) return 'Paróquia não encontrada';
      const current = paroquias[idx];
      const passwordChangeRequested = !!updates.senhaNova;
      if (passwordChangeRequested) {
        if (current.senha !== senhaAtual) return 'Senha atual incorreta';
      }
      paroquias[idx] = {
        ...current,
        ...(updates.logoUrl !== undefined ? { logoUrl: updates.logoUrl } : {}),
        ...(updates.senhaNova ? { senha: updates.senhaNova } : {}),
        updatedAt: new Date().toISOString(),
      };
      storageSet(KEYS.PAROQUIAS, paroquias);
      return null;
    },
    [],
  );

  const updateCEBConta = useCallback(
    (cebId: string, senhaAtual: string, updates: { logoUrl?: string; senhaNova?: string }): string | null => {
      const cebs = storageGet<CEB>(KEYS.CEBS);
      const idx = cebs.findIndex((c) => c.id === cebId);
      if (idx < 0) return 'CEB não encontrada';
      const current = cebs[idx];
      const passwordChangeRequested = !!updates.senhaNova;
      if (passwordChangeRequested) {
        if (current.senha !== senhaAtual) return 'Senha atual incorreta';
      }
      cebs[idx] = {
        ...current,
        ...(updates.logoUrl !== undefined ? { logoUrl: updates.logoUrl } : {}),
        ...(updates.senhaNova ? { senha: updates.senhaNova } : {}),
        updatedAt: new Date().toISOString(),
      };
      storageSet(KEYS.CEBS, cebs);
      return null;
    },
    [],
  );

  const resetSenhaParoquia = useCallback((paroquiaId: string, senhaNova: string) => {
    const paroquias = storageGet<Paroquia>(KEYS.PAROQUIAS);
    const updated = paroquias.map((p) =>
      p.id === paroquiaId ? { ...p, senha: senhaNova, updatedAt: new Date().toISOString() } : p,
    );
    storageSet(KEYS.PAROQUIAS, updated);
  }, []);

  const resetSenhaCEB = useCallback((cebId: string, senhaNova: string) => {
    const cebs = storageGet<CEB>(KEYS.CEBS);
    const updated = cebs.map((c) =>
      c.id === cebId ? { ...c, senha: senhaNova, updatedAt: new Date().toISOString() } : c,
    );
    storageSet(KEYS.CEBS, updated);
  }, []);

  return (
    <DataContext.Provider
      value={{
        getParoquias, saveParoquia, deleteParoquia, getParoquia,
        getConfiguracaoVigente, getConfiguracoes, saveConfiguracao,
        getCEBs, getCEB, saveCEB, deleteCEB,
        getPastorais, savePastoral, deletePastoral,
        getConselheiros, saveConselheiro, deleteConselheiro,
        getDizimistas, saveDizimista, deleteDizimista,
        getDoacoes, getDoacoesParoquia, saveDoacao, deleteDoacao,
        getAlertas, marcarAlertaLido,
          getAdministrador, updateAdministrador, updateAdminSenha, updateParoquiaConta, updateCEBConta, resetSenhaParoquia, resetSenhaCEB,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
