import { useCallback, useEffect, useState } from 'react';

import { useSnackbar } from 'notistack';

import { normalizeTaskList } from '@shared/utils/taskListUtils';

import { fetchTasksForList } from '../api/tasksApi';



/**

 * Carga única para /tareas: rango acotado + ocurrencias virtuales (API /list).

 * Por defecto excluye completadas en servidor; el toggle "mostrar completadas" refetch.

 */

export function useTasksForList({ includeCompleted: includeCompletedInitial = false } = {}) {

  const { enqueueSnackbar } = useSnackbar();

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [includeCompleted, setIncludeCompleted] = useState(includeCompletedInitial);



  useEffect(() => {

    const handleSetShowCompleted = (event) => {

      const { value } = event.detail || {};

      if (typeof value === 'boolean') setIncludeCompleted(value);

    };

    window.addEventListener('setShowCompleted', handleSetShowCompleted);

    return () => window.removeEventListener('setShowCompleted', handleSetShowCompleted);

  }, []);



  const refetch = useCallback(async () => {

    try {

      setLoading(true);

      const docs = await fetchTasksForList({ includeCompleted });

      setTasks(normalizeTaskList(docs));

      return docs;

    } catch (error) {

      console.error('Error al cargar tareas:', error);

      enqueueSnackbar('Error al cargar tareas', { variant: 'error' });

      setTasks([]);

      return null;

    } finally {

      setLoading(false);

    }

  }, [enqueueSnackbar, includeCompleted]);



  useEffect(() => {
    refetch().catch(() => {});
  }, [refetch]);



  return { tasks, setTasks, loading, refetch, includeCompleted };

}


