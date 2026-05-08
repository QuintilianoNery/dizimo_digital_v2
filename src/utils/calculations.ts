import type { Doacao, ConfiguracaoParoquia, DashboardStats, FiltrosPeriodo } from '../types';

export function calcularRepasse(
  doacoes: Doacao[],
  config: ConfiguracaoParoquia | null,
): DashboardStats {
  const totalDizimo = doacoes
    .filter((d) => d.tipoDoacao === 'dizimo')
    .reduce((s, d) => s + d.valor, 0);

  const totalOferta = doacoes
    .filter((d) => d.tipoDoacao === 'oferta')
    .reduce((s, d) => s + d.valor, 0);

  const totalDoacao = doacoes
    .filter((d) => d.tipoDoacao === 'doacao')
    .reduce((s, d) => s + d.valor, 0);

  const totalArrecadado = totalDizimo + totalOferta + totalDoacao;

  const repasseDizimo = config
    ? (totalDizimo * config.percentualDizimoCebs) / 100
    : 0;

  const repasseOferta = config
    ? (totalOferta * config.percentualOfertaCebs) / 100
    : 0;

  return {
    totalDizimo,
    totalOferta,
    totalDoacao,
    totalArrecadado,
    repasseDizimo,
    repasseOferta,
    totalRepasse: repasseDizimo + repasseOferta,
  };
}

export function filtrarDoacoes(
  doacoes: Doacao[],
  filtros: FiltrosPeriodo,
): Doacao[] {
  return doacoes.filter((d) => {
    if (filtros.cebId && d.cebId !== filtros.cebId) return false;
    if (d.competenciaAno !== filtros.ano) return false;

    if (filtros.tipo === 'mensal' && filtros.mes) {
      return d.competenciaMes === filtros.mes;
    }
    if (filtros.tipo === 'trimestral' && filtros.mes) {
      const trimStart = Math.ceil(filtros.mes / 3) * 3 - 2;
      return d.competenciaMes >= trimStart && d.competenciaMes < trimStart + 3;
    }
    if (filtros.tipo === 'semestral' && filtros.mes) {
      const semestreStart = filtros.mes <= 6 ? 1 : 7;
      return d.competenciaMes >= semestreStart && d.competenciaMes < semestreStart + 6;
    }
    return true; // anual
  });
}

export function agruparPorMes(doacoes: Doacao[]) {
  const meses: Record<string, { mes: number; ano: number; total: number; dizimo: number; oferta: number }> = {};

  doacoes.forEach((d) => {
    const key = `${d.competenciaAno}-${String(d.competenciaMes).padStart(2, '0')}`;
    if (!meses[key]) {
      meses[key] = { mes: d.competenciaMes, ano: d.competenciaAno, total: 0, dizimo: 0, oferta: 0 };
    }
    meses[key].total += d.valor;
    if (d.tipoDoacao === 'dizimo') meses[key].dizimo += d.valor;
    if (d.tipoDoacao === 'oferta') meses[key].oferta += d.valor;
  });

  return Object.values(meses).sort((a, b) =>
    a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes,
  );
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
}

export function getMesNome(mes: number): string {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return meses[mes - 1] ?? '';
}

export function getConfigVigente(
  configs: ConfiguracaoParoquia[],
  paroquiaId: string,
): ConfiguracaoParoquia | null {
  return configs
    .filter((c) => c.paroquiaId === paroquiaId && c.ativa)
    .sort((a, b) => b.vigenteDesde.localeCompare(a.vigenteDesde))[0] ?? null;
}
