/**
 * Utilidades para la lógica de horarios de hábitos
 * 
 * Lógica mejorada: 
 * - Para hábitos diarios con múltiples repeticiones: mostrar el último horario no completado del día de hoy
 * - Si hay un horario específico para el horario actual, mostrarlo
 * - Solo considerar el día de hoy, no días anteriores
 */

/**
 * Orden de horarios del día (de más temprano a más tarde)
 */
const HORARIOS_ORDER = ['MAÑANA', 'TARDE', 'NOCHE'];

/**
 * Determina si un hábito debe mostrarse según el horario actual
 * Para hábitos diarios con múltiples repeticiones, muestra el último horario no completado del día de hoy
 * 
 * @param {Array<string>|undefined} horarios - Array de horarios configurados (ej: ['MAÑANA', 'TARDE'])
 * @param {string} currentTimeOfDay - Horario actual ('MAÑANA', 'TARDE' o 'NOCHE')
 * @param {boolean} isCompletedToday - Si el hábito ya fue completado hoy (opcional)
 * @param {string} tipo - Tipo de hábito ('DIARIO', 'SEMANAL', etc.) - opcional
 * @param {number} frecuencia - Frecuencia del hábito - opcional
 * @returns {boolean} - true si el hábito debe mostrarse, false en caso contrario
 */
export const shouldShowHabitForCurrentTime = (horarios, currentTimeOfDay, isCompletedToday = false, tipo = 'DIARIO', frecuencia = 1) => {
  // Si no hay horarios configurados, mostrar siempre (comportamiento por defecto)
  if (!horarios || !Array.isArray(horarios) || horarios.length === 0) {
    return true;
  }
  
  // Normalizar horarios a mayúsculas
  const normalizedHorarios = horarios.map(h => String(h).toUpperCase());
  const normalizedTimeOfDay = String(currentTimeOfDay).toUpperCase();
  
  // Si el horario actual está en la lista de horarios configurados, mostrarlo
  if (normalizedHorarios.includes(normalizedTimeOfDay)) {
    return true;
  }
  
  // Para hábitos diarios con frecuencia > 1 o múltiples horarios configurados
  // Mostrar el último horario no completado del día de hoy (solo si NO está completado hoy)
  const isDiarioMultiRepeticion = (tipo === 'DIARIO' || tipo === 'PERSONALIZADO') && 
                                   (frecuencia > 1 || normalizedHorarios.length > 1);
  
  if (isDiarioMultiRepeticion && !isCompletedToday) {
    // Encontrar el último horario no completado antes del horario actual
    const currentIndex = HORARIOS_ORDER.indexOf(normalizedTimeOfDay);
    
    // Si el horario actual no está en la lista, buscar el último horario configurado antes del actual
    if (currentIndex > 0) {
      for (let i = currentIndex - 1; i >= 0; i--) {
        const horarioAnterior = HORARIOS_ORDER[i];
        if (normalizedHorarios.includes(horarioAnterior)) {
          // Encontramos un horario anterior no completado del día de hoy, mostrarlo
          return true;
        }
      }
    }
  }
  
  // Si no hay horario específico para el actual y no es un hábito diario con múltiples repeticiones
  return false;
};

/**
 * Retorna el horario específico que debe mostrarse ahora (solo el actual)
 * 
 * @param {Array<string>|undefined} horarios - Array de horarios configurados
 * @param {string} currentTimeOfDay - Horario actual
 * @returns {string|null} - El horario actual si está configurado, null en caso contrario
 */
export const getCurrentTimeOfDayHabit = (horarios, currentTimeOfDay) => {
  if (!horarios || !Array.isArray(horarios) || horarios.length === 0) {
    return null; // Sin horarios configurados
  }
  
  const normalizedHorarios = horarios.map(h => String(h).toUpperCase());
  const normalizedTimeOfDay = String(currentTimeOfDay).toUpperCase();
  
  if (normalizedHorarios.includes(normalizedTimeOfDay)) {
    return normalizedTimeOfDay;
  }
  
  return null;
};

/**
 * Filtra una lista de hábitos para retornar solo los del horario actual
 * 
 * @param {Array} habits - Lista de hábitos
 * @param {string} currentTimeOfDay - Horario actual
 * @param {Function} getHorarios - Función que extrae los horarios de un hábito (habitat) => horarios
 * @returns {Array} - Lista filtrada de hábitos
 */
export const getActiveHabitForTimeOfDay = (habits, currentTimeOfDay, getHorarios = (habit) => habit?.config?.horarios) => {
  if (!Array.isArray(habits)) {
    return [];
  }
  
  return habits.filter(habit => {
    const horarios = getHorarios(habit);
    return shouldShowHabitForCurrentTime(horarios, currentTimeOfDay);
  });
};

export default {
  shouldShowHabitForCurrentTime,
  getCurrentTimeOfDayHabit,
  getActiveHabitForTimeOfDay
};

