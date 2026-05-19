import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { supabase } from '../utils/supabase';
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

const toDateOnly = (value?: string | null) => (value ? String(value).split('T')[0] : '');

const mapAdministrador = (row: any): Administrador => ({
  id: row.id,
  nome: row.nome,
  email: row.email,
  senha: row.senha,
  logoUrl: row.logo_url ?? undefined,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapParoquia = (row: any): Paroquia => ({
  id: row.id,
  administradorCriouId: row.administrador_criou_id,
  codigoParoquia: row.codigo_paroquia,
  logoUrl: row.logo_url ?? undefined,
  nome: row.nome,
  email: row.email,
  telefone: row.telefone ?? '',
  endereco: row.endereco ?? '',
  fundacao: row.fundacao ?? '',
  cnpj: row.cnpj ?? '',
  parocoNome: row.paroco_nome ?? '',
  emailLoginSecretaria: row.email_login_secretaria ?? '',
  senha: row.senha,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapConfiguracao = (row: any): ConfiguracaoParoquia => ({
  id: row.id,
  paroquiaId: row.paroquia_id,
  percentualDizimoCebs: Number(row.percentual_dizimo_cebs ?? 0),
  percentualOfertaCebs: Number(row.percentual_oferta_cebs ?? 0),
  percentualCuriaDiocesana: Number(row.percentual_curia_diocesana ?? 0),
  percentualDiocese: Number(row.percentual_diocese ?? 0),
  vigenteDesde: row.vigente_desde,
  vigenteAte: row.vigente_ate ?? undefined,
  ativa: row.ativa,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapCEB = (row: any): CEB => ({
  id: row.id,
  paroquiaId: row.paroquia_id,
  codigoCeb: row.codigo_ceb,
  logoUrl: row.logo_url ?? undefined,
  nome: row.nome,
  emailLogin: row.email_login ?? '',
  senha: row.senha,
  telefone: row.telefone ?? '',
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapPastoral = (row: any): PastoralMovimento => ({
  id: row.id,
  nome: row.nome,
  tipo: row.tipo,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapConselheiro = (row: any): ConselheiroComunitario => ({
  id: row.id,
  cebId: row.ceb_id,
  pastoralMovimentoId: row.pastoral_movimento_id ?? undefined,
  nome: row.nome,
  telefone: row.telefone ?? '',
  email: row.email ?? '',
  cargo: row.cargo ?? '',
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapDizimista = (row: any): Dizimista => ({
  id: row.id,
  cebId: row.ceb_id,
  nome: row.nome,
  telefone: row.telefone ?? '',
  email: row.email ?? undefined,
  endereco: row.endereco ?? '',
  dataNascimento: row.data_nascimento ?? '',
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapDoacao = (row: any): Doacao => ({
  id: row.id,
  cebId: row.ceb_id,
  dizimistaId: row.dizimista_id ?? undefined,
  valor: Number(row.valor ?? 0),
  competenciaMes: Number(row.competencia_mes ?? 0),
  competenciaAno: Number(row.competencia_ano ?? 0),
  tipoDoacao: row.tipo_doacao,
  formaPagamento: row.forma_pagamento,
  observacoes: row.observacoes ?? undefined,
  dataLancamento: toDateOnly(row.data_lancamento),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapAlerta = (row: any): AlertaPercentual => ({
  id: row.id,
  paroquiaId: row.paroquia_id,
  cebId: row.ceb_id,
  configuracaoParoquiaId: row.configuracao_paroquia_id,
  percentualDizimoAnterior: Number(row.percentual_dizimo_anterior ?? 0),
  percentualDizimoNovo: Number(row.percentual_dizimo_novo ?? 0),
  percentualOfertaAnterior: Number(row.percentual_oferta_anterior ?? 0),
  percentualOfertaNovo: Number(row.percentual_oferta_novo ?? 0),
  mensagem: row.mensagem,
  lidoEm: row.lido_em ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx === -1) return [item, ...items];
  const next = items.slice();
  next[idx] = item;
  return next;
}

function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [administrador, setAdministrador] = useState<Administrador | null>(null);
  const [paroquias, setParoquias] = useState<Paroquia[]>([]);
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoParoquia[]>([]);
  const [cebs, setCebs] = useState<CEB[]>([]);
  const [pastorais, setPastorais] = useState<PastoralMovimento[]>([]);
  const [conselheiros, setConselheiros] = useState<ConselheiroComunitario[]>([]);
  const [dizimistas, setDizimistas] = useState<Dizimista[]>([]);
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [alertas, setAlertas] = useState<AlertaPercentual[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      const [
        adminsRes,
        paroquiasRes,
        configsRes,
        cebsRes,
        pastoraisRes,
        conselheirosRes,
        dizimistasRes,
        doacoesRes,
        alertasRes,
      ] = await Promise.all([
        supabase.from('administradores').select('*').order('created_at', { ascending: true }),
        supabase.from('paroquias').select('*').order('nome', { ascending: true }),
        supabase.from('configuracoes_paroquias').select('*').order('vigente_desde', { ascending: false }),
        supabase.from('cebs').select('*').order('nome', { ascending: true }),
        supabase.from('pastorais_movimentos').select('*').order('nome', { ascending: true }),
        supabase.from('conselheiros_comunitarios').select('*'),
        supabase.from('dizimistas').select('*'),
        supabase.from('doacoes').select('*'),
        supabase.from('alertas_percentuais').select('*'),
      ]);

      if (cancelled) return;

      if (adminsRes.error) console.warn('Erro ao carregar administradores:', adminsRes.error);
      if (paroquiasRes.error) console.warn('Erro ao carregar paróquias:', paroquiasRes.error);
      if (configsRes.error) console.warn('Erro ao carregar configurações:', configsRes.error);
      if (cebsRes.error) console.warn('Erro ao carregar CEBs:', cebsRes.error);
      if (pastoraisRes.error) console.warn('Erro ao carregar pastorais:', pastoraisRes.error);
      if (conselheirosRes.error) console.warn('Erro ao carregar conselheiros:', conselheirosRes.error);
      if (dizimistasRes.error) console.warn('Erro ao carregar dizimistas:', dizimistasRes.error);
      if (doacoesRes.error) console.warn('Erro ao carregar doações:', doacoesRes.error);
      if (alertasRes.error) console.warn('Erro ao carregar alertas:', alertasRes.error);

      setAdministrador(adminsRes.data?.[0] ? mapAdministrador(adminsRes.data[0]) : null);
      setParoquias((paroquiasRes.data ?? []).map(mapParoquia));
      setConfiguracoes((configsRes.data ?? []).map(mapConfiguracao));
      setCebs((cebsRes.data ?? []).map(mapCEB));
      setPastorais((pastoraisRes.data ?? []).map(mapPastoral));
      setConselheiros((conselheirosRes.data ?? []).map(mapConselheiro));
      setDizimistas((dizimistasRes.data ?? []).map(mapDizimista));
      setDoacoes((doacoesRes.data ?? []).map(mapDoacao));
      setAlertas((alertasRes.data ?? []).map(mapAlerta));
    };

    loadAll();
    return () => { cancelled = true; };
  }, []);

  const getParoquias = useCallback(() => paroquias, [paroquias]);
  const getParoquia = useCallback(
    (id: string) => paroquias.find((p) => p.id === id) ?? null,
    [paroquias],
  );

  const saveParoquia = useCallback((data: Partial<Paroquia> & { nome: string }): Paroquia => {
    const now = new Date().toISOString();
    const existing = data.id ? paroquias.find((p) => p.id === data.id) : null;
    const adminId = data.administradorCriouId ?? existing?.administradorCriouId ?? administrador?.id;
    const p: Paroquia = {
      id: data.id ?? uuid(),
      administradorCriouId: adminId,
      codigoParoquia: data.codigoParoquia ?? existing?.codigoParoquia ?? String(Date.now()).slice(-4),
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
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    setParoquias((prev) => upsertById(prev, p));

    void (async () => {
      let resolvedAdminId = adminId;
      if (!resolvedAdminId) {
        const { data: adminRow, error: adminError } = await supabase
          .from('administradores')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (adminError || !adminRow) {
          console.warn('Administrador não definido para paróquia.');
          return;
        }
        resolvedAdminId = adminRow.id;
        setAdministrador(mapAdministrador(adminRow));
        setParoquias((prev) => upsertById(prev, { ...p, administradorCriouId: resolvedAdminId }));
      }
      const payload = {
        id: p.id,
        administrador_criou_id: resolvedAdminId,
        codigo_paroquia: p.codigoParoquia,
        logo_url: p.logoUrl ?? null,
        nome: p.nome,
        email: p.email,
        telefone: p.telefone || null,
        endereco: p.endereco || null,
        fundacao: p.fundacao || null,
        cnpj: p.cnpj || null,
        paroco_nome: p.parocoNome || null,
        email_login_secretaria: p.emailLoginSecretaria || null,
        senha: p.senha,
        status: p.status,
      };
      const { data: saved, error } = await supabase
        .from('paroquias')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();
      if (error) {
        console.warn('Erro ao salvar paróquia no Supabase:', error);
        return;
      }
      setParoquias((prev) => upsertById(prev, mapParoquia(saved)));
    })();

    return p;
  }, [administrador, paroquias]);

  const deleteParoquia = useCallback((id: string) => {
    setParoquias((prev) => removeById(prev, id));
    setCebs((prev) => prev.filter((c) => c.paroquiaId !== id));
    setConfiguracoes((prev) => prev.filter((c) => c.paroquiaId !== id));
    setAlertas((prev) => prev.filter((a) => a.paroquiaId !== id));

    void supabase.from('paroquias').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Erro ao excluir paróquia no Supabase:', error);
    });
  }, []);

  const getConfiguracaoVigente = useCallback((paroquiaId: string): ConfiguracaoParoquia | null => {
    const configs = configuracoes
      .filter((c) => c.paroquiaId === paroquiaId)
      .sort((a, b) => b.vigenteDesde.localeCompare(a.vigenteDesde));
    return configs.find((c) => c.ativa) ?? configs[0] ?? null;
  }, [configuracoes]);

  const getConfiguracoes = useCallback(
    (paroquiaId: string) =>
      configuracoes
        .filter((c) => c.paroquiaId === paroquiaId)
        .sort((a, b) => b.vigenteDesde.localeCompare(a.vigenteDesde)),
    [configuracoes],
  );

  const saveConfiguracao = useCallback(
    (data: Partial<ConfiguracaoParoquia> & { paroquiaId: string }): ConfiguracaoParoquia => {
      const now = new Date().toISOString();
      const existing = configuracoes.find((c) => c.paroquiaId === data.paroquiaId) ?? null;
      const c: ConfiguracaoParoquia = {
        id: existing?.id ?? uuid(),
        paroquiaId: data.paroquiaId,
        percentualDizimoCebs: data.percentualDizimoCebs ?? existing?.percentualDizimoCebs ?? 0,
        percentualOfertaCebs: data.percentualOfertaCebs ?? existing?.percentualOfertaCebs ?? 0,
        percentualCuriaDiocesana: data.percentualCuriaDiocesana ?? existing?.percentualCuriaDiocesana ?? 0,
        percentualDiocese: data.percentualDiocese ?? existing?.percentualDiocese ?? 0,
        vigenteDesde: data.vigenteDesde ?? existing?.vigenteDesde ?? new Date().toISOString().split('T')[0],
        vigenteAte: data.vigenteAte ?? existing?.vigenteAte,
        ativa: true,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      setConfiguracoes((prev) => upsertById(prev, c));

      void (async () => {
        const payload = {
          id: c.id,
          paroquia_id: c.paroquiaId,
          percentual_dizimo_cebs: c.percentualDizimoCebs,
          percentual_oferta_cebs: c.percentualOfertaCebs,
          percentual_curia_diocesana: c.percentualCuriaDiocesana,
          percentual_diocese: c.percentualDiocese,
          vigente_desde: c.vigenteDesde,
          vigente_ate: c.vigenteAte ?? null,
          ativa: true,
        };
        const { data: saved, error } = await supabase
          .from('configuracoes_paroquias')
          .upsert(payload, { onConflict: 'paroquia_id' })
          .select()
          .single();
        if (error) {
          console.warn('Erro ao salvar configuração no Supabase:', error);
          return;
        }

        const mapped = mapConfiguracao(saved);
        setConfiguracoes((prev) => upsertById(prev, mapped));

        const cebsParoquia = cebs.filter((ceb) => ceb.paroquiaId === data.paroquiaId);
        if (cebsParoquia.length === 0) return;

        const alertasPayload = cebsParoquia.map((ceb) => ({
          id: uuid(),
          paroquia_id: data.paroquiaId,
          ceb_id: ceb.id,
          configuracao_paroquia_id: mapped.id,
          percentual_dizimo_anterior: existing?.percentualDizimoCebs ?? mapped.percentualDizimoCebs,
          percentual_dizimo_novo: mapped.percentualDizimoCebs,
          percentual_oferta_anterior: existing?.percentualOfertaCebs ?? mapped.percentualOfertaCebs,
          percentual_oferta_novo: mapped.percentualOfertaCebs,
          mensagem: `Os percentuais de repasse foram atualizados pela paróquia. Dízimo: ${mapped.percentualDizimoCebs}% | Oferta: ${mapped.percentualOfertaCebs}%`,
        }));

        const { data: inserted, error: alertError } = await supabase
          .from('alertas_percentuais')
          .insert(alertasPayload)
          .select();

        if (alertError) {
          console.warn('Erro ao inserir alertas no Supabase:', alertError);
          return;
        }

        if (inserted) {
          setAlertas((prev) => [...inserted.map(mapAlerta), ...prev]);
        }
      })();

      return c;
    },
    [cebs, configuracoes],
  );

  const getCEBs = useCallback(
    (paroquiaId: string) => cebs.filter((c) => c.paroquiaId === paroquiaId),
    [cebs],
  );
  const getCEB = useCallback(
    (id: string) => cebs.find((c) => c.id === id) ?? null,
    [cebs],
  );

  const saveCEB = useCallback(
    (data: Partial<CEB> & { paroquiaId: string; nome: string }): CEB => {
      const now = new Date().toISOString();
      const existing = data.id ? cebs.find((c) => c.id === data.id) : null;
      const c: CEB = {
        id: data.id ?? uuid(),
        paroquiaId: data.paroquiaId,
        codigoCeb: data.codigoCeb ?? existing?.codigoCeb ?? `CEB-${String(Date.now()).slice(-4)}`,
        logoUrl: data.logoUrl,
        nome: data.nome,
        emailLogin: data.emailLogin ?? '',
        senha: data.senha ?? existing?.senha ?? '',
        telefone: data.telefone ?? '',
        status: data.status ?? 'ativa',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      setCebs((prev) => upsertById(prev, c));

      void (async () => {
        const payload = {
          id: c.id,
          paroquia_id: c.paroquiaId,
          codigo_ceb: c.codigoCeb,
          logo_url: c.logoUrl ?? null,
          nome: c.nome,
          email_login: c.emailLogin || null,
          senha: c.senha,
          telefone: c.telefone || null,
          status: c.status,
        };
        const { data: saved, error } = await supabase
          .from('cebs')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .single();
        if (error) {
          console.warn('Erro ao salvar CEB no Supabase:', error);
          return;
        }
        setCebs((prev) => upsertById(prev, mapCEB(saved)));
      })();

      return c;
    },
    [cebs],
  );
  const deleteCEB = useCallback((id: string) => {
    setCebs((prev) => removeById(prev, id));
    setConselheiros((prev) => prev.filter((c) => c.cebId !== id));
    setDizimistas((prev) => prev.filter((d) => d.cebId !== id));
    setDoacoes((prev) => prev.filter((d) => d.cebId !== id));
    setAlertas((prev) => prev.filter((a) => a.cebId !== id));

    void supabase.from('cebs').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Erro ao excluir CEB no Supabase:', error);
    });
  }, []);

  const getPastorais = useCallback(() => pastorais, [pastorais]);
  const savePastoral = useCallback((data: Partial<PastoralMovimento> & { nome: string }): PastoralMovimento => {
    const now = new Date().toISOString();
    const existing = data.id ? pastorais.find((p) => p.id === data.id) : null;
    const p: PastoralMovimento = {
      id: data.id ?? uuid(),
      nome: data.nome,
      tipo: data.tipo ?? existing?.tipo ?? 'pastoral',
      status: data.status ?? existing?.status ?? 'ativo',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    setPastorais((prev) => upsertById(prev, p));

    void (async () => {
      const payload = {
        id: p.id,
        nome: p.nome,
        tipo: p.tipo,
        status: p.status,
      };
      const { data: saved, error } = await supabase
        .from('pastorais_movimentos')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();
      if (error) {
        console.warn('Erro ao salvar pastoral no Supabase:', error);
        return;
      }
      setPastorais((prev) => upsertById(prev, mapPastoral(saved)));
    })();

    return p;
  }, [pastorais]);
  const deletePastoral = useCallback((id: string) => {
    setPastorais((prev) => removeById(prev, id));
    void supabase.from('pastorais_movimentos').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Erro ao excluir pastoral no Supabase:', error);
    });
  }, []);

  const getConselheiros = useCallback(
    (cebId: string) => conselheiros.filter((c) => c.cebId === cebId),
    [conselheiros],
  );
  const saveConselheiro = useCallback(
    (data: Partial<ConselheiroComunitario> & { cebId: string; nome: string }): ConselheiroComunitario => {
      const now = new Date().toISOString();
      const existing = data.id ? conselheiros.find((c) => c.id === data.id) : null;
      const c: ConselheiroComunitario = {
        id: data.id ?? uuid(),
        cebId: data.cebId,
        pastoralMovimentoId: data.pastoralMovimentoId,
        nome: data.nome,
        telefone: data.telefone ?? '',
        email: data.email ?? '',
        cargo: data.cargo ?? '',
        status: data.status ?? 'ativo',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      setConselheiros((prev) => upsertById(prev, c));

      void (async () => {
        const payload = {
          id: c.id,
          ceb_id: c.cebId,
          pastoral_movimento_id: c.pastoralMovimentoId ?? null,
          nome: c.nome,
          telefone: c.telefone || null,
          email: c.email || null,
          cargo: c.cargo || null,
          status: c.status,
        };
        const { data: saved, error } = await supabase
          .from('conselheiros_comunitarios')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .single();
        if (error) {
          console.warn('Erro ao salvar conselheiro no Supabase:', error);
          return;
        }
        setConselheiros((prev) => upsertById(prev, mapConselheiro(saved)));
      })();

      return c;
    },
    [conselheiros],
  );
  const deleteConselheiro = useCallback((id: string) => {
    setConselheiros((prev) => removeById(prev, id));
    void supabase.from('conselheiros_comunitarios').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Erro ao excluir conselheiro no Supabase:', error);
    });
  }, []);

  const getDizimistas = useCallback(
    (cebId: string) => dizimistas.filter((d) => d.cebId === cebId),
    [dizimistas],
  );
  const saveDizimista = useCallback(
    (data: Partial<Dizimista> & { cebId: string; nome: string }): Dizimista => {
      const now = new Date().toISOString();
      const existing = data.id ? dizimistas.find((d) => d.id === data.id) : null;
      const d: Dizimista = {
        id: data.id ?? uuid(),
        cebId: data.cebId,
        nome: data.nome,
        telefone: data.telefone ?? '',
        email: data.email,
        endereco: data.endereco ?? '',
        dataNascimento: data.dataNascimento ?? '',
        status: data.status ?? 'ativo',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      setDizimistas((prev) => upsertById(prev, d));

      void (async () => {
        const payload = {
          id: d.id,
          ceb_id: d.cebId,
          nome: d.nome,
          telefone: d.telefone || null,
          email: d.email || null,
          endereco: d.endereco || null,
          data_nascimento: d.dataNascimento || null,
          status: d.status,
        };
        const { data: saved, error } = await supabase
          .from('dizimistas')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .single();
        if (error) {
          console.warn('Erro ao salvar dizimista no Supabase:', error);
          return;
        }
        setDizimistas((prev) => upsertById(prev, mapDizimista(saved)));
      })();

      return d;
    },
    [dizimistas],
  );
  const deleteDizimista = useCallback((id: string) => {
    setDizimistas((prev) => removeById(prev, id));
    void supabase.from('dizimistas').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Erro ao excluir dizimista no Supabase:', error);
    });
  }, []);

  const getDoacoes = useCallback(
    (cebId?: string) => (cebId ? doacoes.filter((d) => d.cebId === cebId) : doacoes),
    [doacoes],
  );

  const getDoacoesParoquia = useCallback((paroquiaId: string) => {
    const cebIds = new Set(cebs.filter((c) => c.paroquiaId === paroquiaId).map((c) => c.id));
    return doacoes.filter((d) => cebIds.has(d.cebId));
  }, [cebs, doacoes]);

  const saveDoacao = useCallback(
    (data: Partial<Doacao> & { cebId: string; valor: number }): Doacao => {
      const today = new Date();
      const now = today.toISOString();
      const existing = data.id ? doacoes.find((d) => d.id === data.id) : null;
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
        dataLancamento: data.dataLancamento ?? toDateOnly(now),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      setDoacoes((prev) => upsertById(prev, d));

      void (async () => {
        const payload = {
          id: d.id,
          ceb_id: d.cebId,
          dizimista_id: d.dizimistaId ?? null,
          valor: d.valor,
          competencia_mes: d.competenciaMes,
          competencia_ano: d.competenciaAno,
          tipo_doacao: d.tipoDoacao,
          forma_pagamento: d.formaPagamento,
          observacoes: d.observacoes ?? null,
          data_lancamento: d.dataLancamento,
        };
        const { data: saved, error } = await supabase
          .from('doacoes')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .single();
        if (error) {
          console.warn('Erro ao salvar doação no Supabase:', error);
          return;
        }
        setDoacoes((prev) => upsertById(prev, mapDoacao(saved)));
      })();

      return d;
    },
    [doacoes],
  );
  const deleteDoacao = useCallback((id: string) => {
    setDoacoes((prev) => removeById(prev, id));
    void supabase.from('doacoes').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Erro ao excluir doação no Supabase:', error);
    });
  }, []);

  const getAlertas = useCallback(
    (cebId: string) =>
      alertas
        .filter((a) => a.cebId === cebId && !a.lidoEm)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [alertas],
  );

  const marcarAlertaLido = useCallback((id: string) => {
    const now = new Date().toISOString();
    setAlertas((prev) => prev.map((a) => (a.id === id ? { ...a, lidoEm: now, updatedAt: now } : a)));

    void supabase.from('alertas_percentuais').update({ lido_em: now }).eq('id', id).then(({ error }) => {
      if (error) console.warn('Erro ao marcar alerta como lido no Supabase:', error);
    });
  }, []);

  const getAdministrador = useCallback(() => administrador, [administrador]);

  const updateAdministrador = useCallback(
    (emailAtual: string, senhaAtual: string, updates: { nome?: string; email?: string; logoUrl?: string; senhaNova?: string }): string | null => {
      if (!administrador) return 'Administrador não encontrado';
      const emailChanged = updates.email !== undefined && updates.email !== administrador.email;
      const passwordChangeRequested = !!updates.senhaNova;
      if (emailChanged || passwordChangeRequested) {
        if (administrador.email !== emailAtual || administrador.senha !== senhaAtual) {
          return 'Email ou senha atual incorretos';
        }
      }

      const updated: Administrador = {
        ...administrador,
        nome: updates.nome ?? administrador.nome,
        email: updates.email ?? administrador.email,
        logoUrl: updates.logoUrl ?? administrador.logoUrl,
        senha: updates.senhaNova ?? administrador.senha,
        updatedAt: new Date().toISOString(),
      };

      setAdministrador(updated);

      void supabase
        .from('administradores')
        .update({
          nome: updated.nome,
          email: updated.email,
          senha: updated.senha,
          logo_url: updated.logoUrl ?? null,
        })
        .eq('id', updated.id)
        .then(({ error }) => {
          if (error) console.warn('Erro ao atualizar administrador no Supabase:', error);
        });

      return null;
    },
    [administrador],
  );

  const updateAdminSenha = useCallback(
    (email: string, senhaAtual: string, senhaNova: string): string | null => {
      return updateAdministrador(email, senhaAtual, { senhaNova });
    },
    [updateAdministrador],
  );

  const updateParoquiaConta = useCallback(
    (paroquiaId: string, senhaAtual: string, updates: { logoUrl?: string; senhaNova?: string }): string | null => {
      const current = paroquias.find((p) => p.id === paroquiaId);
      if (!current) return 'Paróquia não encontrada';
      const passwordChangeRequested = !!updates.senhaNova;
      if (passwordChangeRequested && current.senha !== senhaAtual) {
        return 'Senha atual incorreta';
      }

      const updated: Paroquia = {
        ...current,
        ...(updates.logoUrl !== undefined ? { logoUrl: updates.logoUrl } : {}),
        ...(updates.senhaNova ? { senha: updates.senhaNova } : {}),
        updatedAt: new Date().toISOString(),
      };
      setParoquias((prev) => upsertById(prev, updated));

      void supabase
        .from('paroquias')
        .update({
          logo_url: updated.logoUrl ?? null,
          senha: updated.senha,
        })
        .eq('id', updated.id)
        .then(({ error }) => {
          if (error) console.warn('Erro ao atualizar paróquia no Supabase:', error);
        });

      return null;
    },
    [paroquias],
  );

  const updateCEBConta = useCallback(
    (cebId: string, senhaAtual: string, updates: { logoUrl?: string; senhaNova?: string }): string | null => {
      const current = cebs.find((c) => c.id === cebId);
      if (!current) return 'CEB não encontrada';
      const passwordChangeRequested = !!updates.senhaNova;
      if (passwordChangeRequested && current.senha !== senhaAtual) {
        return 'Senha atual incorreta';
      }

      const updated: CEB = {
        ...current,
        ...(updates.logoUrl !== undefined ? { logoUrl: updates.logoUrl } : {}),
        ...(updates.senhaNova ? { senha: updates.senhaNova } : {}),
        updatedAt: new Date().toISOString(),
      };
      setCebs((prev) => upsertById(prev, updated));

      void supabase
        .from('cebs')
        .update({
          logo_url: updated.logoUrl ?? null,
          senha: updated.senha,
        })
        .eq('id', updated.id)
        .then(({ error }) => {
          if (error) console.warn('Erro ao atualizar CEB no Supabase:', error);
        });

      return null;
    },
    [cebs],
  );

  const resetSenhaParoquia = useCallback((paroquiaId: string, senhaNova: string) => {
    const current = paroquias.find((p) => p.id === paroquiaId);
    if (!current) return;
    const updated = { ...current, senha: senhaNova, updatedAt: new Date().toISOString() };
    setParoquias((prev) => upsertById(prev, updated));

    void supabase.from('paroquias').update({ senha: senhaNova }).eq('id', paroquiaId).then(({ error }) => {
      if (error) console.warn('Erro ao resetar senha da paróquia no Supabase:', error);
    });
  }, [paroquias]);

  const resetSenhaCEB = useCallback((cebId: string, senhaNova: string) => {
    const current = cebs.find((c) => c.id === cebId);
    if (!current) return;
    const updated = { ...current, senha: senhaNova, updatedAt: new Date().toISOString() };
    setCebs((prev) => upsertById(prev, updated));

    void supabase.from('cebs').update({ senha: senhaNova }).eq('id', cebId).then(({ error }) => {
      if (error) console.warn('Erro ao resetar senha da CEB no Supabase:', error);
    });
  }, [cebs]);

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
