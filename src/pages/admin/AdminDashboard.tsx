import React, { useEffect, useState } from 'react';
import { Church, Users, UserCheck, BarChart3 } from 'lucide-react';
import { getAdminDashboardStats, type AdminDashboardStats } from '@/services/admin.service';
import { Card, Spinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 10,
        background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</div>
      </div>
    </Card>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>
          Bem-vindo, {user?.nome}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-3)', fontSize: 13 }}>
          Painel geral da plataforma Dízimo Digital
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spinner size={28} />
        </div>
      ) : error ? (
        <div style={{ color: 'var(--red)', fontSize: 13 }}>{error}</div>
      ) : stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          <StatCard icon={<Church size={22} />} label="Total de Paróquias" value={stats.totalParoquias} color="var(--brand)" />
          <StatCard icon={<Church size={22} />} label="Paróquias Ativas" value={stats.paroquiasAtivas} color="var(--green)" />
          <StatCard icon={<Users size={22} />} label="Total de CEBs" value={stats.totalCebs} color="var(--blue)" />
          <StatCard icon={<UserCheck size={22} />} label="Dizimistas Ativos" value={stats.totalDizimistas} color="var(--amber)" />
        </div>
      ) : null}
    </div>
  );
}
