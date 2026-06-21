import { useCallback, useEffect, useMemo, useState } from 'react';
import { endOfDay, endOfWeek, startOfDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSnackbar } from 'notistack';
import { normalizeTaskList } from '@shared/utils/taskListUtils';
import { fetchTasksForAgendaRange } from '../api/tasksApi';

export function useTasksForCalendar(selectedDate, viewMode = 'week') {
  const { enqueueSnackbar } = useSnackbar();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [includeCompleted, setIncludeCompleted] = useState(false);

  useEffect(() => {
    const handleSetShowCompleted = (event) => {
      const { value } = event.detail || {};
      if (typeof value === 'boolean') setIncludeCompleted(value);
    };
    window.addEventListener('setShowCompleted', handleSetShowCompleted);
    return () => window.removeEventListener('setShowCompleted', handleSetShowCompleted);
  }, []);

  const range = useMemo(() => {
    const base = selectedDate || new Date();
    if (viewMode === 'week') {
      const start = startOfWeek(base, { weekStartsOn: 1, locale: es });
      const end = endOfWeek(base, { weekStartsOn: 1, locale: es });
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    return { start: startOfDay(base), end: endOfDay(base) };
  }, [selectedDate, viewMode]);

  const rangeKey = useMemo(
    () => `${range.start.getTime()}|${range.end.getTime()}|${includeCompleted}`,
    [range.start, range.end, includeCompleted],
  );

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await fetchTasksForAgendaRange({
        from: range.start,
        to: range.end,
        includeCompleted,
      });
      setTasks(normalizeTaskList(docs));
      return docs;
    } catch (error) {
      console.error('Error al cargar agenda:', error);
      enqueueSnackbar('Error al cargar tareas del calendario', { variant: 'error' });
      setTasks([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [range.start, range.end, includeCompleted, enqueueSnackbar]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const docs = await fetchTasksForAgendaRange({
          from: range.start,
          to: range.end,
          includeCompleted,
        });
        if (!cancelled) {
          setTasks(normalizeTaskList(docs));
        }
      } catch (error) {
        if (!cancelled) {
          enqueueSnackbar('Error al cargar tareas del calendario', { variant: 'error' });
          setTasks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [rangeKey, enqueueSnackbar, range.start, range.end, includeCompleted]);

  return { tasks, setTasks, loading, range, refetch, includeCompleted };
}
