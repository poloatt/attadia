import { useMemo } from 'react';
import { useAPI } from '@shared/hooks/useAPI';
import { INVENTARIO_HUB_PREVIEW_COUNT, INVENTARIO_UBICACION } from './inventarioHubConstants';
import { normalizeInventarioItem } from './inventarioHubUtils';

/** Ítems de inventario filtrados por ubicación para tarjetas del hub. */
export function useInventarioHubItems(ubicacion) {
  const { data, loading } = useAPI('/api/inventarios', {
    enableCache: true,
    cacheDuration: 60000,
    params: { ubicacion, limit: 50 },
  });

  const items = useMemo(() => {
    const docs = data?.docs ?? (Array.isArray(data) ? data : []);
    return docs.map(normalizeInventarioItem);
  }, [data]);

  const preview = items.slice(0, INVENTARIO_HUB_PREVIEW_COUNT);
  const rest = items.slice(INVENTARIO_HUB_PREVIEW_COUNT);

  return { items, preview, rest, loading, hasMore: rest.length > 0 };
}
