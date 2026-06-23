import { useCallback } from 'react';
import { getHorarioToShow } from '@shared/utils/habitTimeLogic';
import { computeCarouselToggleValue } from '@shared/utils/habitToggleUtils';

/**
 * Toggle de completado con soporte multi-horario y UI optimista.
 * @param {'ahora'|'luego'} mode - Ahora usa getHorarioToShow; Luego usa currentTimeOfDay.
 */
export default function useHabitCarouselToggle({
  mode,
  interactive,
  dragRef,
  rutinaHoy,
  markItemComplete,
  patchRutinaSection,
  currentTimeOfDay,
}) {
  const logPrefix = mode === 'luego' ? '[HabitCarouselLuego]' : '[HabitCarouselAhora]';

  return useCallback(async (section, itemId) => {
    if (!interactive) return;
    if (dragRef.current.moved) return;
    if (!rutinaHoy?._id) return;
    if (!markItemComplete || typeof markItemComplete !== 'function') {
      console.warn(`${logPrefix} markItemComplete no disponible en contexto`);
      return;
    }

    const prevSection = rutinaHoy?.[section] || {};
    const itemValue = prevSection[itemId];
    const itemConfig = rutinaHoy?.config?.[section]?.[itemId] || {};
    const horariosConfig = Array.isArray(itemConfig.horarios) ? itemConfig.horarios : [];

    let normalizedHorario;
    if (horariosConfig.length > 1) {
      if (mode === 'ahora') {
        const completadoHoy = itemValue !== undefined ? itemValue : false;
        const tipo = (itemConfig.tipo || 'DIARIO').toUpperCase();
        const frecuencia = Number(itemConfig.frecuencia || 1);
        const horarioToMark = getHorarioToShow(
          horariosConfig,
          currentTimeOfDay,
          completadoHoy,
          tipo,
          frecuencia,
        ) || currentTimeOfDay;
        normalizedHorario = String(horarioToMark).toUpperCase();
      } else {
        normalizedHorario = String(currentTimeOfDay).toUpperCase();
      }
    }

    const newValue = computeCarouselToggleValue({
      itemValue,
      horariosConfig,
      normalizedHorario,
    });

    const itemData = { [itemId]: newValue };
    const previousValue = itemValue;

    if (patchRutinaSection) {
      patchRutinaSection(rutinaHoy._id, section, itemData);
    }

    try {
      await markItemComplete(rutinaHoy._id, section, itemData);
    } catch {
      if (patchRutinaSection) {
        const rollbackData = previousValue === undefined
          ? { [itemId]: undefined }
          : { [itemId]: previousValue };
        patchRutinaSection(rutinaHoy._id, section, rollbackData);
      }
      console.warn(`${logPrefix} No se pudo togglear`, { section, itemId });
    }
  }, [
    mode,
    interactive,
    dragRef,
    rutinaHoy,
    markItemComplete,
    patchRutinaSection,
    currentTimeOfDay,
    logPrefix,
  ]);
}
