import { useEffect, useState } from 'react';
import { useAPI } from '@shared/hooks/useAPI';

export function useCuentaBalance(cuentaId) {
  const [balance, setBalance] = useState(0);
  const today = new Date().toISOString().split('T')[0];

  const { data, loading, error } = useAPI(
    cuentaId ? `/api/transacciones/by-cuenta/${cuentaId}` : null,
    {
      params: {
        fechaFin: today,
        estado: 'PAGADO',
        limit: 5000,
      },
      dependencies: [cuentaId],
      enableCache: true,
      cacheDuration: 120000,
    },
  );

  useEffect(() => {
    const docs = data?.docs ?? [];
    const total = docs.reduce((acc, trans) => {
      const monto = parseFloat(trans.monto) || 0;
      return trans.tipo === 'INGRESO' ? acc + monto : acc - monto;
    }, 0);
    setBalance(total);
  }, [data]);

  return { balance, loading: loading && !!cuentaId, error };
}
