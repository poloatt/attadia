import { useEffect, useMemo, useState } from 'react';
import { isTaskCompleted } from '@shared/utils/agendaRules';

/**
 * Filtro de calendario: solo ocultar/mostrar completadas.
 * No aplica Ahora/Luego (eso es para /tareas y hábitos).
 */
export function useCalendarTaskFilter(tasks) {
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const handleSetShowCompleted = (event) => {
      const { value } = event.detail || {};
      if (typeof value === 'boolean') setShowCompleted(value);
    };
    window.addEventListener('setShowCompleted', handleSetShowCompleted);
    return () => window.removeEventListener('setShowCompleted', handleSetShowCompleted);
  }, []);

  const filteredTasks = useMemo(() => {
    const list = Array.isArray(tasks) ? tasks : [];
    if (showCompleted) return list;
    return list.filter((t) => !isTaskCompleted(t));
  }, [tasks, showCompleted]);

  return { filteredTasks, showCompleted };
}
