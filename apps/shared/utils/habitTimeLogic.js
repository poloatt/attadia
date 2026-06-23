/**
 * Utilidades para la lógica de horarios de hábitos
 *
 * Un hábito solo es visible en las ventanas configuradas (MAÑANA, TARDE, NOCHE).
 * Dentro de cada ventana, se oculta si ese horario ya fue completado hoy.
 */

import { isHabitHorarioCompleted } from './habitCompletionUtils';
import { VALID_TIME_OF_DAY } from './timeOfDayUtils';

const HORARIOS_ORDER = VALID_TIME_OF_DAY;

function normalizeHorarios(horarios) {
  if (!horarios || !Array.isArray(horarios)) return [];
  return horarios.map((h) => String(h).toUpperCase());
}

function getCurrentHorarioIndex(currentTimeOfDay) {
  return HORARIOS_ORDER.indexOf(String(currentTimeOfDay).toUpperCase());
}

/** Alguna franja configurada ya pasó hoy (sin incluir la ventana actual). */
export function hasConfiguredHorarioPassed(horarios, currentTimeOfDay) {
  const normalizedHorarios = normalizeHorarios(horarios);
  if (normalizedHorarios.length === 0) return false;

  const currentIndex = getCurrentHorarioIndex(currentTimeOfDay);
  if (currentIndex < 0) return false;
  if (normalizedHorarios.includes(HORARIOS_ORDER[currentIndex])) return false;

  for (let i = 0; i < currentIndex; i += 1) {
    if (normalizedHorarios.includes(HORARIOS_ORDER[i])) return true;
  }
  return false;
}

/**
 * Próximo horario configurado pendiente después del horario actual (para carrusel "Luego").
 */
export const getNextPendingHorario = (horarios, currentTimeOfDay, isCompletedToday = false) => {
  if (!horarios || !Array.isArray(horarios) || horarios.length === 0) {
    return null;
  }

  const normalizedHorarios = normalizeHorarios(horarios);
  const currentIndex = getCurrentHorarioIndex(currentTimeOfDay);
  if (currentIndex < 0) return null;

  for (let i = currentIndex + 1; i < HORARIOS_ORDER.length; i += 1) {
    const horario = HORARIOS_ORDER[i];
    if (normalizedHorarios.includes(horario) && !isHabitHorarioCompleted(isCompletedToday, horario)) {
      return horario;
    }
  }

  return null;
};

/**
 * Horario a mostrar/marcar en el carrusel según modo Ahora/Luego.
 * - ahora: ventana actual configurada y pendiente
 * - luego: próxima ventana futura pendiente
 */
export const getHorarioForCarousel = (
  mode,
  horarios,
  currentTimeOfDay,
  isCompletedToday = false,
) => {
  if (!horarios || !Array.isArray(horarios) || horarios.length === 0) {
    return null;
  }

  const normalizedHorarios = normalizeHorarios(horarios);
  const normalizedTimeOfDay = String(currentTimeOfDay).toUpperCase();

  if (mode === 'ahora') {
    if (!normalizedHorarios.includes(normalizedTimeOfDay)) return null;
    if (isHabitHorarioCompleted(isCompletedToday, normalizedTimeOfDay)) return null;
    return normalizedTimeOfDay;
  }

  if (mode === 'luego') {
    return getNextPendingHorario(horarios, currentTimeOfDay, isCompletedToday);
  }

  return null;
};

/**
 * Franjas pendientes para carrusel "Ahora" (retrasadas + ventana actual).
 * Sin horarios: un solo icono si sigue pendiente hoy.
 * Con 2+ franjas: puede devolver retrasada + actual el mismo día.
 * frecuencia > 1 con una sola franja: máximo un icono en Ahora.
 */
export const getDailyCarouselAhoraHorarios = (
  horarios,
  currentTimeOfDay,
  itemValue,
) => {
  if (!horarios || !Array.isArray(horarios) || horarios.length === 0) {
    if (typeof itemValue === 'boolean' && itemValue === true) return [];
    return [null];
  }

  const normalizedHorarios = normalizeHorarios(horarios);
  const currentIndex = getCurrentHorarioIndex(currentTimeOfDay);
  if (currentIndex < 0) return [];

  const slots = [];

  for (let i = 0; i < currentIndex; i += 1) {
    const horario = HORARIOS_ORDER[i];
    if (normalizedHorarios.includes(horario) && !isHabitHorarioCompleted(itemValue, horario)) {
      slots.push(horario);
    }
  }

  const currentHorario = HORARIOS_ORDER[currentIndex];
  if (
    normalizedHorarios.includes(currentHorario)
    && !isHabitHorarioCompleted(itemValue, currentHorario)
  ) {
    slots.push(currentHorario);
  }

  if (slots.length === 0) return [];

  const multiFranja = normalizedHorarios.length >= 2;
  if (multiFranja) return slots;

  return slots.slice(0, 1);
};

/**
 * Próximas franjas futuras pendientes para carrusel "Luego" (solo hoy, no retrasadas).
 */
export const getDailyCarouselLuegoHorarios = (
  horarios,
  currentTimeOfDay,
  itemValue,
) => {
  if (!horarios || !Array.isArray(horarios) || horarios.length === 0) {
    return [];
  }

  const normalizedHorarios = normalizeHorarios(horarios);
  const currentIndex = getCurrentHorarioIndex(currentTimeOfDay);
  if (currentIndex < 0) return [];

  const slots = [];
  for (let i = currentIndex + 1; i < HORARIOS_ORDER.length; i += 1) {
    const horario = HORARIOS_ORDER[i];
    if (normalizedHorarios.includes(horario) && !isHabitHorarioCompleted(itemValue, horario)) {
      slots.push(horario);
    }
  }
  return slots;
};

/**
 * ¿Un hábito diario multi-horario debe aparecer en el carrusel "Luego"?
 * @deprecated Usar getDailyCarouselLuegoHorarios
 */
export const shouldShowDailyInCarouselLuego = (horarios, currentTimeOfDay, isCompletedToday = false) => (
  getDailyCarouselLuegoHorarios(horarios, currentTimeOfDay, isCompletedToday).length > 0
);

/**
 * Determina si un hábito debe mostrarse según el horario actual.
 * Solo devuelve true si el horario actual está configurado y pendiente.
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
  
  // Solo mostrar en las ventanas configuradas (p. ej. MAÑANA + NOCHE, no en TARDE)
  if (!normalizedHorarios.includes(normalizedTimeOfDay)) {
    return false;
  }

  if (isObjectFormat) {
    return isCompletedToday[normalizedTimeOfDay] !== true;
  }
  if (isBooleanFormat) {
    return !isCompletedToday;
  }
  return true;
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
  return getHorarioForCarousel('ahora', horarios, currentTimeOfDay, isCompletedToday);
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
  getHorarioToShow,
  getHorarioForCarousel,
  getNextPendingHorario,
  getDailyCarouselAhoraHorarios,
  getDailyCarouselLuegoHorarios,
  hasConfiguredHorarioPassed,
};

