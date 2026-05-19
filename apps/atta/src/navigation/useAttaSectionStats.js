import { useEffect, useState } from 'react';
import clienteAxios, { isAxiosCanceled } from '@shared/config/axios';

export function extractSectionTotal(data) {
  if (data == null) return null;
  if (typeof data.totalDocs === 'number') return data.totalDocs;
  if (Array.isArray(data.docs)) return data.totalDocs ?? data.docs.length;
  if (Array.isArray(data)) return data.length;
  return null;
}

/** Totales por id de sección (endpoints en menuStructure). */
export function useAttaSectionStats(endpoints = {}) {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const keys = Object.keys(endpoints);

    if (keys.length === 0) {
      setCounts({});
      setLoading(false);
      return undefined;
    }

    const load = async () => {
      setLoading(true);
      const entries = await Promise.all(
        keys.map(async (id) => {
          const endpoint = endpoints[id];
          if (!endpoint) return [id, null];
          try {
            const { data } = await clienteAxios.get(endpoint, {
              params: { limit: 1, page: 1 },
            });
            return [id, extractSectionTotal(data)];
          } catch (err) {
            if (isAxiosCanceled(err)) return [id, null];
            return [id, null];
          }
        }),
      );

      if (!cancelled) {
        setCounts(Object.fromEntries(entries));
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [endpoints]);

  return { counts, loading };
}
