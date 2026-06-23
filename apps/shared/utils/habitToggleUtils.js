/**
 * Calcula el nuevo valor de completado al togglear un hábito.
 * Soporta formato boolean legacy y objeto multi-horario.
 */
export function computeNextHabitValue({
  itemValue,
  itemConfig = {},
  horario = null,
  currentTimeOfDay = null,
  isCompletedForHorario = () => false,
}) {
  const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
  const isBooleanFormat = typeof itemValue === 'boolean';
  const horariosConfig = Array.isArray(itemConfig.horarios) ? itemConfig.horarios : [];
  const hasMultipleHorarios = horariosConfig.length > 1;

  if (horario && horariosConfig.length > 0) {
    const normalizedHorario = String(horario).toUpperCase();

    if (isObjectFormat) {
      return {
        ...itemValue,
        [normalizedHorario]: !isCompletedForHorario(normalizedHorario),
      };
    }

    const newObject = {};
    horariosConfig.forEach((h) => {
      const normalizedH = String(h).toUpperCase();
      newObject[normalizedH] = normalizedH === normalizedHorario
        ? !isCompletedForHorario(normalizedHorario)
        : false;
    });
    return newObject;
  }

  if (hasMultipleHorarios) {
    const normalizedHorario = String(currentTimeOfDay || horario).toUpperCase();

    if (isObjectFormat) {
      return {
        ...itemValue,
        [normalizedHorario]: !isCompletedForHorario(normalizedHorario),
      };
    }

    const newObject = {};
    horariosConfig.forEach((h) => {
      const normalizedH = String(h).toUpperCase();
      newObject[normalizedH] = normalizedH === normalizedHorario
        ? !isCompletedForHorario(normalizedHorario)
        : false;
    });
    return newObject;
  }

  if (isObjectFormat) {
    const allCompleted = Object.values(itemValue).every(Boolean);
    return !allCompleted;
  }

  return !isCompletedForHorario();
}

/**
 * Toggle simplificado para carrusel (un horario objetivo explícito).
 */
export function computeCarouselToggleValue({
  itemValue,
  horariosConfig = [],
  normalizedHorario,
}) {
  const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
  const isBooleanFormat = typeof itemValue === 'boolean';

  if (horariosConfig.length > 1) {
    if (isObjectFormat) {
      return {
        ...itemValue,
        [normalizedHorario]: itemValue[normalizedHorario] !== true,
      };
    }

    const newObject = {};
    horariosConfig.forEach((h) => {
      const normalizedH = String(h).toUpperCase();
      newObject[normalizedH] = normalizedH === normalizedHorario
        ? !(isBooleanFormat && itemValue === true)
        : false;
    });
    return newObject;
  }

  const prev = isBooleanFormat
    ? itemValue
    : (isObjectFormat ? Object.values(itemValue).some(Boolean) : false);
  return !prev;
}
