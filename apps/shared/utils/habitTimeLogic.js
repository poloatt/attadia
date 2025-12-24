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
 * @param {boolean|Object} isCompletedToday - Si el hábito ya fue completado hoy (boolean legacy) o objeto con estado por horario (nuevo formato)
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
  
  // Detectar si isCompletedToday es un objeto (nuevo formato) o boolean (legacy)
  const isObjectFormat = typeof isCompletedToday === 'object' && isCompletedToday !== null && !Array.isArray(isCompletedToday);
  const isBooleanFormat = typeof isCompletedToday === 'boolean';
  
  // Si el horario actual está en la lista de horarios configurados, verificar si debe mostrarse
  if (normalizedHorarios.includes(normalizedTimeOfDay)) {
    if (isObjectFormat) {
      // Nuevo formato: verificar si el horario actual está completado
      const horarioActualCompletado = isCompletedToday[normalizedTimeOfDay] === true;
      // Mostrar si no está completado
      return !horarioActualCompletado;
    } else if (isBooleanFormat) {
      // Formato legacy: si está completado, no mostrar
      return !isCompletedToday;
    }
    // Si no hay información de completitud, mostrar
    return true;
  }
  
  // Para hábitos diarios con frecuencia > 1 o múltiples horarios configurados
  // Mostrar el último horario no completado del día de hoy (solo si NO está completado hoy)
  const isDiarioMultiRepeticion = (tipo === 'DIARIO' || tipo === 'PERSONALIZADO') && 
                                   (frecuencia > 1 || normalizedHorarios.length > 1);
  
  if (isDiarioMultiRepeticion) {
    // Verificar si el horario actual está completado
    let currentHorarioCompleted = false;
    if (isObjectFormat) {
      currentHorarioCompleted = isCompletedToday[normalizedTimeOfDay] === true;
    } else if (isBooleanFormat) {
      // En formato legacy, si está completado, todos los horarios están completados
      currentHorarioCompleted = isCompletedToday;
    }
    
    // Si el horario actual no está completado, mostrarlo
    if (!currentHorarioCompleted) {
      return true;
    }
    
    // Si el horario actual está completado, buscar el último horario no completado antes del actual
    const currentIndex = HORARIOS_ORDER.indexOf(normalizedTimeOfDay);
    
    if (currentIndex > 0) {
      for (let i = currentIndex - 1; i >= 0; i--) {
        const horarioAnterior = HORARIOS_ORDER[i];
        if (normalizedHorarios.includes(horarioAnterior)) {
          // Verificar si este horario anterior está completado
          let horarioAnteriorCompleted = false;
          if (isObjectFormat) {
            horarioAnteriorCompleted = isCompletedToday[horarioAnterior] === true;
          } else if (isBooleanFormat) {
            horarioAnteriorCompleted = isCompletedToday;
          }
          
          // Si el horario anterior no está completado, mostrarlo
          if (!horarioAnteriorCompleted) {
            return true;
          }
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
 * Determina el horario específico que debe mostrarse para un hábito diario con múltiples horarios
 * Retorna el horario actual si no está completado, o el último horario no completado antes del actual
 * 
 * @param {Array<string>|undefined} horarios - Array de horarios configurados (ej: ['MAÑANA', 'TARDE'])
 * @param {string} currentTimeOfDay - Horario actual ('MAÑANA', 'TARDE' o 'NOCHE')
 * @param {boolean|Object} isCompletedToday - Si el hábito ya fue completado hoy (boolean legacy) o objeto con estado por horario (nuevo formato)
 * @param {string} tipo - Tipo de hábito ('DIARIO', 'SEMANAL', etc.) - opcional
 * @param {number} frecuencia - Frecuencia del hábito - opcional
 * @returns {string|null} - El horario específico que debe mostrarse, o null si no debe mostrarse
 */
export const getHorarioToShow = (horarios, currentTimeOfDay, isCompletedToday = false, tipo = 'DIARIO', frecuencia = 1) => {
  // Si no hay horarios configurados, retornar null (no hay horario específico)
  if (!horarios || !Array.isArray(horarios) || horarios.length === 0) {
    return null;
  }
  
  // Normalizar horarios a mayúsculas
  const normalizedHorarios = horarios.map(h => String(h).toUpperCase());
  const normalizedTimeOfDay = String(currentTimeOfDay).toUpperCase();
  
  // Detectar si isCompletedToday es un objeto (nuevo formato) o boolean (legacy)
  const isObjectFormat = typeof isCompletedToday === 'object' && isCompletedToday !== null && !Array.isArray(isCompletedToday);
  const isBooleanFormat = typeof isCompletedToday === 'boolean';
  
  // Función helper para verificar si un horario está completado
  const isHorarioCompleted = (horario) => {
    if (isObjectFormat) {
      return isCompletedToday[horario] === true;
    } else if (isBooleanFormat) {
      // En formato legacy, si está completado, todos los horarios están completados
      return isCompletedToday;
    }
    return false;
  };
  
  // Si el horario actual está en la lista de horarios configurados
  if (normalizedHorarios.includes(normalizedTimeOfDay)) {
    // Si no está completado, mostrar el horario actual
    if (!isHorarioCompleted(normalizedTimeOfDay)) {
      return normalizedTimeOfDay;
    }
    
    // Si está completado, buscar el último horario no completado antes del actual
    const currentIndex = HORARIOS_ORDER.indexOf(normalizedTimeOfDay);
    if (currentIndex > 0) {
      for (let i = currentIndex - 1; i >= 0; i--) {
        const horarioAnterior = HORARIOS_ORDER[i];
        if (normalizedHorarios.includes(horarioAnterior) && !isHorarioCompleted(horarioAnterior)) {
          return horarioAnterior;
        }
      }
    }
  }
  
  // Para hábitos diarios con frecuencia > 1 o múltiples horarios configurados
  // Buscar el último horario no completado antes del horario actual
  const isDiarioMultiRepeticion = (tipo === 'DIARIO' || tipo === 'PERSONALIZADO') && 
                                   (frecuencia > 1 || normalizedHorarios.length > 1);
  
  if (isDiarioMultiRepeticion) {
    const currentIndex = HORARIOS_ORDER.indexOf(normalizedTimeOfDay);
    if (currentIndex > 0) {
      for (let i = currentIndex - 1; i >= 0; i--) {
        const horarioAnterior = HORARIOS_ORDER[i];
        if (normalizedHorarios.includes(horarioAnterior) && !isHorarioCompleted(horarioAnterior)) {
          return horarioAnterior;
        }
      }
    }
  }
  
  // Si no hay horario específico para mostrar
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
  getActiveHabitForTimeOfDay,
  getHorarioToShow
};

