import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { listPastorais } from '@/services/conselheiro.service';
import type { PastoralMovimento } from '@/types';

interface DataContextValue {
  pastorais: PastoralMovimento[];
  loadingData: boolean;
  reloadPastorais: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [pastorais, setPastorais] = useState<PastoralMovimento[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const reloadPastorais = async () => {
    setLoadingData(true);
    try {
      const data = await listPastorais();
      setPastorais(data);
    } catch (e) {
      console.error('Erro ao carregar pastorais:', e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      reloadPastorais();
    } else {
      setPastorais([]);
    }
  }, [isAuthenticated]);

  return (
    <DataContext.Provider value={{ pastorais, loadingData, reloadPastorais }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de <DataProvider>');
  return ctx;
}
