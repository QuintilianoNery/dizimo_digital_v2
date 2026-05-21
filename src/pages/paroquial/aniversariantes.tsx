import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { getAniversariantesParoquia } from '@/services/dizimista.service';
import type { Dizimista } from '@/types';
import { Select, EmptyState, Spinner, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function formatData(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function AniversariantesPage() {
  const { user } = useAuth();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [lista, setLista] = useState<Dizimista[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.paroquiaId) return;
    setLoading(true);
    getAniversariantesParoquia(user.paroquiaId, mes)
      .then(setLista)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [mes, user?.paroquiaId]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Aniversariantes</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-3)', fontSize: 13 }}>Dizimistas que fazem aniversário no mês selecionado</p>
        </div>
        <Select
          label=""
          value={String(mes)}
          onChange={(e) => setMes(Number(e.target.value))}
          options={MESES.map((m, i) => ({ value: String(i + 1), label: m }))}
          style={{ minWidth: 140 }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
      ) : lista.length === 0 ? (
        <EmptyState icon={<Calendar size={40} />} title={`Nenhum aniversariante em ${MESES[mes - 1]}`} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {lista
            .sort((a, b) => {
              const dA = new Date(a.data_nascimento!).getUTCDate();
              const dB = new Date(b.data_nascimento!).getUTCDate();
              return dA - dB;
            })
            .map((d) => (
              <Card key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--brand-light)', color: 'var(--brand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13, flexShrink: 0,
                }}>
                  {formatData(d.data_nascimento!)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{d.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.telefone ?? 'Sem telefone'}</div>
                </div>
              </Card>
            ))}
        </div>
      )}

      <p style={{ margin: '20px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
        {lista.length} aniversariante(s) em {MESES[mes - 1]}
      </p>
    </div>
  );
}
