import { useEffect, useMemo, useState } from 'react';
import { parseAPIDate } from '@shared/utils/dateUtils';

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
      // Unificar parseo (evita colados por fechas en formatos no ISO / TZ shifts)
      const d = parseAPIDate(value);
      return d && !isNaN(d.getTime()) ? d : null;
    };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

    return tasksArray.filter((t) => {
      const estado = String(t?.estado || '').toLowerCase();
      const isCompleted = estado === 'completada' || t?.completada === true;
      if (!showCompleted && isCompleted) return false;
      const start = parseDate(t?.fechaInicio || t?.inicio || t?.start);
      const due = parseDate(t?.fechaVencimiento || t?.fechaFin || t?.vencimiento || t?.dueDate || t?.fecha);
      // Seleccionar ancla priorizando la próxima fecha futura disponible
      const anchor = (() => {
        // Usar el mismo horizonte que AHORA (fin de mañana) para decidir qué es “futuro”.
        // IMPORTANTe: elegir la fecha futura MÁS CERCANA (min) entre start/due.
        const candidates = [start, due].filter(d => d && d > endOfTomorrow);
        if (candidates.length > 0) {
          return candidates.reduce((min, d) => (d < min ? d : min), candidates[0]);
        }
        return start || due;
      })();
      if (agendaView === 'ahora') {
        if (!start && !due) return true;
        // Regla: si hay vencimiento y es posterior al horizonte, NO es "AHORA"
        // aunque la tarea tenga fechaInicio "hoy" por defecto (evita colar próximo mes en HOY).
        if (due && due > endOfTomorrow) return false;
        if (start) return start <= endOfTomorrow;
        return !!due && due <= endOfTomorrow;
      }
      if (agendaView === 'luego') {
        if (!anchor) return false;
        return anchor > endOfTomorrow;
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


