import { useEffect, useMemo, useState } from 'react';

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
    const parseDate = (value) => {
      if (!value) return null;
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return tasksArray.filter((t) => {
      const isCompleted = t?.estado === 'completada' || t?.completada === true;
      if (!showCompleted && isCompleted) return false;
      const start = parseDate(t?.fechaInicio || t?.inicio || t?.start);
      const due = parseDate(t?.fechaVencimiento || t?.fechaFin || t?.vencimiento || t?.dueDate || t?.fecha);
      // Seleccionar ancla priorizando la próxima fecha futura disponible
      const anchor = (() => {
        if (start && start > endOfToday) return start;
        if (due && due > endOfToday) return due;
        return start || due;
      })();
      if (agendaView === 'ahora') {
        if (!start && !due) return true;
        if (start) return start <= endOfToday;
        return !!due && due <= endOfToday;
      }
      if (agendaView === 'luego') {
        if (!anchor) return false;
        return anchor > endOfToday;
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


