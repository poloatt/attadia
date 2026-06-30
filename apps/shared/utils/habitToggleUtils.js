/**
 * ¿Una franja concreta está completada? (boolean legacy = todas las franjas).
 */
export function isFranjaCompleted(itemValue, normalizedHorario) {
  if (itemValue === undefined || itemValue === null || itemValue === false) return false;
  if (typeof itemValue === 'boolean') return itemValue === true;
  if (typeof itemValue === 'object' && !Array.isArray(itemValue)) {
    return itemValue[String(normalizedHorario).toUpperCase()] === true;
  }
  return false;
}

/**
 * Toggle de una franja sin afectar las demás (objeto por horario).
 */
export function computeFranjaToggleValue({
  itemValue,
  horariosConfig = [],
  normalizedHorario,
}) {
  const horarios = horariosConfig.map((h) => String(h).toUpperCase());
  const horario = String(normalizedHorario).toUpperCase();
  const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
  const isBooleanFormat = typeof itemValue === 'boolean';

  if (isObjectFormat) {
    return {
      ...itemValue,
      [horario]: !isFranjaCompleted(itemValue, horario),
    };
  }

  const nextCompleted = !isFranjaCompleted(itemValue, horario);
  const newObject = {};

  if (isBooleanFormat && itemValue === true) {
    horarios.forEach((h) => {
      newObject[h] = h === horario ? nextCompleted : true;
    });
    return newObject;
  }

  horarios.forEach((h) => {
    if (h === horario) {
      newObject[h] = nextCompleted;
    } else {
      newObject[h] = isFranjaCompleted(itemValue, h);
    }
  });
  return newObject;
}

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
    return computeFranjaToggleValue({
      itemValue,
      horariosConfig,
      normalizedHorario: String(horario).toUpperCase(),
    });
  }

  if (hasMultipleHorarios) {
    return computeFranjaToggleValue({
      itemValue,
      horariosConfig,
      normalizedHorario: String(currentTimeOfDay || horario).toUpperCase(),
    });
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

  if (horariosConfig.length > 1 && normalizedHorario) {
    return computeFranjaToggleValue({
      itemValue,
      horariosConfig,
      normalizedHorario,
    });
  }

  const prev = isBooleanFormat
    ? itemValue
    : (isObjectFormat ? Object.values(itemValue).some(Boolean) : false);
  return !prev;
}
