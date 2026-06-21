import { useCallback } from 'react';
import { getHorarioToShow } from '@shared/utils/habitTimeLogic';

/**
 * Toggle de completado con soporte multi-horario.
 * @param {'ahora'|'luego'} mode - Ahora usa getHorarioToShow; Luego usa currentTimeOfDay.
 */
export default function useHabitCarouselToggle({
  mode,
  interactive,
  dragRef,
  rutinaHoy,
  markItemComplete,
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
    try {
      const prevSection = rutinaHoy?.[section] || {};
      const itemValue = prevSection[itemId];
      const itemConfig = rutinaHoy?.config?.[section]?.[itemId] || {};
      const horariosConfig = Array.isArray(itemConfig.horarios) ? itemConfig.horarios : [];

      const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
      const isBooleanFormat = typeof itemValue === 'boolean';

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

      let newValue;

      if (horariosConfig.length > 1) {
        if (isObjectFormat) {
          const horarioEspecificoCompletado = itemValue[normalizedHorario] === true;
          newValue = {
            ...itemValue,
            [normalizedHorario]: !horarioEspecificoCompletado,
          };
        } else {
          const newObject = {};
          horariosConfig.forEach((h) => {
            const normalizedH = String(h).toUpperCase();
            if (normalizedH === normalizedHorario) {
              newObject[normalizedH] = !(isBooleanFormat && itemValue === true);
            } else {
              newObject[normalizedH] = false;
            }
          });
          newValue = newObject;
        }
      } else {
        const prev = isBooleanFormat
          ? itemValue
          : (isObjectFormat ? Object.values(itemValue).some(Boolean) : false);
        newValue = !prev;
      }

      const itemData = { [itemId]: newValue };
      await markItemComplete(rutinaHoy._id, section, itemData);
    } catch {
      console.warn(`${logPrefix} No se pudo togglear`, { section, itemId });
    }
  }, [mode, interactive, dragRef, rutinaHoy, markItemComplete, currentTimeOfDay, logPrefix]);
}
