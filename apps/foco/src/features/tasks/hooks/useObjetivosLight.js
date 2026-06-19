import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { fetchObjetivosLight } from '../api/tasksApi';

export function useObjetivosLight({ autoFetch = true } = {}) {
  const { enqueueSnackbar } = useSnackbar();
  const [objetivos, setObjetivos] = useState([]);
  const [loading, setLoading] = useState(autoFetch);

  const refetch = useCallback(async () => {
    try {
      const docs = await fetchObjetivosLight();
      setObjetivos(docs);
      return docs;
    } catch (error) {
      console.error('Error al cargar objetivos:', error);
      enqueueSnackbar('Error al cargar Objetivos', { variant: 'error' });
      setObjetivos([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, [autoFetch, refetch]);

  return { objetivos, setObjetivos, loading, refetch };
}
