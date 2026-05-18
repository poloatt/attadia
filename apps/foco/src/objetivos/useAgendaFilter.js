import { useEffect, useMemo, useState } from 'react';
import { isInAhora, isInLuego, isTaskCompleted } from '@shared/utils';

/**
 * Hook para centralizar el filtrado de la Agenda (Ahora / Luego / Todas)
 * - Escucha los eventos provenientes de la Toolbar:
 *   - 'agendaViewChanged' -> cambia la vista (ahora|luego|todas)
 *   - 'agendaLaterHorizonChanged' -> fija el horizonte de "luego" (null|week|month|quarter|year)
 *   - 'setShowCompleted' -> alterna mostrar/ocultar completadas
 * - Devuelve la lista filtrada y los estados actuales.
 */
export function useAgendaFilter(tasks) {
  const [agendaView, setAgendaView] = useState('ahora');             // 'ahora' | 'luego'
  const [showCompleted, setShowCompleted] = useState(false);         // mostrar tareas completadas

  useEffect(() => {
    const handleAgendaViewChanged = (event) => {
      const { view } = event.detail || {};
      if (view === 'ahora' || view === 'luego') setAgendaView(view);
    };
    const handleSetShowCompleted = (event) => {
      const { value } = event.detail || {};
      if (typeof value === 'boolean') setShowCompleted(value);
    };

    window.addEventListener('agendaViewChanged', handleAgendaViewChanged);
    window.addEventListener('setShowCompleted', handleSetShowCompleted);

    return () => {
      window.removeEventListener('agendaViewChanged', handleAgendaViewChanged);
      window.removeEventListener('setShowCompleted', handleSetShowCompleted);
    };
  }, []);

  const filteredTasks = useMemo(() => {
    const tasksArray = Array.isArray(tasks) ? tasks : [];
    const now = new Date();

    return tasksArray.filter((t) => {
      const isCompleted = isTaskCompleted(t);
      if (!showCompleted && isCompleted) return false;
      if (agendaView === 'ahora') {
        return isInAhora(t, now);
      }
      if (agendaView === 'luego') {
        return isInLuego(t, now);
      }
      return false;
    });
  }, [tasks, agendaView, showCompleted]);

  return {
    filteredTasks,
    agendaView,
    showCompleted
  };
}


