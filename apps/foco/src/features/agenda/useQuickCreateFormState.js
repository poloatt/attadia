import { useCallback } from 'react';

/**
 * Adapter between TareaFormAdvancedFields setFormData and quick-create advanced state.
 */
export function useQuickCreateAdvancedAdapter({
  advanced,
  setAdvanced,
  setErrors,
  tipo,
  objetivo,
  fechaFin,
}) {
  return useCallback(
    (updater) => {
      setAdvanced((prev) => {
        const base = {
          descripcion: prev.descripcion,
          estado: prev.estado,
          prioridad: prev.prioridad,
          fechaVencimiento: prev.fechaVencimiento ?? fechaFin,
          rrule: prev.rrule,
          objetivo: prev.objetivo || objetivo,
          subtareas: prev.subtareas,
          tipo,
        };
        const next = typeof updater === 'function' ? updater(base) : updater;
        if (next.objetivo && setErrors) {
          setErrors((e) => (e.objetivo ? { ...e, objetivo: undefined } : e));
        }
        return {
          descripcion: next.descripcion ?? prev.descripcion,
          estado: next.estado ?? prev.estado,
          prioridad: next.prioridad ?? prev.prioridad,
          fechaVencimiento: next.fechaVencimiento ?? prev.fechaVencimiento ?? fechaFin,
          rrule: next.rrule ?? prev.rrule,
          objetivo: next.objetivo ?? prev.objetivo ?? objetivo,
          subtareas: next.subtareas ?? prev.subtareas,
        };
      });
    },
    [setAdvanced, setErrors, tipo, objetivo, fechaFin],
  );
}
