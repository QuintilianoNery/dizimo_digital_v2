import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Cake, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { EmptyState, PageHeader, SectionCard, StatCard } from '../../components/ui/index';
import { calcularIdade, filtrarAniversariantes, formatDate, getMesNome } from '../../utils/calculations';
import type { Dizimista } from '../../types';

type AniversarianteLinha = Dizimista & { cebNome: string };

export function AniversariantesPage() {
  const { user } = useAuth();
  const { getCEBs, getDizimistas } = useData();
  const paroquiaId = user!.paroquiaId!;
  const cebs = getCEBs(paroquiaId).filter((c) => c.status === 'ativa');
  const hoje = new Date();
  const initialSelectionApplied = useRef(false);

  const [cebFiltro, setCebFiltro] = useState('');
  const [modoFiltro, setModoFiltro] = useState<'mes' | 'periodo'>('mes');
  const [mesFiltro, setMesFiltro] = useState(hoje.getMonth() + 1);
  const [inicioFiltro, setInicioFiltro] = useState(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`);
  const [fimFiltro, setFimFiltro] = useState(hoje.toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!initialSelectionApplied.current && cebs.length > 0) {
      setCebFiltro(cebs[0].id);
      initialSelectionApplied.current = true;
    }
  }, [cebs]);

  const linhasBase = useMemo<AniversarianteLinha[]>(() => {
    const cebSelecionada = cebs.find((c) => c.id === cebFiltro);

    if (cebFiltro) {
      return getDizimistas(cebFiltro)
        .filter((d) => d.status === 'ativo')
        .map((d) => ({ ...d, cebNome: cebSelecionada?.nome ?? '' }));
    }

    return cebs.flatMap((ceb) =>
      getDizimistas(ceb.id)
        .filter((d) => d.status === 'ativo')
        .map((d) => ({ ...d, cebNome: ceb.nome })),
    );
  }, [cebs, cebFiltro, getDizimistas]);

  const aniversariantes = useMemo(() => {
    const filtrados = filtrarAniversariantes(linhasBase, modoFiltro === 'mes'
      ? { tipo: 'mes', mes: mesFiltro }
      : { tipo: 'periodo', inicio: inicioFiltro, fim: fimFiltro });

    const termo = search.toLowerCase();
    return filtrados.filter((d) => (
      d.nome.toLowerCase().includes(termo)
      || d.telefone.toLowerCase().includes(termo)
      || d.cebNome.toLowerCase().includes(termo)
    ));
  }, [fimFiltro, inicioFiltro, linhasBase, mesFiltro, modoFiltro, search]);

  const periodoLabel = modoFiltro === 'mes'
    ? `Mês: ${getMesNome(mesFiltro)}`
    : `Período: ${formatDate(inicioFiltro)} até ${formatDate(fimFiltro)}`;

  const cebsContempladas = new Set(aniversariantes.map((d) => d.cebNome)).size;

  return (
    <div>
      <PageHeader
        title="Aniversariantes dos Dizimistas"
        subtitle="Filtre por CEB, mês ou período de nascimento e acompanhe a lista de forma dinâmica."
      />

      <div className="grid-stats" style={{ marginBottom: 16 }}>
        <StatCard label="Aniversariantes" value={String(aniversariantes.length)} sub={periodoLabel} icon={<Cake size={20} />} color="var(--primary)" />
        <StatCard label="CEBs contempladas" value={String(cebsContempladas)} sub={cebFiltro ? 'CEB selecionada' : 'Todas as CEBs'} icon={<CalendarDays size={20} />} color="var(--accent)" />
        <StatCard label="Filtro ativo" value={modoFiltro === 'mes' ? 'Mês' : 'Período'} sub={cebFiltro ? 'Com CEB definida' : 'Visão geral da paróquia'} icon={<Filter size={20} />} color="var(--info)" />
      </div>

      <SectionCard title="Filtros" subtitle="Escolha a CEB e ajuste o período da lista">
        <div className="filter-bar" style={{ marginBottom: 0, alignItems: 'end' }}>
          <div className="form-group" style={{ minWidth: 220, marginBottom: 0 }}>
            <label className="form-label">CEB</label>
            <select className="form-select" value={cebFiltro} onChange={(e) => setCebFiltro(e.target.value)}>
              <option value="">Todas as CEBs</option>
              {cebs.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ minWidth: 180, marginBottom: 0 }}>
            <label className="form-label">Tipo de filtro</label>
            <select className="form-select" value={modoFiltro} onChange={(e) => setModoFiltro(e.target.value as 'mes' | 'periodo')}>
              <option value="mes">Mês específico</option>
              <option value="periodo">Período personalizado</option>
            </select>
          </div>

          {modoFiltro === 'mes' ? (
            <div className="form-group" style={{ minWidth: 180, marginBottom: 0 }}>
              <label className="form-label">Mês</label>
              <select className="form-select" value={mesFiltro} onChange={(e) => setMesFiltro(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) => (
                  <option key={mes} value={mes}>{getMesNome(mes)}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="form-group" style={{ minWidth: 180, marginBottom: 0 }}>
                <label className="form-label">Nascimento inicial</label>
                <input className="form-input" type="date" value={inicioFiltro} onChange={(e) => setInicioFiltro(e.target.value)} />
              </div>
              <div className="form-group" style={{ minWidth: 180, marginBottom: 0 }}>
                <label className="form-label">Nascimento final</label>
                <input className="form-input" type="date" value={fimFiltro} onChange={(e) => setFimFiltro(e.target.value)} />
              </div>
            </>
          )}

          <div className="form-group" style={{ minWidth: 220, marginBottom: 0 }}>
            <label className="form-label">Pesquisar</label>
            <input
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome, telefone ou CEB"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Lista de aniversariantes" subtitle="Os dados abaixo mudam conforme os filtros selecionados">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CEB</th>
                <th>Nascimento</th>
                <th>Idade</th>
                <th>Telefone</th>
              </tr>
            </thead>
            <tbody>
              {aniversariantes.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="Nenhum aniversariante encontrado"
                      description="Ajuste a CEB ou o período do filtro para localizar outros registros."
                      icon={<Cake size={36} />}
                    />
                  </td>
                </tr>
              ) : aniversariantes.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 500 }}>{d.nome}</td>
                  <td style={{ color: 'var(--text-3)' }}>{d.cebNome || cebs.find((c) => c.id === d.cebId)?.nome || '—'}</td>
                  <td>{formatDate(d.dataNascimento)}</td>
                  <td>{calcularIdade(d.dataNascimento)} anos</td>
                  <td>{d.telefone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
